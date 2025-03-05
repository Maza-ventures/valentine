import { UpdatesService } from '../updates';
import { Update, Metric } from '../../models/types';

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
global.crypto = {
  ...global.crypto,
  randomUUID: () => mockUUID,
};

describe('UpdatesService', () => {
  let updates: UpdatesService;

  beforeEach(() => {
    updates = new UpdatesService();
  });

  describe('Update Management', () => {
    const mockMetrics: Metric[] = [
      {
        name: 'MRR',
        value: 100000,
        date: new Date('2024-01-15'),
      },
      {
        name: 'Active Users',
        value: 5000,
        date: new Date('2024-01-15'),
      },
    ];

    const mockUpdate = {
      companyId: 'company-1',
      date: new Date('2024-01-15'),
      type: 'MONTHLY' as const,
      metrics: mockMetrics,
      notes: 'January monthly update',
    };

    it('should create a new update', async () => {
      const update = await updates.createUpdate(mockUpdate);

      expect(update.id).toBeDefined();
      expect(update.companyId).toBe(mockUpdate.companyId);
      expect(update.date).toEqual(mockUpdate.date);
      expect(update.type).toBe(mockUpdate.type);
      expect(update.metrics).toEqual(mockUpdate.metrics);
      expect(update.notes).toBe(mockUpdate.notes);
    });

    it('should retrieve an update by id', async () => {
      const created = await updates.createUpdate(mockUpdate);
      const retrieved = await updates.getUpdate(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should list updates with no filters', async () => {
      const update1 = await updates.createUpdate(mockUpdate);
      const update2 = await updates.createUpdate({
        ...mockUpdate,
        date: new Date('2024-01-20'),
      });

      const allUpdates = await updates.listUpdates();

      expect(allUpdates).toHaveLength(2);
      expect(allUpdates[0]).toEqual(update2); // Most recent first
      expect(allUpdates[1]).toEqual(update1);
    });

    it('should filter updates by company id', async () => {
      await updates.createUpdate(mockUpdate);
      await updates.createUpdate({
        ...mockUpdate,
        companyId: 'company-2',
      });

      const filtered = await updates.listUpdates({ companyId: 'company-1' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].companyId).toBe('company-1');
    });

    it('should filter updates by type', async () => {
      await updates.createUpdate(mockUpdate);
      await updates.createUpdate({
        ...mockUpdate,
        type: 'QUARTERLY',
      });

      const filtered = await updates.listUpdates({ type: 'MONTHLY' });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('MONTHLY');
    });

    it('should filter updates by date range', async () => {
      await updates.createUpdate({
        ...mockUpdate,
        date: new Date('2024-01-15'),
      });
      const middleUpdate = await updates.createUpdate({
        ...mockUpdate,
        date: new Date('2024-01-20'),
      });
      await updates.createUpdate({
        ...mockUpdate,
        date: new Date('2024-01-25'),
      });

      const filtered = await updates.listUpdates({
        startDate: new Date('2024-01-16'),
        endDate: new Date('2024-01-22'),
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(middleUpdate);
    });

    it('should throw error when creating update with invalid type', async () => {
      await expect(
        updates.createUpdate({
          ...mockUpdate,
          type: 'INVALID_TYPE',
        })
      ).rejects.toThrow('Invalid update type');
    });

    it('should throw error when creating update with invalid date', async () => {
      await expect(
        updates.createUpdate({
          ...mockUpdate,
          date: new Date('invalid-date'),
        })
      ).rejects.toThrow('Invalid date');
    });

    it('should throw error when retrieving non-existent update', async () => {
      await expect(updates.getUpdate('non-existent')).rejects.toThrow(
        'Update with id non-existent not found'
      );
    });
  });

  describe('Metrics Management', () => {
    const baseDate = new Date('2024-01-15');
    const mockMetrics = [
      { name: 'MRR', value: 100000 },
      { name: 'Active Users', value: 5000 },
    ];

    it('should get latest metrics for a company', async () => {
      await updates.createUpdate({
        companyId: 'company-1',
        date: new Date('2024-01-15'),
        type: 'MONTHLY',
        metrics: [{ name: 'MRR', value: 100000, date: baseDate }],
      });

      await updates.createUpdate({
        companyId: 'company-1',
        date: new Date('2024-01-20'),
        type: 'MONTHLY',
        metrics: [{ name: 'MRR', value: 120000, date: new Date('2024-01-20') }],
      });

      const latestMetrics = await updates.getLatestMetrics('company-1');

      expect(latestMetrics).toHaveLength(1);
      expect(latestMetrics[0].value).toBe(120000);
    });

    it('should get metric history', async () => {
      await updates.createUpdate({
        companyId: 'company-1',
        date: new Date('2024-01-15'),
        type: 'MONTHLY',
        metrics: [{ name: 'MRR', value: 100000, date: baseDate }],
      });

      await updates.createUpdate({
        companyId: 'company-1',
        date: new Date('2024-01-20'),
        type: 'MONTHLY',
        metrics: [{ name: 'MRR', value: 120000, date: new Date('2024-01-20') }],
      });

      const history = await updates.getMetricHistory({
        companyId: 'company-1',
        metricName: 'MRR',
      });

      expect(history).toHaveLength(2);
      expect(history[0].value).toBe(100000); // Oldest first
      expect(history[1].value).toBe(120000);
    });

    it('should add metrics to existing update', async () => {
      const update = await updates.createUpdate({
        companyId: 'company-1',
        date: baseDate,
        type: 'MONTHLY',
        metrics: [mockMetrics[0]],
      });

      const updatedUpdate = await updates.addMetricsToUpdate(update.id, [mockMetrics[1]]);

      expect(updatedUpdate.metrics).toHaveLength(2);
      expect(updatedUpdate.metrics[1].name).toBe('Active Users');
      expect(updatedUpdate.metrics[1].value).toBe(5000);
      expect(updatedUpdate.metrics[1].date).toEqual(baseDate);
    });

    it('should throw error when adding metrics to non-existent update', async () => {
      await expect(
        updates.addMetricsToUpdate('non-existent', [mockMetrics[0]])
      ).rejects.toThrow('Update with id non-existent not found');
    });

    it('should throw error when getting latest metrics for non-existent company', async () => {
      await expect(updates.getLatestMetrics('non-existent')).rejects.toThrow(
        'Company with id non-existent not found'
      );
    });

    it('should throw error when getting metric history for non-existent company', async () => {
      await expect(
        updates.getMetricHistory({
          companyId: 'non-existent',
          metricName: 'MRR',
        })
      ).rejects.toThrow('Company with id non-existent not found');
    });
  });
});