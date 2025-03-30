// CommonJS version of the seed script
const { PrismaClient } = require('@prisma/client');

// Import UserRole enum values directly
const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  FUND_MANAGER: "FUND_MANAGER",
  ANALYST: "ANALYST",
  READ_ONLY: "READ_ONLY",
  USER: "USER"
};

// Initialize PrismaClient
const db = new PrismaClient();

async function main() {
  // Create a super admin user
  const superAdmin = await db.user.upsert({
    where: { email: 'admin@valentine.vc' },
    update: {},
    create: {
      email: 'admin@valentine.vc',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  // Create a fund manager
  const fundManager = await db.user.upsert({
    where: { email: 'manager@valentine.vc' },
    update: {},
    create: {
      email: 'manager@valentine.vc',
      name: 'Fund Manager',
      role: UserRole.FUND_MANAGER,
    },
  });

  // Create an analyst
  const analyst = await db.user.upsert({
    where: { email: 'analyst@valentine.vc' },
    update: {},
    create: {
      email: 'analyst@valentine.vc',
      name: 'Investment Analyst',
      role: UserRole.ANALYST,
    },
  });

  // Create a read-only user
  const readOnly = await db.user.upsert({
    where: { email: 'readonly@valentine.vc' },
    update: {},
    create: {
      email: 'readonly@valentine.vc',
      name: 'Read Only User',
      role: UserRole.READ_ONLY,
    },
  });

  // Create a fund
  const seedFund = await db.fund.upsert({
    where: { id: 'seed-fund-1' },
    update: {},
    create: {
      id: 'seed-fund-1',
      name: 'Seed Fund I',
      description: 'First seed stage fund focusing on B2B SaaS',
      target: 50000000, // $50M
      vintage: 2025,
      status: 'Active',
      ownerId: superAdmin.id,
    },
  });

  // Create another fund
  const growthFund = await db.fund.upsert({
    where: { id: 'growth-fund-1' },
    update: {},
    create: {
      id: 'growth-fund-1',
      name: 'Growth Fund I',
      description: 'Growth stage fund focusing on established startups',
      target: 100000000, // $100M
      vintage: 2025,
      status: 'Fundraising',
      ownerId: fundManager.id,
    },
  });

  // Create portfolio companies
  const acme = await db.portfolioCompany.upsert({
    where: { id: 'acme-inc' },
    update: {},
    create: {
      id: 'acme-inc',
      name: 'Acme Inc',
      sector: 'Enterprise SaaS',
      website: 'https://acme.example.com',
      description: 'B2B SaaS platform for project management',
      founded: 2022,
      location: 'San Francisco, CA',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
