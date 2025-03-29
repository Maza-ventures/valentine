import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../utils/auth';
import { formatCurrency } from '../../src/lib/utils';

const prisma = new PrismaClient();

export function lpCommands(program: Command) {
  const lp = program.command('lp')
    .description('Manage limited partners');

  // List LPs
  lp
    .command('list')
    .description('List limited partners')
    .option('--fund <fundName>', 'Filter by fund name')
    .option('--type <type>', 'Filter by LP type (e.g., Individual, Institution)')
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
        
        if (options.type) {
          filter.type = options.type;
        }

        // Get LPs
        const lps = await prisma.limitedPartner.findMany({
          where: filter,
          include: {
            fund: true,
            responses: {
              include: {
                capitalCall: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        if (lps.length === 0) {
          console.log('No limited partners found.');
          return;
        }

        console.log(`Found ${lps.length} limited partners:\n`);
        lps.forEach((lp) => {
          // Calculate total paid
          const totalPaid = lp.responses.reduce(
            (sum, response) => sum + response.amountPaid,
            0
          );
          
          // Calculate total called
          const totalCalled = lp.responses.reduce(
            (sum, response) => sum + response.capitalCall.amount * (response.capitalCall.percentage / 100),
            0
          );

          console.log(`ID: ${lp.id}`);
          console.log(`Name: ${lp.name}`);
          console.log(`Email: ${lp.email || 'N/A'}`);
          console.log(`Type: ${lp.type || 'N/A'}`);
          console.log(`Fund: ${lp.fund.name}`);
          console.log(`Commitment: ${formatCurrency(lp.commitment)}`);
          console.log(`Capital Called: ${formatCurrency(totalCalled)} (${Math.round((totalCalled / lp.commitment) * 100)}%)`);
          console.log(`Capital Paid: ${formatCurrency(totalPaid)}`);
          console.log(`Outstanding: ${formatCurrency(totalCalled - totalPaid)}`);
          console.log('---');
        });
      } catch (error) {
        console.error('Error listing limited partners:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Create an LP
  lp
    .command('create')
    .description('Create a new limited partner')
    .requiredOption('--name <name>', 'LP name')
    .requiredOption('--fund <fundName>', 'Fund name')
    .requiredOption('--commitment <amount>', 'Commitment amount in USD', parseFloat)
    .option('--email <email>', 'LP email')
    .option('--phone <phone>', 'LP phone')
    .option('--type <type>', 'LP type (e.g., Individual, Institution)')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Find fund
        const fund = await prisma.fund.findFirst({
          where: { name: options.fund },
        });

        if (!fund) {
          console.error(`Fund '${options.fund}' not found.`);
          return;
        }

        // Check if user has permission to add LPs to this fund
        if (user.role !== 'SUPER_ADMIN' && fund.ownerId !== user.id) {
          console.error('You do not have permission to add LPs to this fund.');
          return;
        }

        // Create the LP
        const lp = await prisma.limitedPartner.create({
          data: {
            name: options.name,
            email: options.email,
            phone: options.phone,
            type: options.type,
            commitment: options.commitment,
            fundId: fund.id,
          },
        });

        console.log(`Limited Partner created successfully!`);
        console.log(`ID: ${lp.id}`);
        console.log(`Name: ${lp.name}`);
        console.log(`Email: ${lp.email || 'N/A'}`);
        console.log(`Phone: ${lp.phone || 'N/A'}`);
        console.log(`Type: ${lp.type || 'N/A'}`);
        console.log(`Fund: ${fund.name}`);
        console.log(`Commitment: ${formatCurrency(lp.commitment)}`);
      } catch (error) {
        console.error('Error creating limited partner:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Generate LP statement
  lp
    .command('statement')
    .description('Generate a capital account statement for an LP')
    .requiredOption('--lp <lpName>', 'LP name')
    .requiredOption('--fund <fundName>', 'Fund name')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Find LP and fund
        const lp = await prisma.limitedPartner.findFirst({
          where: {
            name: options.lp,
            fund: {
              name: options.fund,
            },
          },
          include: {
            fund: true,
            responses: {
              include: {
                capitalCall: true,
              },
            },
          },
        });

        if (!lp) {
          console.error(`LP '${options.lp}' in fund '${options.fund}' not found.`);
          return;
        }

        // Check if user has permission to view this LP's statement
        if (user.role !== 'SUPER_ADMIN' && lp.fund.ownerId !== user.id) {
          console.error('You do not have permission to view this LP statement.');
          return;
        }

        // Calculate statement data
        const commitment = lp.commitment;
        
        // Calculate totals
        const totalCalled = lp.responses.reduce(
          (sum, response) => sum + (response.capitalCall.amount * (response.capitalCall.percentage / 100)),
          0
        );
        
        const totalPaid = lp.responses.reduce(
          (sum, response) => sum + response.amountPaid,
          0
        );
        
        const outstandingBalance = totalCalled - totalPaid;
        const remainingCommitment = commitment - totalCalled;

        // Print statement
        console.log(`\n=== CAPITAL ACCOUNT STATEMENT ===`);
        console.log(`Limited Partner: ${lp.name}`);
        console.log(`Fund: ${lp.fund.name}`);
        console.log(`Date: ${new Date().toLocaleDateString()}`);
        console.log(`\nSUMMARY:`);
        console.log(`Total Commitment: ${formatCurrency(commitment)}`);
        console.log(`Total Capital Called: ${formatCurrency(totalCalled)} (${Math.round((totalCalled / commitment) * 100)}%)`);
        console.log(`Total Capital Paid: ${formatCurrency(totalPaid)}`);
        console.log(`Outstanding Balance: ${formatCurrency(outstandingBalance)}`);
        console.log(`Remaining Commitment: ${formatCurrency(remainingCommitment)}`);
        
        if (lp.responses.length > 0) {
          console.log(`\nCAPITAL CALL HISTORY:`);
          lp.responses.forEach((response) => {
            const expectedAmount = (lp.commitment * response.capitalCall.percentage) / 100;
            console.log(`- Capital Call: ${new Date(response.capitalCall.date).toLocaleDateString()}`);
            console.log(`  Due Date: ${new Date(response.capitalCall.dueDate).toLocaleDateString()}`);
            console.log(`  Expected Amount: ${formatCurrency(expectedAmount)} (${response.capitalCall.percentage}% of commitment)`);
            console.log(`  Amount Paid: ${formatCurrency(response.amountPaid)}`);
            if (response.datePaid) {
              console.log(`  Date Paid: ${new Date(response.datePaid).toLocaleDateString()}`);
            }
            console.log(`  Status: ${response.status}`);
            console.log('  ---');
          });
        } else {
          console.log(`\nNo capital calls recorded yet.`);
        }
      } catch (error) {
        console.error('Error generating LP statement:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  return lp;
}
