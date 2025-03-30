import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/types";
import { z } from "zod";

// Define validation schema for creating/updating funds
const fundSchema = z.object({
  name: z.string().min(1, "Fund name is required"),
  fundSize: z.number().positive("Fund size must be positive"),
  vintage: z.number().int().positive("Vintage year must be positive"),
  status: z.enum(["ACTIVE", "CLOSED", "RAISING", "FULLY_INVESTED"]),
  target: z.number().positive("Target must be positive").optional(),
});

// GET: Fetch all funds
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    let funds;

    // Filter funds based on user role
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.FUND_MANAGER) {
      // Super admins and fund managers can see all funds
      funds = await prisma.fund.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Analysts and read-only users can only see active funds
      funds = await prisma.fund.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(funds);
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch funds" },
      { status: 500 }
    );
  }
}

// POST: Create a new fund
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // Check if user has permission to create funds
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FUND_MANAGER) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = fundSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid fund data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const fundData = validationResult.data;

    // Try to find the user first to verify it exists
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database", userId: user.id },
        { status: 400 }
      );
    }
    
    // Create new fund with direct ownerId assignment
    const newFund = await prisma.fund.create({
      data: {
        name: fundData.name,
        fundSize: fundData.fundSize,
        vintage: fundData.vintage,
        status: fundData.status,
        ownerId: dbUser.id
      }
    });

    return NextResponse.json(newFund, { status: 201 });
  } catch (error) {
    console.error("Error creating fund:", error);
    return NextResponse.json(
      { error: "Failed to create fund" },
      { status: 500 }
    );
  }
}
