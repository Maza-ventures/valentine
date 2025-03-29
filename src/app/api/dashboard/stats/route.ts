import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get counts from database
    const [
      fundsCount,
      companiesCount,
      tasksCount,
      capitalCallsCount,
      lpsCount
    ] = await Promise.all([
      prisma.fund.count(),
      prisma.portfolioCompany.count(),
      prisma.task.count(),
      prisma.capitalCall.count(),
      prisma.limitedPartner.count()
    ]);

    return NextResponse.json({
      funds: fundsCount,
      companies: companiesCount,
      tasks: tasksCount,
      capitalCalls: capitalCallsCount,
      lps: lpsCount
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
