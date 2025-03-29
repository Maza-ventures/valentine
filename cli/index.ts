#!/usr/bin/env node
import { Command } from 'commander';
import { fundCommands } from './commands/fund';
import { companyCommands } from './commands/company';
import { taskCommands } from './commands/task';
import { capitalCallCommands } from './commands/capital-call';
import { lpCommands } from './commands/lp';
import { checkInCommands } from './commands/check-in';
import { authCommands } from './commands/auth';
import { version } from '../package.json';

const program = new Command();

// Set up the CLI program
program
  .name('vc-cli')
  .description('CLI tool for managing VC investments, funds, and operations')
  .version(version);

// Register command groups
fundCommands(program);
companyCommands(program);
taskCommands(program);
capitalCallCommands(program);
lpCommands(program);
checkInCommands(program);
authCommands(program);

// Add global options
program.option('-v, --verbose', 'Enable verbose output');

// Parse command line arguments
program.parse(process.argv);
