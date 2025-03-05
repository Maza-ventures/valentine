import { PortfolioService } from '../portfolio';
import { Company, Investment } from '../../models/types';
import Decimal from 'decimal.js';

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
global.crypto = {
  ...global.crypto,
  randomUUID: () => mockUUID,
};

describe('PortfolioService', () => {
  let portfolio: PortfolioService;

  beforeEach(() => {
    portfolio = new PortfolioService();
  });

  describe('Company Management', () => {
    const mockCompany = {
      name: 'TechCo',
      sector: 'SaaS',
      stage: 'SERIES_A' as const,
      founded: new Date('2024-01-01'),
      website: 'https://techco.com',
    };

    it('should add a new company', async () => {
      const company = await portfolio.addCompany(mockCompany);
      
      expect(company.id).toBeDefined();
      expect(company.name).toBe(mockCompany.name);
      expect(company.sector).toBe(mockCompany.sector);
      expect(company.stage).toBe(mockCompany.stage);
      expect(company.founded).toEqual(mockCompany.founded);
      expect(company.website).toBe(mockCompany.website);
    });

    it('should retrieve a company by id', async () => {
      const added = await portfolio.addCompany(mockCompany);
      const retrieved = await portfolio.getCompany(added.id);
      
      expect(retrieved).toEqual(added);
    });

    it('should update a company', async () => {
      const company = await portfolio.addCompany(mockCompany);
      const updates = {
        stage: 'SERIES_B' as const,
        description: 'Updated description',
      };

      const updated = await portfolio.updateCompany(company.id, updates);
      
      expect(updated.id).toBe(company.id);
      expect(updated.stage).toBe(updates.stage);
      expect(updated.description).toBe(updates.description);
      expect(updated.name).toBe(company.name);
    });

    it('should throw error when updating non-existent company', async () => {
      await expect(
        portfolio.updateCompany('non-existent', { name: 'New Name' })
      ).rejects.toThrow('Company with id non-existent not found');
    });

    it('should list all companies', async () => {
      const company1 = await portfolio.addCompany(mockCompany);
      const company2 = await portfolio.addCompany({
        ...mockCompany,
        name: 'OtherCo',
      });

      const companies = await portfolio.listCompanies();
      
      expect(companies).toHaveLength(2);
      expect(companies).toContainEqual(company1);
      expect(companies).toContainEqual(company2);
    });

    it('should throw error when adding company with duplicate name', async () => {
      await portfolio.addCompany(mockCompany);
      await expect(portfolio.addCompany(mockCompany)).rejects.toThrow('Company with name TechCo already exists');
    });

    it('should throw error when retrieving non-existent company', async () => {
      await expect(portfolio.getCompany('non-existent')).rejects.toThrow('Company with id non-existent not found');
    });
  });

  describe('Investment Management', () => {
    let company: Company;
    const mockInvestment = {
      amount: 1000000,
      currency: 'USD',
      date: new Date('2024-01-15'),
      round: 'Series A',
      ownership: 15,
      valuation: 10000000,
      type: 'PRIMARY' as const,
    };

    beforeEach(async () => {
      company = await portfolio.addCompany({
        name: 'TechCo',
        sector: 'SaaS',
        stage: 'SERIES_A',
        founded: new Date('2024-01-01'),
      });
    });

    it('should add a new investment', async () => {
      const investment = await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
      });

      expect(investment.id).toBeDefined();
      expect(investment.companyId).toBe(company.id);
      expect(investment.amount).toBe(mockInvestment.amount);
      expect(investment.ownership).toBe(mockInvestment.ownership);
    });

    it('should throw error when adding investment for non-existent company', async () => {
      await expect(
        portfolio.addInvestment({
          ...mockInvestment,
          companyId: 'non-existent',
        })
      ).rejects.toThrow('Company with id non-existent not found');
    });

    it('should retrieve an investment by id', async () => {
      const added = await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
      });
      const retrieved = await portfolio.getInvestment(added.id);
      
      expect(retrieved).toEqual(added);
    });

    it('should list investments for a company', async () => {
      const investment1 = await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
      });
      const investment2 = await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
        round: 'Series B',
      });

      const investments = await portfolio.listInvestments(company.id);
      
      expect(investments).toHaveLength(2);
      expect(investments).toContainEqual(investment1);
      expect(investments).toContainEqual(investment2);
    });

    it('should calculate total invested amount', async () => {
      await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
        amount: 1000000,
      });
      await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
        amount: 2000000,
      });

      const total = await portfolio.getTotalInvested(company.id);
      
      expect(total.amount).toEqual(new Decimal(3000000));
      expect(total.currency).toBe('USD');
    });

    it('should calculate total ownership', async () => {
      await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
        ownership: 10,
      });
      await portfolio.addInvestment({
        ...mockInvestment,
        companyId: company.id,
        ownership: 5,
      });

      const ownership = await portfolio.getOwnership(company.id);
      
      expect(ownership).toEqual(new Decimal(15));
    });

    it('should throw error when retrieving non-existent investment', async () => {
      await expect(portfolio.getInvestment('non-existent')).rejects.toThrow('Investment with id non-existent not found');
    });

    it('should throw error when listing investments for non-existent company', async () => {
      await expect(portfolio.listInvestments('non-existent')).rejects.toThrow('Company with id non-existent not found');
    });

    it('should throw error when calculating total invested amount for non-existent company', async () => {
      await expect(portfolio.getTotalInvested('non-existent')).rejects.toThrow('Company with id non-existent not found');
    });

    it('should throw error when calculating total ownership for non-existent company', async () => {
      await expect(portfolio.getOwnership('non-existent')).rejects.toThrow('Company with id non-existent not found');
    });
  });
});