"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  Building, 
  CheckSquare, 
  DollarSign, 
  Users,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    funds: 0,
    companies: 0,
    tasks: 0,
    capitalCalls: 0,
    lps: 0
  });

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/login");
  }

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Loading state
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  // Mock data for the dashboard
  const upcomingTasks = [
    { id: "1", description: "Follow up with Acme Inc", dueDate: "2025-04-15", company: "Acme Inc", priority: "HIGH" },
    { id: "2", description: "Review TechCorp financials", dueDate: "2025-04-20", company: "TechCorp", priority: "MEDIUM" },
    { id: "3", description: "Prepare for board meeting", dueDate: "2025-04-25", company: null, priority: "HIGH" },
  ];

  const recentActivities = [
    { id: "1", type: "Investment", description: "New investment in Acme Inc", date: "2025-03-25" },
    { id: "2", type: "Capital Call", description: "Capital call for Seed Fund I", date: "2025-03-20" },
    { id: "3", type: "Check-in", description: "Monthly check-in with TechCorp", date: "2025-03-15" },
  ];

  return (
    <DashboardLayout user={session.user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/funds/new">
                <Briefcase className="mr-2 h-4 w-4" />
                New Fund
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/companies/new">
                <Building className="mr-2 h-4 w-4" />
                Add Company
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary/10 p-3">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">Funds</h3>
                <div className="mt-1 text-2xl font-semibold">{stats.funds || 2}</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary/10 p-3">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">Companies</h3>
                <div className="mt-1 text-2xl font-semibold">{stats.companies || 2}</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary/10 p-3">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">Tasks</h3>
                <div className="mt-1 text-2xl font-semibold">{stats.tasks || 3}</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary/10 p-3">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">Capital Calls</h3>
                <div className="mt-1 text-2xl font-semibold">{stats.capitalCalls || 1}</div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-muted-foreground">LPs</h3>
                <div className="mt-1 text-2xl font-semibold">{stats.lps || 2}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming Tasks */}
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Upcoming Tasks</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">View all</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-start p-3 rounded-md border border-border">
                  <div className="flex-shrink-0 mt-1">
                    <AlertCircle className={`h-5 w-5 ${
                      task.priority === "HIGH" ? "text-destructive" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium">{task.description}</div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <span>Due: {task.dueDate}</span>
                      {task.company && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{task.company}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Recent Activity</h2>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 rounded-md border border-border">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === "Investment" && <TrendingUp className="h-5 w-5 text-primary" />}
                    {activity.type === "Capital Call" && <DollarSign className="h-5 w-5 text-primary" />}
                    {activity.type === "Check-in" && <CheckSquare className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium">{activity.description}</div>
                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                      <span>{activity.date}</span>
                      <span className="mx-1">•</span>
                      <span>{activity.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
