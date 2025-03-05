import { z } from 'zod';

// Company Types
export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  sector: z.string(),
  stage: z.enum(['SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'SERIES_D', 'GROWTH', 'PRE_IPO']),
  founded: z.date(),
  website: z.string().url().optional(),
});

export type Company = z.infer<typeof CompanySchema>;

// Investment Types
export const InvestmentSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  amount: z.number(),
  currency: z.string(),
  date: z.date(),
  round: z.string(),
  ownership: z.number(),
  valuation: z.number(),
  type: z.enum(['PRIMARY', 'SECONDARY', 'CONVERTIBLE_NOTE', 'SAFE']),
  terms: z.record(z.string()).optional(),
});

export type Investment = z.infer<typeof InvestmentSchema>;

// Portfolio Update Types
export const MetricSchema = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]),
  date: z.date(),
});

export type Metric = z.infer<typeof MetricSchema>;

export const UpdateSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  date: z.date(),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC']),
  metrics: z.array(MetricSchema),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export type Update = z.infer<typeof UpdateSchema>;

// Fund Types
export const FundSchema = z.object({
  id: z.string(),
  name: z.string(),
  vintage: z.number(),
  size: z.number(),
  currency: z.string(),
  status: z.enum(['RAISING', 'INVESTING', 'FULLY_INVESTED', 'HARVESTING']),
  strategy: z.string().optional(),
});

export type Fund = z.infer<typeof FundSchema>;

// NAV Types
export const ValuationMethodSchema = z.enum([
  'LAST_ROUND',
  'MARK_TO_MARKET',
  'COMPARABLE_COMPANIES',
  'DCF',
  'WRITE_OFF',
]);

export const NAVCalculationSchema = z.object({
  id: z.string(),
  fundId: z.string(),
  date: z.date(),
  totalValue: z.number(),
  currency: z.string(),
  holdings: z.array(z.object({
    companyId: z.string(),
    value: z.number(),
    method: ValuationMethodSchema,
    notes: z.string().optional(),
  })),
});

export type NAVCalculation = z.infer<typeof NAVCalculationSchema>;