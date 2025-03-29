import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../utils/auth';

const prisma = new PrismaClient();

export function companyCommands(program: Command) {
  const company = program.command('company')
    .description('Manage portfolio companies');

  // List companies
  company
    .command('list')
    .description('List portfolio companies')
    .option('--sector <sector>', 'Filter by sector')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Build filter
        const filter: any = {};
        if (options.sector) {
          filter.sector = options.sector;
        }

        // Get companies
        const companies = await prisma.portfolioCompany.findMany({
          where: filter,
          include: {
            investments: {
              include: {
                fund: true,
              },
            },
            checkIns: {
              orderBy: {
                date: 'desc',
              },
              take: 1,
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        if (companies.length === 0) {
          console.log('No companies found.');
          return;
        }

        console.log(`Found ${companies.length} companies:\n`);
        companies.forEach((company) => {
          const totalInvested = company.investments.reduce(
            (sum, inv) => sum + inv.amount,
            0
          );
          
          const lastCheckIn = company.checkIns[0];

          console.log(`ID: ${company.id}`);
          console.log(`Name: ${company.name}`);
          console.log(`Sector: ${company.sector || 'N/A'}`);
          console.log(`Website: ${company.website || 'N/A'}`);
          console.log(`Founded: ${company.founded || 'N/A'}`);
          console.log(`Location: ${company.location || 'N/A'}`);
          console.log(`Total Investment: $${totalInvested.toLocaleString()}`);
          console.log(`Funds Invested: ${new Set(company.investments.map(inv => inv.fund.name)).size}`);
          console.log(`Last Check-in: ${lastCheckIn ? new Date(lastCheckIn.date).toLocaleDateString() : 'Never'}`);
          if (lastCheckIn && lastCheckIn.revenue) {
            console.log(`Latest Revenue: $${lastCheckIn.revenue.toLocaleString()}/month`);
          }
          console.log('---');
        });
      } catch (error) {
        console.error('Error listing companies:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Create a company
  company
    .command('create')
    .description('Create a new portfolio company')
    .requiredOption('--name <name>', 'Company name')
    .option('--sector <sector>', 'Company sector')
    .option('--website <website>', 'Company website')
    .option('--description <description>', 'Company description')
    .option('--founded <year>', 'Year founded', parseInt)
    .option('--location <location>', 'Company location')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Check if user has permission to create companies
        if (user.role === 'READ_ONLY') {
          console.error('You do not have permission to create companies.');
          return;
        }

        // Create the company
        const company = await prisma.portfolioCompany.create({
          data: {
            name: options.name,
            sector: options.sector,
            website: options.website,
            description: options.description,
            founded: options.founded,
            location: options.location,
          },
        });

        console.log(`Company created successfully!`);
        console.log(`ID: ${company.id}`);
        console.log(`Name: ${company.name}`);
        console.log(`Sector: ${company.sector || 'N/A'}`);
        console.log(`Website: ${company.website || 'N/A'}`);
        console.log(`Description: ${company.description || 'N/A'}`);
        console.log(`Founded: ${company.founded || 'N/A'}`);
        console.log(`Location: ${company.location || 'N/A'}`);
      } catch (error) {
        console.error('Error creating company:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Get company details
  company
    .command('get')
    .description('Get company details')
    .requiredOption('--id <id>', 'Company ID')
    .option('--detailed', 'Show detailed information including investments and check-ins')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Get company details
        const company = await prisma.portfolioCompany.findUnique({
          where: { id: options.id },
          include: {
            investments: options.detailed ? {
              include: {
                fund: true,
              },
              orderBy: {
                date: 'desc',
              },
            } : false,
            checkIns: options.detailed ? {
              orderBy: {
                date: 'desc',
              },
            } : false,
            tasks: options.detailed ? {
              where: {
                status: {
                  in: ['TODO', 'IN_PROGRESS'],
                },
              },
              include: {
                assignedTo: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                dueDate: 'asc',
              },
            } : false,
          },
        });

        if (!company) {
          console.error(`Company with ID ${options.id} not found.`);
          return;
        }

        console.log(`Company Details:`);
        console.log(`ID: ${company.id}`);
        console.log(`Name: ${company.name}`);
        console.log(`Sector: ${company.sector || 'N/A'}`);
        console.log(`Website: ${company.website || 'N/A'}`);
        console.log(`Description: ${company.description || 'N/A'}`);
        console.log(`Founded: ${company.founded || 'N/A'}`);
        console.log(`Location: ${company.location || 'N/A'}`);
        console.log(`Created: ${company.createdAt}`);
        console.log(`Updated: ${company.updatedAt}`);

        if (options.detailed) {
          // Show investments
          if ('investments' in company && company.investments.length > 0) {
            console.log('\nInvestments:');
            company.investments.forEach((inv) => {
              console.log(`- Fund: ${inv.fund.name}`);
              console.log(`  Amount: $${inv.amount.toLocaleString()}`);
              console.log(`  Date: ${new Date(inv.date).toLocaleDateString()}`);
              console.log(`  Round: ${inv.round || 'N/A'}`);
              if (inv.valuation) {
                console.log(`  Valuation: $${inv.valuation.toLocaleString()}`);
              }
              if (inv.ownership) {
                console.log(`  Ownership: ${inv.ownership}%`);
              }
              console.log('  ---');
            });
          } else {
            console.log('\nNo Investments.');
          }

          // Show check-ins
          if ('checkIns' in company && company.checkIns.length > 0) {
            console.log('\nCheck-ins:');
            company.checkIns.forEach((checkIn) => {
              console.log(`- Date: ${new Date(checkIn.date).toLocaleDateString()}`);
              if (checkIn.revenue) {
                console.log(`  Revenue: $${checkIn.revenue.toLocaleString()}/month`);
              }
              if (checkIn.burn) {
                console.log(`  Burn: $${checkIn.burn.toLocaleString()}/month`);
              }
              if (checkIn.runway) {
                console.log(`  Runway: ${checkIn.runway} months`);
              }
              if (checkIn.headcount) {
                console.log(`  Headcount: ${checkIn.headcount} employees`);
              }
              if (checkIn.notes) {
                console.log(`  Notes: ${checkIn.notes}`);
              }
              console.log('  ---');
            });
          } else {
            console.log('\nNo Check-ins.');
          }

          // Show tasks
          if ('tasks' in company && company.tasks.length > 0) {
            console.log('\nOpen Tasks:');
            company.tasks.forEach((task) => {
              console.log(`- ${task.description}`);
              console.log(`  Status: ${task.status}`);
              console.log(`  Priority: ${task.priority}`);
              if (task.dueDate) {
                console.log(`  Due: ${new Date(task.dueDate).toLocaleDateString()}`);
              }
              if (task.assignedTo) {
                console.log(`  Assigned to: ${task.assignedTo.name}`);
              }
              console.log('  ---');
            });
          } else {
            console.log('\nNo Open Tasks.');
          }
        }
      } catch (error) {
        console.error('Error getting company details:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  return company;
}
