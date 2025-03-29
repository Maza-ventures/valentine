import { Command } from 'commander';
import { PrismaClient, CapitalCallStatus } from '@prisma/client';
import { getAuthenticatedUser } from '../utils/auth';
import { formatCurrency } from '../../src/lib/utils';

const prisma = new PrismaClient();

export function capitalCallCommands(program: Command) {
  const capitalCall = program.command('capital-call')
    .description('Manage capital calls');

  // List capital calls
  capitalCall
    .command('list')
    .description('List capital calls')
    .option('--fund <fundName>', 'Filter by fund name')
    .option('--status <status>', 'Filter by status (PENDING, PARTIALLY_PAID, FULLY_PAID, OVERDUE)')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Build filter
        const filter: any = {};
        
        if (options.fund) {
          const fund = await prisma.fund.findFirst({
            where: { name: options.fund },
          });
          
          if (!fund) {
            console.error(`Fund '${options.fund}' not found.`);
            return;
          }
          
          filter.fundId = fund.id;
        }
        
        if (options.status) {
          if (!Object.values(CapitalCallStatus).includes(options.status as CapitalCallStatus)) {
            console.error(`Invalid status. Must be one of: ${Object.values(CapitalCallStatus).join(', ')}`);
            return;
          }
          
          filter.status = options.status;
        }

        // Get capital calls
        const capitalCalls = await prisma.capitalCall.findMany({
          where: filter,
          include: {
            fund: true,
            responses: {
              include: {
                limitedPartner: true,
              },
            },
          },
          orderBy: [
            { date: 'desc' },
          ],
        });

        if (capitalCalls.length === 0) {
          console.log('No capital calls found.');
          return;
        }

        console.log(`Found ${capitalCalls.length} capital calls:\n`);
        capitalCalls.forEach((call) => {
          const totalPaid = call.responses.reduce(
            (sum, response) => sum + response.amountPaid,
            0
          );
          
          const percentPaid = call.amount > 0 
            ? Math.round((totalPaid / call.amount) * 100) 
            : 0;

          console.log(`ID: ${call.id}`);
          console.log(`Fund: ${call.fund.name}`);
          console.log(`Amount: ${formatCurrency(call.amount)}`);
          console.log(`Percentage of Commitments: ${call.percentage}%`);
          console.log(`Date: ${new Date(call.date).toLocaleDateString()}`);
          console.log(`Due Date: ${new Date(call.dueDate).toLocaleDateString()}`);
          console.log(`Status: ${call.status}`);
          console.log(`Amount Paid: ${formatCurrency(totalPaid)} (${percentPaid}%)`);
          console.log(`LP Responses: ${call.responses.length}`);
          console.log('---');
        });
      } catch (error) {
        console.error('Error listing capital calls:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Create a capital call
  capitalCall
    .command('create')
    .description('Create a new capital call')
    .requiredOption('--fund <fundName>', 'Fund name')
    .requiredOption('--amount <amount>', 'Capital call amount in USD', parseFloat)
    .requiredOption('--due <dueDate>', 'Due date (YYYY-MM-DD)')
    .option('--percentage <percentage>', 'Percentage of total commitments', parseFloat)
    .option('--description <description>', 'Description of the capital call')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Find fund
        const fund = await prisma.fund.findFirst({
          where: { name: options.fund },
          include: {
            limitedPartners: true,
          },
        });

        if (!fund) {
          console.error(`Fund '${options.fund}' not found.`);
          return;
        }

        // Check if user has permission to create capital calls for this fund
        if (user.role !== 'SUPER_ADMIN' && fund.ownerId !== user.id) {
          console.error('You do not have permission to create capital calls for this fund.');
          return;
        }

        // Calculate percentage if not provided
        let percentage = options.percentage;
        if (!percentage) {
          const totalCommitments = fund.limitedPartners.reduce(
            (sum, lp) => sum + lp.commitment,
            0
          );
          
          if (totalCommitments > 0) {
            percentage = (options.amount / totalCommitments) * 100;
          } else {
            console.error('Cannot calculate percentage: No LP commitments found for this fund.');
            return;
          }
        }

        // Create the capital call
        const capitalCall = await prisma.capitalCall.create({
          data: {
            amount: options.amount,
            date: new Date(),
            dueDate: new Date(options.due),
            percentage,
            description: options.description,
            status: 'PENDING',
            fundId: fund.id,
          },
        });

        // Create capital call responses for each LP
        const responsePromises = fund.limitedPartners.map((lp) => {
          const lpAmount = (lp.commitment * percentage) / 100;
          return prisma.capitalCallResponse.create({
            data: {
              amountPaid: 0,
              status: 'PENDING',
              lpId: lp.id,
              capitalCallId: capitalCall.id,
            },
          });
        });

        await Promise.all(responsePromises);

        console.log(`Capital call created successfully!`);
        console.log(`ID: ${capitalCall.id}`);
        console.log(`Fund: ${fund.name}`);
        console.log(`Amount: ${formatCurrency(capitalCall.amount)}`);
        console.log(`Percentage of Commitments: ${percentage.toFixed(2)}%`);
        console.log(`Date: ${new Date(capitalCall.date).toLocaleDateString()}`);
        console.log(`Due Date: ${new Date(capitalCall.dueDate).toLocaleDateString()}`);
        console.log(`Status: ${capitalCall.status}`);
        console.log(`Created LP Response Records: ${fund.limitedPartners.length}`);
      } catch (error) {
        console.error('Error creating capital call:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Record a payment
  capitalCall
    .command('record-payment')
    .description('Record a payment for a capital call')
    .requiredOption('--capital-call-id <id>', 'Capital call ID')
    .requiredOption('--lp <lpName>', 'Limited Partner name')
    .requiredOption('--amount <amount>', 'Payment amount in USD', parseFloat)
    .option('--date <date>', 'Payment date (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
    .option('--notes <notes>', 'Payment notes')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Find capital call
        const capitalCall = await prisma.capitalCall.findUnique({
          where: { id: options.capitalCallId },
          include: {
            fund: true,
          },
        });

        if (!capitalCall) {
          console.error(`Capital call with ID ${options.capitalCallId} not found.`);
          return;
        }

        // Check if user has permission to record payments for this fund
        if (user.role !== 'SUPER_ADMIN' && capitalCall.fund.ownerId !== user.id) {
          console.error('You do not have permission to record payments for this fund.');
          return;
        }

        // Find LP
        const lp = await prisma.limitedPartner.findFirst({
          where: {
            name: options.lp,
            fundId: capitalCall.fundId,
          },
        });

        if (!lp) {
          console.error(`Limited Partner '${options.lp}' not found in this fund.`);
          return;
        }

        // Find capital call response
        const response = await prisma.capitalCallResponse.findFirst({
          where: {
            lpId: lp.id,
            capitalCallId: capitalCall.id,
          },
        });

        if (!response) {
          console.error(`No response record found for this LP and capital call.`);
          return;
        }

        // Calculate expected amount
        const expectedAmount = (lp.commitment * capitalCall.percentage) / 100;
        
        // Update the response
        const updatedResponse = await prisma.capitalCallResponse.update({
          where: { id: response.id },
          data: {
            amountPaid: options.amount,
            datePaid: new Date(options.date),
            notes: options.notes,
            status: options.amount >= expectedAmount ? 'PAID' : 'PARTIALLY_PAID',
          },
        });

        // Update capital call status
        await updateCapitalCallStatus(capitalCall.id);

        console.log(`Payment recorded successfully!`);
        console.log(`Capital Call: ${capitalCall.id}`);
        console.log(`Fund: ${capitalCall.fund.name}`);
        console.log(`LP: ${lp.name}`);
        console.log(`Amount Paid: ${formatCurrency(options.amount)}`);
        console.log(`Expected Amount: ${formatCurrency(expectedAmount)}`);
        console.log(`Payment Status: ${updatedResponse.status}`);
        console.log(`Payment Date: ${new Date(options.date).toLocaleDateString()}`);
      } catch (error) {
        console.error('Error recording payment:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  return capitalCall;
}

// Helper function to update capital call status based on responses
async function updateCapitalCallStatus(capitalCallId: string) {
  const capitalCall = await prisma.capitalCall.findUnique({
    where: { id: capitalCallId },
    include: {
      responses: true,
    },
  });

  if (!capitalCall) return;

  const totalExpected = capitalCall.amount;
  const totalPaid = capitalCall.responses.reduce(
    (sum, response) => sum + response.amountPaid,
    0
  );

  let newStatus: CapitalCallStatus;
  
  if (totalPaid >= totalExpected) {
    newStatus = 'FULLY_PAID';
  } else if (totalPaid > 0) {
    newStatus = 'PARTIALLY_PAID';
  } else if (new Date() > new Date(capitalCall.dueDate)) {
    newStatus = 'OVERDUE';
  } else {
    newStatus = 'PENDING';
  }

  await prisma.capitalCall.update({
    where: { id: capitalCallId },
    data: {
      status: newStatus,
    },
  });
}
