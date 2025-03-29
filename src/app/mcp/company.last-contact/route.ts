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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const companyName = searchParams.get("company");

    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Find the company
    const company = await prisma.portfolioCompany.findFirst({
      where: {
        name: companyName,
      },
      include: {
        checkIns: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
        tasks: {
          where: {
            status: {
              in: ["TODO", "IN_PROGRESS"],
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 5,
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        investments: {
          orderBy: {
            date: "desc",
          },
          take: 1,
          include: {
            fund: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Calculate days since last contact
    const lastCheckIn = company.checkIns[0];
    const daysSinceLastContact = lastCheckIn
      ? Math.floor(
          (new Date().getTime() - new Date(lastCheckIn.date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        sector: company.sector,
        website: company.website,
        lastContact: lastCheckIn
          ? {
              date: lastCheckIn.date,
              daysSince: daysSinceLastContact,
              notes: lastCheckIn.notes,
              metrics: {
                revenue: lastCheckIn.revenue,
                burn: lastCheckIn.burn,
                runway: lastCheckIn.runway,
                headcount: lastCheckIn.headcount,
                customMetrics: lastCheckIn.metrics,
              },
            }
          : null,
        upcomingTasks: company.tasks.map((task) => ({
          id: task.id,
          description: task.description,
          dueDate: task.dueDate,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo,
        })),
        latestInvestment: company.investments[0]
          ? {
              id: company.investments[0].id,
              amount: company.investments[0].amount,
              date: company.investments[0].date,
              round: company.investments[0].round,
              fund: {
                id: company.investments[0].fund.id,
                name: company.investments[0].fund.name,
              },
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching company last contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch company last contact" },
      { status: 500 }
    );
  }
}
