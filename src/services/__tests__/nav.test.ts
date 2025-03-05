import { NAVService } from '../nav';
import { NAVCalculation } from '../../models/types';
import Decimal from 'decimal.js';

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
global.crypto = {
  ...global.crypto,
  randomUUID: () => mockUUID,
};

describe('NAVService', () => {
  let nav: NAVService;

  beforeEach(() => {
    nav = new NAVService();
  });

  describe('NAV Calculations', () => {
    const mockHoldings = [
      {
        companyId: 'company-1',
        value: 1000000,
        method: 'LAST_ROUND' as const,
        notes: 'Series A valuation',
      },
      {
        companyId: 'company-2',
        value: 2000000,
        method: 'MARKET_COMP' as const,
      },
    ];

    const mockParams = {
      fundId: 'fund-1',
      date: new Date('2024-01-15'),
      holdings: mockHoldings,
      currency: 'USD',
    };

    it('should calculate NAV correctly', async () => {
      const calculation = await nav.calculateNAV(mockParams);

      expect(calculation.id).toBeDefined();
      expect(calculation.fundId).toBe(mockParams.fundId);
      expect(calculation.date).toEqual(mockParams.date);
      expect(calculation.totalValue).toBe(3000000); // sum of all holdings
      expect(calculation.currency).toBe(mockParams.currency);
      expect(calculation.holdings).toEqual(mockParams.holdings);
    });

    it('should retrieve a calculation by id', async () => {
      const calculation = await nav.calculateNAV(mockParams);
      const retrieved = await nav.getCalculation(calculation.id);

      expect(retrieved).toEqual(calculation);
    });

    it('should list calculations for a fund sorted by date', async () => {
      const calc1 = await nav.calculateNAV({
        ...mockParams,
        date: new Date('2024-01-15'),
      });
      const calc2 = await nav.calculateNAV({
        ...mockParams,
        date: new Date('2024-01-20'),
      });

      const calculations = await nav.listCalculations(mockParams.fundId);

      expect(calculations).toHaveLength(2);
      expect(calculations[0]).toEqual(calc2); // Most recent first
      expect(calculations[1]).toEqual(calc1);
    });

    it('should get latest NAV calculation', async () => {
      await nav.calculateNAV({
        ...mockParams,
        date: new Date('2024-01-15'),
      });
      const latestCalc = await nav.calculateNAV({
        ...mockParams,
        date: new Date('2024-01-20'),
      });

      const latest = await nav.getLatestNAV(mockParams.fundId);

      expect(latest).toEqual(latestCalc);
    });

    it('should return undefined for non-existent latest NAV', async () => {
      const latest = await nav.getLatestNAV('non-existent-fund');
      expect(latest).toBeUndefined();
    });

    it('should get historical NAV calculations within date range', async () => {
      const calc1 = await nav.calculateNAV({
        ...mockParams,
        date: new Date('2024-01-15'),
      });
      const calc2 = await nav.calculateNAV({
        ...mockParams,
        date: new Date('2024-01-20'),
      });
      const calc3 = await nav.calculateNAV({
        ...mockParams,
        date: new Date('2024-01-25'),
      });

      const historical = await nav.getHistoricalNAV(
        mockParams.fundId,
        new Date('2024-01-16'),
        new Date('2024-01-22')
      );

      expect(historical).toHaveLength(1);
      expect(historical[0]).toEqual(calc2);
    });

    it('should handle empty holdings', async () => {
      const params = {
        fundId: 'fund-1',
        date: new Date('2024-01-15'),
        holdings: [],
        currency: 'USD',
      };

      const calculation = await nav.calculateNAV(params);

      expect(calculation.id).toBeDefined();
      expect(calculation.fundId).toBe(params.fundId);
      expect(calculation.date).toEqual(params.date);
      expect(calculation.totalValue).toBe(0);
      expect(calculation.currency).toBe(params.currency);
      expect(calculation.holdings).toEqual(params.holdings);
    });

    it('should handle invalid date', async () => {
      const params = {
        fundId: 'fund-1',
        date: 'invalid-date',
        holdings: mockHoldings,
        currency: 'USD',
      };

      await expect(nav.calculateNAV(params)).rejects.toThrowError(
        'Invalid date'
      );
    });

    it('should handle invalid currency', async () => {
      const params = {
        fundId: 'fund-1',
        date: new Date('2024-01-15'),
        holdings: mockHoldings,
        currency: 'invalid-currency',
      };

      await expect(nav.calculateNAV(params)).rejects.toThrowError(
        'Invalid currency'
      );
    });
  });

  describe('Company Valuations', () => {
    const mockHolding = {
      companyId: 'company-1',
      value: 1000000,
      method: 'LAST_ROUND' as const,
    };

    it('should get latest company valuation', async () => {
      const calc = await nav.calculateNAV({
        fundId: 'fund-1',
        date: new Date('2024-01-15'),
        holdings: [mockHolding],
        currency: 'USD',
      });

      const valuation = await nav.getCompanyValuation(mockHolding.companyId);

      expect(valuation).toBeDefined();
      expect(valuation?.value).toBe(mockHolding.value);
      expect(valuation?.method).toBe(mockHolding.method);
      expect(valuation?.currency).toBe('USD');
      expect(valuation?.calculationId).toBe(calc.id);
      expect(valuation?.date).toEqual(calc.date);
    });

    it('should get company valuation at specific date', async () => {
      const oldCalc = await nav.calculateNAV({
        fundId: 'fund-1',
        date: new Date('2024-01-15'),
        holdings: [{ ...mockHolding, value: 1000000 }],
        currency: 'USD',
      });

      await nav.calculateNAV({
        fundId: 'fund-1',
        date: new Date('2024-01-20'),
        holdings: [{ ...mockHolding, value: 2000000 }],
        currency: 'USD',
      });

      const valuation = await nav.getCompanyValuation(
        mockHolding.companyId,
        new Date('2024-01-16')
      );

      expect(valuation).toBeDefined();
      expect(valuation?.value).toBe(1000000);
      expect(valuation?.calculationId).toBe(oldCalc.id);
    });

    it('should return undefined for non-existent company valuation', async () => {
      const valuation = await nav.getCompanyValuation('non-existent-company');
      expect(valuation).toBeUndefined();
    });

    it('should handle invalid company id', async () => {
      await expect(nav.getCompanyValuation('invalid-company-id')).rejects.toThrowError(
        'Invalid company id'
      );
    });

    it('should handle invalid date', async () => {
      await expect(
        nav.getCompanyValuation(mockHolding.companyId, 'invalid-date')
      ).rejects.toThrowError('Invalid date');
    });
  });
});