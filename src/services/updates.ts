import { Update, UpdateSchema, Metric, MetricSchema } from '../models/types';

/**
 * Service for managing portfolio company updates and metrics.
 * Handles tracking of company performance metrics, periodic updates, and historical data.
 * 
 * @example
 * ```typescript
 * const updates = new UpdatesService();
 * 
 * // Create a company update
 * const update = await updates.createUpdate({
 *   companyId: "company-1",
 *   date: new Date(),
 *   type: "MONTHLY",
 *   metrics: [{
 *     name: "MRR",
 *     value: 100000,
 *     date: new Date()
 *   }]
 * });
 * ```
 */
export class UpdatesService {
  private updates: Map<string, Update>;

  /**
   * Initializes the updates service.
   */
  constructor() {
    this.updates = new Map();
  }

  /**
   * Creates a new company update with metrics.
   * 
   * @param update - Update information without ID
   * @returns Newly created update with generated ID
   * @throws {Error} If validation fails
   */
  async createUpdate(update: Omit<Update, 'id'>): Promise<Update> {
    const id = crypto.randomUUID();
    const newUpdate = UpdateSchema.parse({ ...update, id });
    this.updates.set(id, newUpdate);
    return newUpdate;
  }

  /**
   * Retrieves a specific update by ID.
   * 
   * @param id - Update ID
   * @returns Update information or undefined if not found
   */
  async getUpdate(id: string): Promise<Update | undefined> {
    return this.updates.get(id);
  }

  /**
   * Lists updates with optional filtering.
   * 
   * @param params - Optional filter parameters
   * @param params.companyId - Filter by company ID
   * @param params.type - Filter by update type (MONTHLY, QUARTERLY, etc.)
   * @param params.startDate - Filter updates after this date
   * @param params.endDate - Filter updates before this date
   * @returns Array of updates sorted by date (newest first)
   */
  async listUpdates(params?: {
    companyId?: string;
    type?: Update['type'];
    startDate?: Date;
    endDate?: Date;
  }): Promise<Update[]> {
    let updates = Array.from(this.updates.values());

    if (params) {
      const { companyId, type, startDate, endDate } = params;

      if (companyId) {
        updates = updates.filter(u => u.companyId === companyId);
      }

      if (type) {
        updates = updates.filter(u => u.type === type);
      }

      if (startDate) {
        updates = updates.filter(u => u.date >= startDate);
      }

      if (endDate) {
        updates = updates.filter(u => u.date <= endDate);
      }
    }

    return updates.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Gets the most recent value for each metric for a company.
   * 
   * @param companyId - Company ID to get metrics for
   * @returns Array of most recent metrics
   */
  async getLatestMetrics(companyId: string): Promise<Metric[]> {
    const updates = await this.listUpdates({ companyId });
    const latestMetrics = new Map<string, Metric>();

    for (const update of updates) {
      for (const metric of update.metrics) {
        if (!latestMetrics.has(metric.name)) {
          latestMetrics.set(metric.name, metric);
        }
      }
    }

    return Array.from(latestMetrics.values());
  }

  /**
   * Retrieves historical values for a specific metric.
   * 
   * @param params - Query parameters
   * @param params.companyId - Company ID to get metric history for
   * @param params.metricName - Name of the metric to track
   * @param params.startDate - Optional start date for history
   * @param params.endDate - Optional end date for history
   * @returns Array of metrics sorted by date (oldest first)
   */
  async getMetricHistory(params: {
    companyId: string;
    metricName: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Metric[]> {
    const { companyId, metricName, startDate, endDate } = params;
    const updates = await this.listUpdates({ companyId, startDate, endDate });

    return updates
      .flatMap(update => update.metrics)
      .filter(metric => metric.name === metricName)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Adds new metrics to an existing update.
   * 
   * @param updateId - ID of the update to add metrics to
   * @param metrics - Array of metrics to add (date will be set to update date)
   * @returns Updated update information
   * @throws {Error} If update not found or validation fails
   */
  async addMetricsToUpdate(updateId: string, metrics: Omit<Metric, 'date'>[]): Promise<Update> {
    const update = this.updates.get(updateId);
    if (!update) {
      throw new Error(`Update with id ${updateId} not found`);
    }

    const newMetrics = metrics.map(metric => MetricSchema.parse({
      ...metric,
      date: update.date,
    }));

    const updatedUpdate = UpdateSchema.parse({
      ...update,
      metrics: [...update.metrics, ...newMetrics],
    });

    this.updates.set(updateId, updatedUpdate);
    return updatedUpdate;
  }
}