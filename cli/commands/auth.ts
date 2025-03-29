import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { saveAuthData, loadAuthData, clearAuthData } from '../utils/auth';

const prisma = new PrismaClient();

export function authCommands(program: Command) {
  const auth = program.command('auth')
    .description('Authentication commands');

  // Login command
  auth
    .command('login')
    .description('Login to Valentine CLI')
    .requiredOption('--email <email>', 'Email address')
    .action(async (options) => {
      try {
        // For development, allow login with any of the mock user emails
        const mockEmails = [
          'admin@valentine.vc',
          'manager@valentine.vc',
          'analyst@valentine.vc',
          'readonly@valentine.vc',
        ];

        if (mockEmails.includes(options.email)) {
          saveAuthData({ email: options.email });
          console.log(`Logged in successfully as ${options.email} (Development Mode)`);
          return;
        }

        // Check if user exists in the database
        const user = await prisma.user.findUnique({
          where: { email: options.email },
        });

        if (!user) {
          console.error(`User with email ${options.email} not found.`);
          return;
        }

        // In a real application, we would implement proper authentication here
        // For now, we'll just save the email
        saveAuthData({ email: options.email });
        console.log(`Logged in successfully as ${options.email}`);
      } catch (error) {
        console.error('Error logging in:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Logout command
  auth
    .command('logout')
    .description('Logout from Valentine CLI')
    .action(() => {
      clearAuthData();
      console.log('Logged out successfully');
    });

  // Status command
  auth
    .command('status')
    .description('Check authentication status')
    .action(async () => {
      try {
        const authData = loadAuthData();
        
        if (!authData) {
          console.log('Not logged in');
          return;
        }

        // For development, check mock users first
        const mockEmails = [
          'admin@valentine.vc',
          'manager@valentine.vc',
          'analyst@valentine.vc',
          'readonly@valentine.vc',
        ];

        if (mockEmails.includes(authData.email)) {
          console.log(`Logged in as ${authData.email} (Development Mode)`);
          return;
        }

        // Check if user exists in the database
        const user = await prisma.user.findUnique({
          where: { email: authData.email },
        });

        if (!user) {
          console.log(`Logged in as ${authData.email}, but user not found in database`);
          return;
        }

        console.log(`Logged in as ${user.email} (${user.role})`);
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  return auth;
}
