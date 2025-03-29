import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../utils/auth';
import { formatCurrency } from '../../src/lib/utils';

const prisma = new PrismaClient();

export function checkInCommands(program: Command) {
  const checkIn = program.command('check-in')
    .description('Manage portfolio company check-ins');

  // List check-ins
  checkIn
    .command('list')
    .description('List check-ins')
    .option('--company <companyName>', 'Filter by company name')
    .option('--since <date>', 'Filter by date (YYYY-MM-DD)')
    .option('--limit <number>', 'Limit the number of results', parseInt, 10)
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Build filter
        const filter: any = {};
        
        if (options.company) {
          const company = await prisma.portfolioCompany.findFirst({
            where: { name: options.company },
          });
          
          if (!company) {
            console.error(`Company '${options.company}' not found.`);
            return;
          }
          
          filter.companyId = company.id;
        }
        
        if (options.since) {
          filter.date = {
            gte: new Date(options.since),
          };
        }

        // Get check-ins
        const checkIns = await prisma.checkIn.findMany({
          where: filter,
          include: {
            company: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: options.limit,
        });

        if (checkIns.length === 0) {
          console.log('No check-ins found.');
          return;
        }

        console.log(`Found ${checkIns.length} check-ins:\n`);
        checkIns.forEach((checkIn) => {
          console.log(`ID: ${checkIn.id}`);
          console.log(`Company: ${checkIn.company.name}`);
          console.log(`Date: ${new Date(checkIn.date).toLocaleDateString()}`);
          
          if (checkIn.revenue) {
            console.log(`Revenue: ${formatCurrency(checkIn.revenue)}/month`);
          }
          
          if (checkIn.burn) {
            console.log(`Burn: ${formatCurrency(checkIn.burn)}/month`);
          }
          
          if (checkIn.runway) {
            console.log(`Runway: ${checkIn.runway} months`);
          }
          
          if (checkIn.headcount) {
            console.log(`Headcount: ${checkIn.headcount} employees`);
          }
          
          if (checkIn.notes) {
            console.log(`Notes: ${checkIn.notes}`);
          }
          
          if (checkIn.metrics) {
            console.log('Custom Metrics:');
            for (const [key, value] of Object.entries(checkIn.metrics as object)) {
              console.log(`  ${key}: ${value}`);
            }
          }
          
          console.log('---');
        });
      } catch (error) {
        console.error('Error listing check-ins:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Create a check-in
  checkIn
    .command('create')
    .description('Create a new check-in')
    .requiredOption('--company <companyName>', 'Company name')
    .option('--date <date>', 'Check-in date (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
    .option('--revenue <amount>', 'Monthly revenue in USD', parseFloat)
    .option('--burn <amount>', 'Monthly burn in USD', parseFloat)
    .option('--runway <months>', 'Runway in months', parseInt)
    .option('--headcount <count>', 'Employee headcount', parseInt)
    .option('--notes <text>', 'Check-in notes')
    .option('--metrics <json>', 'Custom metrics as JSON string')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Check if user has permission to create check-ins
        if (user.role === 'READ_ONLY') {
          console.error('You do not have permission to create check-ins.');
          return;
        }

        // Find company
        const company = await prisma.portfolioCompany.findFirst({
          where: { name: options.company },
        });

        if (!company) {
          console.error(`Company '${options.company}' not found.`);
          return;
        }

        // Parse custom metrics if provided
        let metrics = null;
        if (options.metrics) {
          try {
            metrics = JSON.parse(options.metrics);
          } catch (error) {
            console.error('Error parsing metrics JSON:', error);
            return;
          }
        }

        // Create the check-in
        const checkIn = await prisma.checkIn.create({
          data: {
            date: new Date(options.date),
            revenue: options.revenue,
            burn: options.burn,
            runway: options.runway,
            headcount: options.headcount,
            notes: options.notes,
            metrics: metrics,
            companyId: company.id,
          },
        });

        console.log(`Check-in created successfully!`);
        console.log(`ID: ${checkIn.id}`);
        console.log(`Company: ${company.name}`);
        console.log(`Date: ${new Date(checkIn.date).toLocaleDateString()}`);
        
        if (checkIn.revenue) {
          console.log(`Revenue: ${formatCurrency(checkIn.revenue)}/month`);
        }
        
        if (checkIn.burn) {
          console.log(`Burn: ${formatCurrency(checkIn.burn)}/month`);
        }
        
        if (checkIn.runway) {
          console.log(`Runway: ${checkIn.runway} months`);
        }
        
        if (checkIn.headcount) {
          console.log(`Headcount: ${checkIn.headcount} employees`);
        }
        
        if (checkIn.notes) {
          console.log(`Notes: ${checkIn.notes}`);
        }
        
        if (checkIn.metrics) {
          console.log('Custom Metrics:');
          for (const [key, value] of Object.entries(checkIn.metrics as object)) {
            console.log(`  ${key}: ${value}`);
          }
        }
      } catch (error) {
        console.error('Error creating check-in:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Get check-in history for a company
  checkIn
    .command('history')
    .description('Get check-in history for a company')
    .requiredOption('--company <companyName>', 'Company name')
    .option('--limit <number>', 'Limit the number of results', parseInt, 5)
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Find company
        const company = await prisma.portfolioCompany.findFirst({
          where: { name: options.company },
        });

        if (!company) {
          console.error(`Company '${options.company}' not found.`);
          return;
        }

        // Get check-ins
        const checkIns = await prisma.checkIn.findMany({
          where: {
            companyId: company.id,
          },
          orderBy: {
            date: 'desc',
          },
          take: options.limit,
        });

        if (checkIns.length === 0) {
          console.log(`No check-ins found for ${company.name}.`);
          return;
        }

        console.log(`Check-in history for ${company.name}:\n`);
        
        // Print in a table-like format for better comparison
        const metrics = ['Revenue', 'Burn', 'Runway', 'Headcount'];
        
        // Print header
        console.log('Date       | ' + metrics.join(' | '));
        console.log('-'.repeat(11 + metrics.join(' | ').length));
        
        // Print data
        checkIns.forEach((checkIn) => {
          const date = new Date(checkIn.date).toISOString().split('T')[0];
          const revenue = checkIn.revenue ? formatCurrency(checkIn.revenue) : 'N/A';
          const burn = checkIn.burn ? formatCurrency(checkIn.burn) : 'N/A';
          const runway = checkIn.runway ? `${checkIn.runway} mo` : 'N/A';
          const headcount = checkIn.headcount ? checkIn.headcount.toString() : 'N/A';
          
          console.log(`${date} | ${revenue} | ${burn} | ${runway} | ${headcount}`);
        });
        
        // Print detailed notes
        console.log('\nDetailed Notes:');
        checkIns.forEach((checkIn) => {
          console.log(`\n${new Date(checkIn.date).toLocaleDateString()}:`);
          if (checkIn.notes) {
            console.log(checkIn.notes);
          } else {
            console.log('No notes recorded.');
          }
          
          if (checkIn.metrics) {
            console.log('\nCustom Metrics:');
            for (const [key, value] of Object.entries(checkIn.metrics as object)) {
              console.log(`  ${key}: ${value}`);
            }
          }
          
          console.log('---');
        });
      } catch (error) {
        console.error('Error getting check-in history:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  return checkIn;
}
