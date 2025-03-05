import { Company, CompanySchema, Investment, InvestmentSchema } from '../models/types';
import { z } from 'zod';
import Decimal from 'decimal.js';

/**
 * Service for managing portfolio companies and investments.
 * Handles company information, investment tracking, and ownership calculations.
 * 
 * @example
 * ```typescript
 * const portfolio = new PortfolioService();
 * 
 * // Add a company
 * const company = await portfolio.addCompany({
 *   name: "TechCo",
 *   sector: "SaaS",
 *   stage: "SERIES_A",
 *   founded: new Date("2024-01-01")
 * });
 * ```
 */
export class PortfolioService {
  private companies: Map<string, Company>;
  private investments: Map<string, Investment>;

  /**
   * Initializes a new instance of the PortfolioService class.
   * 
   * @description Creates a new PortfolioService instance with empty company and investment maps.
   */
  constructor() {
    this.companies = new Map();
    this.investments = new Map();
  }

  /**
   * Adds a new company to the portfolio.
   * 
   * @param company - Company information without ID
   * @returns Newly created company with generated ID
   * @throws {Error} If company data validation fails
   */
  async addCompany(company: Omit<Company, 'id'>): Promise<Company> {
    const id = crypto.randomUUID();
    const newCompany = CompanySchema.parse({ ...company, id });
    this.companies.set(id, newCompany);
    return newCompany;
  }

  /**
   * Retrieves a company by its ID.
   * 
   * @param id - Company ID
   * @returns Company information or undefined if not found
   */
  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  /**
   * Updates an existing company's information.
   * 
   * @param id - Company ID
   * @param updates - Partial company information to update
   * @returns Updated company information
   * @throws {Error} If company not found or validation fails
   */
  async updateCompany(id: string, updates: Partial<Omit<Company, 'id'>>): Promise<Company> {
    const existing = this.companies.get(id);
    if (!existing) {
      throw new Error(`Company with id ${id} not found`);
    }

    const updated = CompanySchema.parse({ ...existing, ...updates });
    this.companies.set(id, updated);
    return updated;
  }

  /**
   * Lists all companies in the portfolio.
   * 
   * @returns Array of all companies
   */
  async listCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  /**
   * Records a new investment in a portfolio company.
   * 
   * @param investment - Investment information without ID
   * @returns Newly created investment with generated ID
   * @throws {Error} If company not found or validation fails
   */
  async addInvestment(investment: Omit<Investment, 'id'>): Promise<Investment> {
    const id = crypto.randomUUID();
    const newInvestment = InvestmentSchema.parse({ ...investment, id });
    
    if (!this.companies.has(newInvestment.companyId)) {
      throw new Error(`Company with id ${newInvestment.companyId} not found`);
    }

    this.investments.set(id, newInvestment);
    return newInvestment;
  }

  /**
   * Retrieves an investment by its ID.
   * 
   * @param id - Investment ID
   * @returns Investment information or undefined if not found
   */
  async getInvestment(id: string): Promise<Investment | undefined> {
    return this.investments.get(id);
  }

  /**
   * Lists investments, optionally filtered by company.
   * 
   * @param companyId - Optional company ID to filter investments
   * @returns Array of investments
   */
  async listInvestments(companyId?: string): Promise<Investment[]> {
    const investments = Array.from(this.investments.values());
    return companyId 
      ? investments.filter(i => i.companyId === companyId)
      : investments;
  }

  /**
   * Calculates total invested amount, optionally for a specific company.
   * 
   * @param companyId - Optional company ID to calculate total for
   * @returns Object containing total amount and currency
   */
  async getTotalInvested(companyId?: string): Promise<{ amount: Decimal; currency: string }> {
    const investments = await this.listInvestments(companyId);
    const byCurrency = new Map<string, Decimal>();

    for (const inv of investments) {
      const current = byCurrency.get(inv.currency) || new Decimal(0);
      byCurrency.set(inv.currency, current.plus(inv.amount));
    }

    // For now, return the first currency group. In practice, you'd want to handle
    // multiple currencies and possibly convert them to a base currency
    const [firstCurrency] = byCurrency.entries();
    return firstCurrency 
      ? { amount: firstCurrency[1], currency: firstCurrency[0] }
      : { amount: new Decimal(0), currency: 'USD' };
  }

  /**
   * Calculates total ownership percentage in a company.
   * 
   * @param companyId - Company ID to calculate ownership for
   * @returns Total ownership percentage as a decimal
   */
  async getOwnership(companyId: string): Promise<Decimal> {
    const investments = await this.listInvestments(companyId);
    return investments.reduce(
      (total, inv) => total.plus(inv.ownership),
      new Decimal(0)
    );
  }
}