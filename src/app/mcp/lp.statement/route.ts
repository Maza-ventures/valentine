import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const lpName = searchParams.get("lp");
    const fundName = searchParams.get("fund");

    if (!lpName || !fundName) {
      return NextResponse.json(
        { error: "LP name and fund name are required" },
        { status: 400 }
      );
    }

    // Find the LP and fund
    const lp = await prisma.limitedPartner.findFirst({
      where: {
        name: lpName,
        fund: {
          name: fundName,
        },
      },
      include: {
        fund: true,
        responses: {
          include: {
            capitalCall: true,
          },
        },
      },
    });

    if (!lp) {
      return NextResponse.json(
        { error: "LP or fund not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const user = session.user;
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.FUND_MANAGER &&
      lp.fund.ownerId !== user.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to view this LP statement" },
        { status: 403 }
      );
    }

    // Calculate statement data
    const commitment = lp.commitment;
    const capitalCalls = lp.responses.map((response) => ({
      id: response.capitalCall.id,
      date: response.capitalCall.date,
      dueDate: response.capitalCall.dueDate,
      amount: response.capitalCall.amount,
      percentage: response.capitalCall.percentage,
      status: response.capitalCall.status,
      amountPaid: response.amountPaid,
      datePaid: response.datePaid,
      paymentStatus: response.status,
    }));

    // Calculate totals
    const totalCalled = capitalCalls.reduce(
      (sum, call) => sum + call.amount,
      0
    );
    const totalPaid = capitalCalls.reduce(
      (sum, call) => sum + call.amountPaid,
      0
    );
    const outstandingBalance = commitment - totalPaid;
    const remainingCommitment = commitment - totalCalled;

    return NextResponse.json({
      statement: {
        lp: {
          id: lp.id,
          name: lp.name,
          email: lp.email,
          type: lp.type,
        },
        fund: {
          id: lp.fund.id,
          name: lp.fund.name,
          vintage: lp.fund.vintage,
        },
        commitment,
        totalCalled,
        totalPaid,
        outstandingBalance,
        remainingCommitment,
        capitalCalls,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error generating LP statement:", error);
    return NextResponse.json(
      { error: "Failed to generate LP statement" },
      { status: 500 }
    );
  }
}
