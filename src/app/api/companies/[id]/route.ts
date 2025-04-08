import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/types";
import { z } from "zod";

// Define validation schema for updating companies
const companyUpdateSchema = z.object({
  name: z.string().min(1, "Company name is required").optional(),
  sector: z.string().min(1, "Sector is required").optional(),
  website: z.string().url("Invalid URL").optional(),
  description: z.string().optional(),
  founded: z.number().int().positive("Founded year must be positive").optional(),
  location: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// GET: Fetch a specific company by ID
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

    const companyId = params.id;

    // Fetch company with related data
    const company = await prisma.portfolioCompany.findUnique({
      where: { id: companyId },
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

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PUT: Update a company by ID
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
    const companyId = params.id;

    // Check if user has permission to update funds
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FUND_MANAGER) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Check if company exists
    const existingCompany = await prisma.portfolioCompany.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = companyUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid company data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const companyData = validationResult.data; 

    // Update company
    const updatedCompany = await prisma.portfolioCompany.update({
      where: { id: companyId },
      data: {
        ...companyData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a company by ID
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
    const companyId = params.id;

    // Check if user has permission to delete funds
    if (user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Check if company exists
    const existingCompany = await prisma.portfolioCompany.findUnique({
      where: { id: companyId }
    });

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Delete company
    await prisma.portfolioCompany.delete({
      where: { id: companyId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
