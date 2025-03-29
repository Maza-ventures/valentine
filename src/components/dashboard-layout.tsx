"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Briefcase, 
  Building, 
  PieChart, 
  ClipboardCheck, 
  CheckSquare, 
  Users, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
  };
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Funds", href: "/funds", icon: Briefcase },
  { name: "Portfolio Companies", href: "/companies", icon: Building },
  { name: "Investments", href: "/investments", icon: PieChart },
  { name: "Check-ins", href: "/check-ins", icon: ClipboardCheck },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Limited Partners", href: "/lps", icon: Users },
  { name: "Capital Calls", href: "/capital-calls", icon: DollarSign },
  { name: "Statements", href: "/statements", icon: FileText },
];

// Admin-only navigation items
const adminNavigation = [
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r border-border pt-5 bg-card overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <span className="text-xl font-semibold tracking-tight">Valentine</span>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 flex-shrink-0 h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}

              {/* Admin navigation items */}
              {isSuperAdmin && (
                <>
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-card text-xs text-muted-foreground">Admin</span>
                    </div>
                  </div>

                  {adminNavigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 flex-shrink-0 h-5 w-5",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-border p-4">
            <div className="flex items-center w-full justify-between">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut()}
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
