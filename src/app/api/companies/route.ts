import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/types";
import { z } from "zod";

// Define validation schema for creating/updating funds
const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  sector: z.string().min(1, "Sector is required"),
  website: z.string().url("Invalid URL").optional(),
  description: z.string().optional(),
  founded: z.number().int().positive("Founded year must be positive"),
  location: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// GET: Fetch all companies
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    let companies;

    // Filter funds based on user role
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.FUND_MANAGER) {
      // Super admins and fund managers can see all funds
      companies = await prisma.portfolioCompany.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Analysts and read-only users can only see active funds
      companies = await prisma.portfolioCompany.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST: Create a new company
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // Check if user has permission to create companies
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FUND_MANAGER) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = companySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid company data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const companyData = validationResult.data;

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
    
    // Create new company with direct ownerId assignment
    const newCompany = await prisma.portfolioCompany.create({
      data: {
        name: companyData.name,
        sector: companyData.sector,
        website: companyData.website,
        description: companyData.description,
        founded: companyData.founded,
        location: companyData.location,
      }
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
