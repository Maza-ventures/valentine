import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@valentine.vc' },
    update: {},
    create: {
      email: 'admin@valentine.vc',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  // Create a fund manager
  const fundManager = await prisma.user.upsert({
    where: { email: 'manager@valentine.vc' },
    update: {},
    create: {
      email: 'manager@valentine.vc',
      name: 'Fund Manager',
      role: UserRole.FUND_MANAGER,
    },
  });

  // Create an analyst
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@valentine.vc' },
    update: {},
    create: {
      email: 'analyst@valentine.vc',
      name: 'Investment Analyst',
      role: UserRole.ANALYST,
    },
  });

  // Create a read-only user
  const readOnly = await prisma.user.upsert({
    where: { email: 'readonly@valentine.vc' },
    update: {},
    create: {
      email: 'readonly@valentine.vc',
      name: 'Read Only User',
      role: UserRole.READ_ONLY,
    },
  });

  // Create a fund
  const seedFund = await prisma.fund.upsert({
    where: { id: 'seed-fund-1' },
    update: {},
    create: {
      id: 'seed-fund-1',
      name: 'Seed Fund I',
      description: 'First seed stage fund focusing on B2B SaaS',
      target: 50000000, // $50M
      vintage: 2025,
      status: 'Active',
      ownerId: fundManager.id,
    },
  });

  // Create another fund
  const growthFund = await prisma.fund.upsert({
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
  const acme = await prisma.portfolioCompany.upsert({
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

  const techCorp = await prisma.portfolioCompany.upsert({
    where: { id: 'tech-corp' },
    update: {},
    create: {
      id: 'tech-corp',
      name: 'TechCorp',
      sector: 'FinTech',
      website: 'https://techcorp.example.com',
      description: 'Financial technology solutions for SMBs',
      founded: 2021,
      location: 'New York, NY',
    },
  });

  // Create investments
  const acmeInvestment = await prisma.investment.upsert({
    where: { id: 'acme-seed-investment' },
    update: {},
    create: {
      id: 'acme-seed-investment',
      amount: 1500000, // $1.5M
      date: new Date('2025-01-15'),
      round: 'Seed',
      valuation: 10000000, // $10M
      ownership: 15, // 15%
      notes: 'Lead investor in seed round',
      fundId: seedFund.id,
      companyId: acme.id,
    },
  });

  const techCorpInvestment = await prisma.investment.upsert({
    where: { id: 'techcorp-series-a-investment' },
    update: {},
    create: {
      id: 'techcorp-series-a-investment',
      amount: 3000000, // $3M
      date: new Date('2025-02-20'),
      round: 'Series A',
      valuation: 20000000, // $20M
      ownership: 15, // 15%
      notes: 'Co-lead investor in Series A',
      fundId: seedFund.id,
      companyId: techCorp.id,
    },
  });

  // Create check-ins
  const acmeCheckIn = await prisma.checkIn.upsert({
    where: { id: 'acme-checkin-1' },
    update: {},
    create: {
      id: 'acme-checkin-1',
      date: new Date('2025-03-01'),
      notes: 'Monthly check-in with CEO. Product development on track.',
      revenue: 50000, // $50K MRR
      burn: 200000, // $200K monthly burn
      runway: 12, // 12 months
      headcount: 15,
      metrics: {
        activeUsers: 1200,
        churn: 2.5,
        cac: 800,
        ltv: 4000,
      },
      companyId: acme.id,
    },
  });

  // Create tasks
  const acmeTask = await prisma.task.upsert({
    where: { id: 'acme-task-1' },
    update: {},
    create: {
      id: 'acme-task-1',
      description: 'Follow up with Acme CEO about hiring plans',
      dueDate: new Date('2025-04-15'),
      status: 'TODO',
      priority: 'HIGH',
      companyId: acme.id,
      assignedToId: analyst.id,
      createdById: fundManager.id,
    },
  });

  // Create LPs
  const institutionalLP = await prisma.limitedPartner.upsert({
    where: { id: 'institutional-lp-1' },
    update: {},
    create: {
      id: 'institutional-lp-1',
      name: 'Institutional Investor A',
      email: 'investments@institution-a.example.com',
      type: 'Institution',
      commitment: 10000000, // $10M
      fundId: seedFund.id,
    },
  });

  const individualLP = await prisma.limitedPartner.upsert({
    where: { id: 'individual-lp-1' },
    update: {},
    create: {
      id: 'individual-lp-1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      type: 'Individual',
      commitment: 1000000, // $1M
      fundId: seedFund.id,
    },
  });

  // Create capital calls
  const capitalCall1 = await prisma.capitalCall.upsert({
    where: { id: 'capital-call-1' },
    update: {},
    create: {
      id: 'capital-call-1',
      date: new Date('2025-02-01'),
      dueDate: new Date('2025-03-01'),
      amount: 5500000, // $5.5M
      percentage: 10, // 10% of total fund commitments
      description: 'Initial capital call for Seed Fund I',
      status: 'FULLY_PAID',
      fundId: seedFund.id,
    },
  });

  // Create capital call responses
  const institutionalLPResponse = await prisma.capitalCallResponse.upsert({
    where: { id: 'institutional-lp-response-1' },
    update: {},
    create: {
      id: 'institutional-lp-response-1',
      amountPaid: 1000000, // $1M (10% of $10M commitment)
      datePaid: new Date('2025-02-15'),
      status: 'PAID',
      lpId: institutionalLP.id,
      capitalCallId: capitalCall1.id,
    },
  });

  const individualLPResponse = await prisma.capitalCallResponse.upsert({
    where: { id: 'individual-lp-response-1' },
    update: {},
    create: {
      id: 'individual-lp-response-1',
      amountPaid: 100000, // $100K (10% of $1M commitment)
      datePaid: new Date('2025-02-20'),
      status: 'PAID',
      lpId: individualLP.id,
      capitalCallId: capitalCall1.id,
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
    await prisma.$disconnect();
  });
