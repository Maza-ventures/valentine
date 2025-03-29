# Valentine - VC Investment Management Platform

Valentine is a full-stack TypeScript-based open-source application that helps venture capital and private equity firms track their investments, LPs, and fund operations.

## Features

- **Multi-user support**: Each user can manage multiple funds
- **Role-based authorization**:
  - Super Admins: Full access to all data and user management
  - Fund Managers / Analysts: Scoped access to assigned funds and portfolio companies
  - Read-only Users: View-only access
- **Fund Management**: Create and manage multiple funds, track fund performance
- **Portfolio Companies**: Track company details, sectors, and performance metrics
- **Investment Tracking**: Record investments with metadata like amount, date, and round
- **Recurring Check-ins**: Schedule and record regular check-ins with portfolio companies
- **Task Management**: Assign and track tasks with deadlines and priorities
- **LP Management**: Track limited partners and their commitments
- **Capital Call Tracking**: Record capital calls and track LP payments
- **Capital Account Statements**: Generate statements for each LP

## Architecture

Valentine runs as:
- A web application running on `localhost:3000`
- A CLI tool for managing data and triggering actions
- An MCP-compatible HTTP API server for use with LLMs or agents

## Technology Stack

- **Frontend**: Next.js, Shadcn UI, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with social login support
- **CLI**: TypeScript with Commander.js
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/valentine.git
   cd valentine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your database connection string and auth provider credentials.

4. Set up the database:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

### CLI Usage

The Valentine CLI provides a command-line interface for managing your VC operations:

```bash
# Login to the CLI
npx vc-cli auth login --email admin@valentine.vc

# Create a new fund
npx vc-cli fund create --name "Seed Fund I" --target 50000000 --vintage 2025

# Create a task
npx vc-cli task create --company "Acme Inc" --description "Follow up" --due "2025-04-15"

# Create a capital call
npx vc-cli capital-call create --fund "Seed Fund I" --amount 1000000 --due "2025-04-15"
```

## MCP Endpoints

Valentine exposes structured JSON endpoints under the `/mcp/` path for use with LLMs or agents:

- `GET /mcp/fund.list` - List all funds
- `GET /mcp/lp.statement?lp=InvestorA&fund=FundX` - Get LP statement
- `GET /mcp/company.last-contact?company=Acme Inc` - Get company's last contact info
- `POST /mcp/task.create` - Create a new task

All MCP endpoints require authentication and respect role-based access controls.

## Deployment

### Deploying to Fly.io

1. Install the Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Log in to Fly:
   ```bash
   fly auth login
   ```

3. Launch the app:
   ```bash
   fly launch
   ```

4. Add a PostgreSQL database:
   ```bash
   fly postgres create
   ```

5. Connect the database:
   ```bash
   fly postgres attach --app valentine <postgres-app-name>
   ```

6. Deploy the app:
   ```bash
   fly deploy
   ```

## Security

- All API, CLI, and MCP endpoints require authentication
- Role-based authorization for all access
- No public endpoints or unauthenticated access allowed
- Secure defaults: proper CORS, secure cookies, rate limiting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
