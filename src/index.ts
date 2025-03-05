import { NAVService } from './services/nav';
import { PortfolioService } from './services/portfolio';
import { UpdatesService } from './services/updates';

// Export all types
export * from './models/types';

// Export services
export { PortfolioService } from './services/portfolio';
export { NAVService } from './services/nav';
export { UpdatesService } from './services/updates';

// Create a main Valentine class that combines all services
export class Valentine {
  readonly portfolio: PortfolioService;
  readonly nav: NAVService;
  readonly updates: UpdatesService;

  constructor() {
    this.portfolio = new PortfolioService();
    this.nav = new NAVService();
    this.updates = new UpdatesService();
  }
}