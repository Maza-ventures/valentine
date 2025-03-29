import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Define validation schema
const taskCreateSchema = z.object({
  description: z.string().min(1, "Description is required"),
  dueDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
  companyName: z.string().optional(),
  assignToEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const user = session.user;
    if (user.role === UserRole.READ_ONLY) {
      return NextResponse.json(
        { error: "You don't have permission to create tasks" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = taskCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { description, dueDate, priority, companyName, assignToEmail } = validationResult.data;

    // Find company if provided
    let companyId = null;
    if (companyName) {
      const company = await prisma.portfolioCompany.findFirst({
        where: { name: companyName },
      });

      if (!company) {
        return NextResponse.json(
          { error: `Company '${companyName}' not found` },
          { status: 404 }
        );
      }

      companyId = company.id;
    }

    // Find assignee if provided
    let assignedToId = null;
    if (assignToEmail) {
      const assignee = await prisma.user.findUnique({
        where: { email: assignToEmail },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: `User with email '${assignToEmail}' not found` },
          { status: 404 }
        );
      }

      assignedToId = assignee.id;
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        description,
        dueDate,
        priority,
        status: "TODO",
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        status: task.status,
        company: task.company,
        assignedTo: task.assignedTo,
        createdBy: task.createdBy,
        createdAt: task.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
