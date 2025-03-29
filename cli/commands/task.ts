import { Command } from 'commander';
import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';
import { getAuthenticatedUser } from '../utils/auth';

const prisma = new PrismaClient();

export function taskCommands(program: Command) {
  const task = program.command('task')
    .description('Manage tasks');

  // List tasks
  task
    .command('list')
    .description('List tasks')
    .option('--status <status>', 'Filter by status (TODO, IN_PROGRESS, DONE, CANCELED)')
    .option('--priority <priority>', 'Filter by priority (LOW, MEDIUM, HIGH, URGENT)')
    .option('--company <companyId>', 'Filter by company ID')
    .option('--assigned-to <userId>', 'Filter by assigned user ID')
    .option('--created-by <userId>', 'Filter by creator user ID')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Build filter
        const filter: any = {};
        if (options.status) filter.status = options.status;
        if (options.priority) filter.priority = options.priority;
        if (options.company) filter.companyId = options.company;
        
        // Apply user-specific filters
        if (user.role !== 'SUPER_ADMIN') {
          if (options.assignedTo) {
            // Only allow filtering by assigned user if it's the current user or they're an admin
            if (options.assignedTo !== user.id && user.role !== 'FUND_MANAGER') {
              console.error('You can only filter by tasks assigned to you.');
              return;
            }
            filter.assignedToId = options.assignedTo;
          }
          
          if (options.createdBy) {
            // Only allow filtering by creator if it's the current user or they're an admin
            if (options.createdBy !== user.id && user.role !== 'FUND_MANAGER') {
              console.error('You can only filter by tasks created by you.');
              return;
            }
            filter.createdById = options.createdBy;
          }
        } else {
          // Super admin can filter by any user
          if (options.assignedTo) filter.assignedToId = options.assignedTo;
          if (options.createdBy) filter.createdById = options.createdBy;
        }

        // Get tasks
        const tasks = await prisma.task.findMany({
          where: filter,
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' },
          ],
        });

        if (tasks.length === 0) {
          console.log('No tasks found.');
          return;
        }

        console.log(`Found ${tasks.length} tasks:\n`);
        tasks.forEach((task) => {
          console.log(`ID: ${task.id}`);
          console.log(`Description: ${task.description}`);
          console.log(`Status: ${task.status}`);
          console.log(`Priority: ${task.priority}`);
          console.log(`Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}`);
          console.log(`Company: ${task.company ? task.company.name : 'N/A'}`);
          console.log(`Assigned To: ${task.assignedTo ? task.assignedTo.name : 'Unassigned'}`);
          console.log(`Created By: ${task.createdBy.name}`);
          console.log(`Created At: ${new Date(task.createdAt).toLocaleString()}`);
          console.log('---');
        });
      } catch (error) {
        console.error('Error listing tasks:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Create a task
  task
    .command('create')
    .description('Create a new task')
    .requiredOption('--description <description>', 'Task description')
    .option('--due <dueDate>', 'Due date (YYYY-MM-DD)')
    .option('--priority <priority>', 'Priority (LOW, MEDIUM, HIGH, URGENT)', 'MEDIUM')
    .option('--company <companyName>', 'Company name')
    .option('--assign-to <userEmail>', 'Email of user to assign task to')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Check if user has permission to create tasks
        if (user.role === 'READ_ONLY') {
          console.error('You do not have permission to create tasks.');
          return;
        }

        // Validate priority
        if (!Object.values(TaskPriority).includes(options.priority as TaskPriority)) {
          console.error(`Invalid priority. Must be one of: ${Object.values(TaskPriority).join(', ')}`);
          return;
        }

        // Find company if provided
        let companyId = null;
        if (options.company) {
          const company = await prisma.portfolioCompany.findFirst({
            where: { name: options.company },
          });

          if (!company) {
            console.error(`Company '${options.company}' not found.`);
            return;
          }

          companyId = company.id;
        }

        // Find assignee if provided
        let assignedToId = null;
        if (options.assignTo) {
          const assignee = await prisma.user.findUnique({
            where: { email: options.assignTo },
          });

          if (!assignee) {
            console.error(`User with email '${options.assignTo}' not found.`);
            return;
          }

          assignedToId = assignee.id;
        }

        // Create the task
        const task = await prisma.task.create({
          data: {
            description: options.description,
            dueDate: options.due ? new Date(options.due) : undefined,
            priority: options.priority as TaskPriority,
            status: 'TODO',
            companyId,
            assignedToId,
            createdById: user.id,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        console.log(`Task created successfully!`);
        console.log(`ID: ${task.id}`);
        console.log(`Description: ${task.description}`);
        console.log(`Status: ${task.status}`);
        console.log(`Priority: ${task.priority}`);
        console.log(`Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}`);
        console.log(`Company: ${task.company ? task.company.name : 'N/A'}`);
        console.log(`Assigned To: ${task.assignedTo ? task.assignedTo.name : 'Unassigned'}`);
      } catch (error) {
        console.error('Error creating task:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  // Update task status
  task
    .command('update-status')
    .description('Update task status')
    .requiredOption('--id <id>', 'Task ID')
    .requiredOption('--status <status>', 'New status (TODO, IN_PROGRESS, DONE, CANCELED)')
    .action(async (options) => {
      try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Validate status
        if (!Object.values(TaskStatus).includes(options.status as TaskStatus)) {
          console.error(`Invalid status. Must be one of: ${Object.values(TaskStatus).join(', ')}`);
          return;
        }

        // Check if task exists
        const existingTask = await prisma.task.findUnique({
          where: { id: options.id },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (!existingTask) {
          console.error(`Task with ID ${options.id} not found.`);
          return;
        }

        // Check if user has permission to update this task
        if (
          user.role !== 'SUPER_ADMIN' &&
          user.role !== 'FUND_MANAGER' &&
          existingTask.createdById !== user.id &&
          existingTask.assignedToId !== user.id
        ) {
          console.error('You do not have permission to update this task.');
          return;
        }

        // Update the task
        const updatedTask = await prisma.task.update({
          where: { id: options.id },
          data: {
            status: options.status as TaskStatus,
          },
        });

        console.log(`Task status updated successfully!`);
        console.log(`ID: ${updatedTask.id}`);
        console.log(`Description: ${updatedTask.description}`);
        console.log(`New Status: ${updatedTask.status}`);
        console.log(`Assigned To: ${existingTask.assignedTo ? existingTask.assignedTo.name : 'Unassigned'}`);
      } catch (error) {
        console.error('Error updating task status:', error);
      } finally {
        await prisma.$disconnect();
      }
    });

  return task;
}
