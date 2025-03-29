import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../utils/auth';
import { formatCurrency } from '../../src/lib/utils';

const prisma = new PrismaClient();

export function fundCommands(program: Command) {
  const fund = program.command('fund')
    .description('Manage funds');

  // List all funds
  fund
    .command('list')
    .description('List all funds')
    .action(async () => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Get funds based on user role
        const funds = await prisma.fund.findMany({
          where: user.role !== 'SUPER_ADMIN' ? { ownerId: user.id } : undefined,
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
            investments: true,
            limitedPartners: true,
          },
        });

        if (funds.length === 0) {
          console.log('No funds found.');
          return;
        }

        console.log(`Found ${funds.length} funds:\n`);
        funds.forEach((fund) => {
          const totalCommitments = fund.limitedPartners.reduce(
            (sum, lp) => sum + lp.commitment,
            0
          );
          const totalInvested = fund.investments.reduce(
            (sum, inv) => sum + inv.amount,
            0
          );

          console.log(`ID: ${fund.id}`);
          console.log(`Name: ${fund.name}`);
          console.log(`Description: ${fund.description || 'N/A'}`);
          console.log(`Target Size: ${fund.target ? formatCurrency(fund.target) : 'N/A'}`);
          console.log(`Vintage: ${fund.vintage || 'N/A'}`);
          console.log(`Status: ${fund.status || 'N/A'}`);
          console.log(`Manager: ${fund.owner.name} (${fund.owner.email})`);
          console.log(`Total Commitments: ${formatCurrency(totalCommitments)}`);
          console.log(`Total Invested: ${formatCurrency(totalInvested)}`);
          console.log(`LPs: ${fund.limitedPartners.length}`);
          console.log(`Investments: ${fund.investments.length}`);
          console.log('---');
        });
      } catch (error) {
        console.error('Error listing funds:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Create a new fund
  fund
    .command('create')
    .description('Create a new fund')
    .requiredOption('--name <name>', 'Fund name')
    .option('--description <description>', 'Fund description')
    .option('--target <target>', 'Target fund size in USD', parseFloat)
    .option('--vintage <vintage>', 'Fund vintage year', parseInt)
    .option('--status <status>', 'Fund status (e.g., Active, Fundraising, Closed)')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Check if user has permission to create funds
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'FUND_MANAGER') {
          console.error('You do not have permission to create funds.');
          return;
        }

        // Create the fund
        const fund = await prisma.fund.create({
          data: {
            name: options.name,
            description: options.description,
            target: options.target,
            vintage: options.vintage,
            status: options.status,
            ownerId: user.id,
          },
        });

        console.log(`Fund created successfully!`);
        console.log(`ID: ${fund.id}`);
        console.log(`Name: ${fund.name}`);
        console.log(`Description: ${fund.description || 'N/A'}`);
        console.log(`Target Size: ${fund.target ? formatCurrency(fund.target) : 'N/A'}`);
        console.log(`Vintage: ${fund.vintage || 'N/A'}`);
        console.log(`Status: ${fund.status || 'N/A'}`);
      } catch (error) {
        console.error('Error creating fund:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Get fund details
  fund
    .command('get')
    .description('Get fund details')
    .requiredOption('--id <id>', 'Fund ID')
    .option('--detailed', 'Show detailed information including LPs and investments')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Get fund details
        const fund = await prisma.fund.findUnique({
          where: { id: options.id },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            limitedPartners: options.detailed,
            investments: options.detailed ? {
              include: {
                company: true,
              },
            } : false,
            capitalCalls: options.detailed,
          },
        });

        if (!fund) {
          console.error(`Fund with ID ${options.id} not found.`);
          return;
        }

        // Check if user has permission to view this fund
        if (user.role !== 'SUPER_ADMIN' && fund.ownerId !== user.id) {
          console.error('You do not have permission to view this fund.');
          return;
        }

        console.log(`Fund Details:`);
        console.log(`ID: ${fund.id}`);
        console.log(`Name: ${fund.name}`);
        console.log(`Description: ${fund.description || 'N/A'}`);
        console.log(`Target Size: ${fund.target ? formatCurrency(fund.target) : 'N/A'}`);
        console.log(`Vintage: ${fund.vintage || 'N/A'}`);
        console.log(`Status: ${fund.status || 'N/A'}`);
        console.log(`Manager: ${fund.owner.name} (${fund.owner.email})`);
        console.log(`Created: ${fund.createdAt}`);
        console.log(`Updated: ${fund.updatedAt}`);

        if (options.detailed) {
          // Show LPs
          if (fund.limitedPartners && fund.limitedPartners.length > 0) {
            console.log('\nLimited Partners:');
            fund.limitedPartners.forEach((lp) => {
              console.log(`- ${lp.name}: ${formatCurrency(lp.commitment)}`);
            });
          } else {
            console.log('\nNo Limited Partners.');
          }

          // Show investments
          if (fund.investments && fund.investments.length > 0) {
            console.log('\nInvestments:');
            fund.investments.forEach((inv) => {
              console.log(`- ${inv.company.name}: ${formatCurrency(inv.amount)} (${inv.round || 'N/A'}, ${new Date(inv.date).toLocaleDateString()})`);
            });
          } else {
            console.log('\nNo Investments.');
          }

          // Show capital calls
          if (fund.capitalCalls && fund.capitalCalls.length > 0) {
            console.log('\nCapital Calls:');
            fund.capitalCalls.forEach((call) => {
              console.log(`- ${formatCurrency(call.amount)} (${call.status}, Due: ${new Date(call.dueDate).toLocaleDateString()})`);
            });
          } else {
            console.log('\nNo Capital Calls.');
          }
        }
      } catch (error) {
        console.error('Error getting fund details:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Update a fund
  fund
    .command('update')
    .description('Update a fund')
    .requiredOption('--id <id>', 'Fund ID')
    .option('--name <name>', 'Fund name')
    .option('--description <description>', 'Fund description')
    .option('--target <target>', 'Target fund size in USD', parseFloat)
    .option('--vintage <vintage>', 'Fund vintage year', parseInt)
    .option('--status <status>', 'Fund status (e.g., Active, Fundraising, Closed)')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Check if fund exists
        const existingFund = await prisma.fund.findUnique({
          where: { id: options.id },
        });

        if (!existingFund) {
          console.error(`Fund with ID ${options.id} not found.`);
          return;
        }

        // Check if user has permission to update this fund
        if (user.role !== 'SUPER_ADMIN' && existingFund.ownerId !== user.id) {
          console.error('You do not have permission to update this fund.');
          return;
        }

        // Update the fund
        const updateData: any = {};
        if (options.name) updateData.name = options.name;
        if (options.description !== undefined) updateData.description = options.description;
        if (options.target !== undefined) updateData.target = options.target;
        if (options.vintage !== undefined) updateData.vintage = options.vintage;
        if (options.status !== undefined) updateData.status = options.status;

        const updatedFund = await prisma.fund.update({
          where: { id: options.id },
          data: updateData,
        });

        console.log(`Fund updated successfully!`);
        console.log(`ID: ${updatedFund.id}`);
        console.log(`Name: ${updatedFund.name}`);
        console.log(`Description: ${updatedFund.description || 'N/A'}`);
        console.log(`Target Size: ${updatedFund.target ? formatCurrency(updatedFund.target) : 'N/A'}`);
        console.log(`Vintage: ${updatedFund.vintage || 'N/A'}`);
        console.log(`Status: ${updatedFund.status || 'N/A'}`);
      } catch (error) {
        console.error('Error updating fund:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  return fund;
}
