import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/lib/types";

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
    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admins can see all funds
      funds = await prisma.fund.findMany({
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          investments: {
            select: {
              id: true,
              amount: true,
              date: true,
              round: true,
            },
          },
          limitedPartners: {
            select: {
              id: true,
              name: true,
              commitment: true,
            },
          },
          capitalCalls: {
            select: {
              id: true,
              date: true,
              amount: true,
              status: true,
            },
          },
        },
      });
    } else if (
      user.role === UserRole.FUND_MANAGER ||
      user.role === UserRole.ANALYST
    ) {
      // Fund managers and analysts can see funds they own
      funds = await prisma.fund.findMany({
        where: {
          ownerId: user.id,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          investments: {
            select: {
              id: true,
              amount: true,
              date: true,
              round: true,
            },
          },
          limitedPartners: {
            select: {
              id: true,
              name: true,
              commitment: true,
            },
          },
          capitalCalls: {
            select: {
              id: true,
              date: true,
              amount: true,
              status: true,
            },
          },
        },
      });
    } else {
      // Read-only users can see basic fund info
      funds = await prisma.fund.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          target: true,
          vintage: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      funds: funds.map((fund: any) => ({
        id: fund.id,
        name: fund.name,
        description: fund.description,
        target: fund.target,
        vintage: fund.vintage,
        status: fund.status,
        createdAt: fund.createdAt,
        updatedAt: fund.updatedAt,
        owner: fund.owner,
        investmentCount: "investments" in fund ? fund.investments.length : null,
        lpCount: "limitedPartners" in fund ? fund.limitedPartners.length : null,
        capitalCallCount: "capitalCalls" in fund ? fund.capitalCalls.length : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching funds:", error);
    return NextResponse.json(
      { error: "Failed to fetch funds" },
      { status: 500 }
    );
  }
}
