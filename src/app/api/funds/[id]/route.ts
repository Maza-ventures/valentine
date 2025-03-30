import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/types";
import { z } from "zod";

// Define validation schema for updating funds
const fundUpdateSchema = z.object({
  name: z.string().min(1, "Fund name is required").optional(),
  fundSize: z.number().positive("Fund size must be positive").optional(),
  currency: z.string().min(1, "Currency is required").optional(),
  vintage: z.number().int().positive("Vintage year must be positive").optional(),
  status: z.enum(["ACTIVE", "CLOSED", "RAISING", "FULLY_INVESTED"]).optional(),
});

// GET: Fetch a specific fund by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fundId = params.id;

    // Fetch fund with related data
    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      include: {
        portfolioCompanies: {
          select: {
            id: true,
            name: true,
            sector: true,
          }
        },
        limitedPartners: {
          select: {
            id: true,
            name: true,
            commitment: true
          }
        }
      }
    });

    if (!fund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    return NextResponse.json(fund);
  } catch (error) {
    console.error("Error fetching fund:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund" },
      { status: 500 }
    );
  }
}

// PUT: Update a fund by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const fundId = params.id;

    // Check if user has permission to update funds
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FUND_MANAGER) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Check if fund exists
    const existingFund = await prisma.fund.findUnique({
      where: { id: fundId }
    });

    if (!existingFund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = fundUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid fund data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const fundData = validationResult.data; 

    // Update fund
    const updatedFund = await prisma.fund.update({
      where: { id: fundId },
      data: {
        ...fundData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedFund);
  } catch (error) {
    console.error("Error updating fund:", error);
    return NextResponse.json(
      { error: "Failed to update fund" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a fund by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const fundId = params.id;

    // Check if user has permission to delete funds
    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Check if fund exists
    const existingFund = await prisma.fund.findUnique({
      where: { id: fundId }
    });

    if (!existingFund) {
      return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    }

    // Delete fund
    await prisma.fund.delete({
      where: { id: fundId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fund:", error);
    return NextResponse.json(
      { error: "Failed to delete fund" },
      { status: 500 }
    );
  }
}
