# Valentine

Valentine is a comprehensive TypeScript toolkit for Venture Capital firms to manage their portfolio operations efficiently and openly. It provides a robust set of tools for managing portfolio companies, tracking investments, calculating NAV, and gathering company updates.

## Features

- **Portfolio Management**
  - Track portfolio companies and their details
  - Manage investments across multiple rounds
  - Monitor ownership and cap table information
  - Support for different investment types (Primary, Secondary, SAFE, Convertible Notes)

- **NAV Calculation**
  - Calculate fund Net Asset Value (NAV)
  - Support for multiple valuation methods:
    - Last Round
    - Mark to Market
    - Comparable Companies
    - DCF
    - Write-off
  - Historical NAV tracking
  - Per-company valuation history

- **Portfolio Updates**
  - Track company metrics over time
  - Support for different update frequencies (Monthly, Quarterly, Annual)
  - Custom metric definitions
  - Historical metric analysis
  - File attachments support

## Installation

```bash
npm install @valentine/core
```

## Quick Start

```typescript
import { Valentine } from '@valentine/core';

// Initialize Valentine
const valentine = new Valentine();

// Add a portfolio company
const company = await valentine.portfolio.addCompany({
  name: "TechCo",
  sector: "SaaS",
  stage: "SERIES_A",
  founded: new Date("2024-01-01"),
  website: "https://techco.com"
});

// Record an investment
const investment = await valentine.portfolio.addInvestment({
  companyId: company.id,
  amount: 1000000,
  currency: "USD",
  date: new Date(),
  round: "Series A",
  ownership: 15,
  valuation: 10000000,
  type: "PRIMARY"
});

// Add company updates
const update = await valentine.updates.createUpdate({
  companyId: company.id,
  date: new Date(),
  type: "MONTHLY",
  metrics: [
    {
      name: "MRR",
      value: 100000,
      date: new Date()
    },
    {
      name: "Customers",
      value: 150,
      date: new Date()
    }
  ]
});

// Calculate NAV
const nav = await valentine.nav.calculateNAV({
  fundId: "fund-1",
  date: new Date(),
  holdings: [
    {
      companyId: company.id,
      value: 1500000,
      method: "LAST_ROUND"
    }
  ],
  currency: "USD"
});
```

## API Reference

### PortfolioService

Manages portfolio companies and investments.

```typescript
// Add a company
const company = await portfolio.addCompany({...});

// Update company details
await portfolio.updateCompany(id, {...});

// Add investment
const investment = await portfolio.addInvestment({...});

// Get total invested
const total = await portfolio.getTotalInvested(companyId);

// Get ownership percentage
const ownership = await portfolio.getOwnership(companyId);
```

### NAVService

Handles NAV calculations and valuations.

```typescript
// Calculate NAV
const nav = await nav.calculateNAV({...});

// Get historical NAV
const history = await nav.getHistoricalNAV(fundId, startDate, endDate);

// Get latest company valuation
const valuation = await nav.getCompanyValuation(companyId);
```

### UpdatesService

Tracks company metrics and updates.

```typescript
// Create update
const update = await updates.createUpdate({...});

// Get latest metrics
const metrics = await updates.getLatestMetrics(companyId);

// Get metric history
const history = await updates.getMetricHistory({
  companyId,
  metricName: "MRR"
});
```

## Type Definitions

Valentine uses [Zod](https://github.com/colinhacks/zod) for runtime type validation. All main types are exported:

- `Company` - Portfolio company information
- `Investment` - Investment details
- `Update` - Company updates and metrics
- `Fund` - Fund information
- `NAVCalculation` - NAV calculation results

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you need help or have questions:
- Open an issue on GitHub
- Check our [documentation](https://docs.valentine.vc)
- Join our [Discord community](https://discord.gg/valentine)
