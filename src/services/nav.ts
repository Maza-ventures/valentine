import { NAVCalculation, NAVCalculationSchema, ValuationMethodSchema } from '../models/types';
import Decimal from 'decimal.js';

/**
 * Service for managing Net Asset Value (NAV) calculations.
 * Handles fund valuations, company holdings, and historical NAV tracking.
 * 
 * @example
 * ```typescript
 * const nav = new NAVService();
 * 
 * // Calculate fund NAV
 * const calculation = await nav.calculateNAV({
 *   fundId: "fund-1",
 *   date: new Date(),
 *   holdings: [{
 *     companyId: "company-1",
 *     value: 1000000,
 *     method: "LAST_ROUND"
 *   }],
 *   currency: "USD"
 * });
 * ```
 */
export class NAVService {
  private calculations: Map<string, NAVCalculation>;

  /**
   * Initializes a new instance of the NAVService class.
   */
  constructor() {
    this.calculations = new Map();
  }

  /**
   * Calculates the Net Asset Value (NAV) for a fund.
   * 
   * @param params - NAV calculation parameters
   * @param params.fundId - ID of the fund
   * @param params.date - Date of the calculation
   * @param params.holdings - Array of company holdings with their valuations
   * @param params.currency - Currency of the calculation
   * @returns NAV calculation result
   * @throws {Error} If validation fails
   */
  async calculateNAV(params: {
    fundId: string;
    date: Date;
    holdings: Array<{
      companyId: string;
      value: number;
      method: typeof ValuationMethodSchema._type;
      notes?: string;
    }>;
    currency: string;
  }): Promise<NAVCalculation> {
    const totalValue = params.holdings.reduce(
      (sum, holding) => sum.plus(holding.value),
      new Decimal(0)
    );

    const calculation: NAVCalculation = NAVCalculationSchema.parse({
      id: crypto.randomUUID(),
      fundId: params.fundId,
      date: params.date,
      totalValue: totalValue.toNumber(),
      currency: params.currency,
      holdings: params.holdings,
    });

    this.calculations.set(calculation.id, calculation);
    return calculation;
  }

  /**
   * Retrieves a specific NAV calculation by ID.
   * 
   * @param id - Calculation ID
   * @returns NAV calculation or undefined if not found
   */
  async getCalculation(id: string): Promise<NAVCalculation | undefined> {
    return this.calculations.get(id);
  }

  /**
   * Lists all NAV calculations for a fund, sorted by date (newest first).
   * 
   * @param fundId - Fund ID to list calculations for
   * @returns Array of NAV calculations
   */
  async listCalculations(fundId: string): Promise<NAVCalculation[]> {
    return Array.from(this.calculations.values())
      .filter(calc => calc.fundId === fundId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Gets the most recent NAV calculation for a fund.
   * 
   * @param fundId - Fund ID
   * @returns Latest NAV calculation or undefined if none exists
   */
  async getLatestNAV(fundId: string): Promise<NAVCalculation | undefined> {
    const calculations = await this.listCalculations(fundId);
    return calculations[0];
  }

  /**
   * Retrieves historical NAV calculations within a date range.
   * 
   * @param fundId - Fund ID
   * @param startDate - Start date of the range
   * @param endDate - End date of the range
   * @returns Array of NAV calculations within the date range
   */
  async getHistoricalNAV(fundId: string, startDate: Date, endDate: Date): Promise<NAVCalculation[]> {
    return (await this.listCalculations(fundId))
      .filter(calc => calc.date >= startDate && calc.date <= endDate);
  }

  /**
   * Gets the latest valuation for a specific company.
   * 
   * @param companyId - Company ID to get valuation for
   * @param date - Optional date to get valuation at or before
   * @returns Company valuation details or undefined if not found
   */
  async getCompanyValuation(companyId: string, date?: Date): Promise<{
    value: number;
    currency: string;
    method: typeof ValuationMethodSchema._type;
    calculationId: string;
    date: Date;
  } | undefined> {
    const allCalculations = Array.from(this.calculations.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (date) {
      allCalculations.filter(calc => calc.date <= date);
    }

    for (const calc of allCalculations) {
      const holding = calc.holdings.find(h => h.companyId === companyId);
      if (holding) {
        return {
          value: holding.value,
          currency: calc.currency,
          method: holding.method,
          calculationId: calc.id,
          date: calc.date,
        };
      }
    }

    return undefined;
  }
}