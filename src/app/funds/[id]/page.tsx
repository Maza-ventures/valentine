"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Briefcase, 
  Building, 
  Users, 
  DollarSign, 
  ArrowLeft,
  BarChart,
  PieChart,
  TrendingUp
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Fund type definition with related entities
interface Fund {
  id: string;
  name: string;
  fundSize: number;
  currency: string;
  vintage: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  portfolioCompanies: {
    id: string;
    name: string;
    sector: string;
    totalInvestment: number;
  }[];
  limitedPartners: {
    id: string;
    name: string;
    commitment: number;
  }[];
}

export default function FundDetailPage({ params }: { params: { id: string } }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [fund, setFund] = useState<Fund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Fetch fund data
  useEffect(() => {
    const fetchFundDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/funds/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setFund(data);
        } else {
          console.error("Failed to fetch fund details");
          if (response.status === 404) {
            router.push("/funds");
          }
        }
      } catch (error) {
        console.error("Error fetching fund details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && params.id) {
      fetchFundDetails();
    }
  }, [session, params.id, router]);

  // Calculate fund metrics
  const calculateMetrics = () => {
    if (!fund) return { totalInvested: 0, totalCommitted: 0, remainingCapital: 0, investmentCount: 0 };
    
    const totalInvested = fund.portfolioCompanies.reduce(
      (sum, company) => sum + company.totalInvestment, 
      0
    );
    
    const totalCommitted = fund.limitedPartners.reduce(
      (sum, lp) => sum + lp.commitment, 
      0
    );
    
    return {
      totalInvested,
      totalCommitted,
      remainingCapital: fund.fundSize - totalInvested,
      investmentCount: fund.portfolioCompanies.length
    };
  };

  const metrics = calculateMetrics();

  if (loading || isLoading) {
    return <div>Loading...</div>;
  }

  if (!fund) {
    return <div>Fund not found</div>;
  }

  return (
    <DashboardLayout user={session?.user || { role: "READ_ONLY" }}>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/funds")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{fund.name}</h1>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            fund.status === "ACTIVE" ? "bg-green-100 text-green-800" :
            fund.status === "RAISING" ? "bg-blue-100 text-blue-800" :
            fund.status === "FULLY_INVESTED" ? "bg-purple-100 text-purple-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {fund.status.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fund Size
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(fund.fundSize, fund.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                Vintage {fund.vintage}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invested
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalInvested, fund.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.investmentCount} portfolio companies
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Committed
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalCommitted, fund.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {fund.limitedPartners.length} limited partners
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Remaining Capital
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.remainingCapital, fund.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {((metrics.remainingCapital / fund.fundSize) * 100).toFixed(1)}% available
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList>
            <TabsTrigger value="portfolio">Portfolio Companies</TabsTrigger>
            <TabsTrigger value="lps">Limited Partners</TabsTrigger>
            <TabsTrigger value="overview">Fund Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Portfolio Companies</CardTitle>
                    <CardDescription>
                      Companies in which this fund has invested.
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push(`/companies/new?fundId=${fund.id}`)}>
                    Add Company
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fund.portfolioCompanies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Building className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No portfolio companies yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your first portfolio company to start tracking investments
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead className="text-right">Investment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fund.portfolioCompanies.map((company) => (
                        <TableRow 
                          key={company.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/companies/${company.id}`)}
                        >
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.sector}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(company.totalInvestment, fund.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="lps" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Limited Partners</CardTitle>
                    <CardDescription>
                      Investors who have committed capital to this fund.
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push(`/lps/new?fundId=${fund.id}`)}>
                    Add Limited Partner
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fund.limitedPartners.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No limited partners yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your first limited partner to track commitments
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>LP Name</TableHead>
                        <TableHead className="text-right">Commitment</TableHead>
                        <TableHead className="text-right">% of Fund</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fund.limitedPartners.map((lp) => (
                        <TableRow 
                          key={lp.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.push(`/lps/${lp.id}`)}
                        >
                          <TableCell className="font-medium">{lp.name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(lp.commitment, fund.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {((lp.commitment / fund.fundSize) * 100).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fund Details</CardTitle>
                <CardDescription>
                  Key information about this fund.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Fund Name</h3>
                    <p>{fund.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Fund Size</h3>
                    <p>{formatCurrency(fund.fundSize, fund.currency)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Vintage Year</h3>
                    <p>{fund.vintage}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <p>{fund.status.replace("_", " ")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                    <p>{formatDate(new Date(fund.createdAt))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Investment Allocation</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-40 w-40 rounded-full border-8 border-primary/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {((metrics.totalInvested / fund.fundSize) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Deployed</div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-medium">
                          {formatCurrency(metrics.totalInvested, fund.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">Invested</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium">
                          {formatCurrency(metrics.remainingCapital, fund.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Fund Performance</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BarChart className="h-40 w-40 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Performance metrics coming soon</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track your fund's performance with detailed analytics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
