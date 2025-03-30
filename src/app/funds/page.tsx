"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Briefcase, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  ArrowUpDown
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ErrorMessage, ApiError } from "@/components/ui/error";
import { Loading, CardLoading } from "@/components/ui/loading";

// Fund type definition
interface Fund {
  id: string;
  name: string;
  fundSize: number;
  vintage: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function FundsPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[] | undefined>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentFund, setCurrentFund] = useState<Fund | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    fundSize: "",
    vintage: new Date().getFullYear().toString(),
    status: "ACTIVE"
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Fetch funds data
  useEffect(() => {
    const fetchFunds = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/funds");
        const data = await response.json();
        
        if (response.ok) {
          setFunds(data);
        } else {
          setError(data.error || "Failed to fetch funds");
          console.error("Failed to fetch funds:", data.error);
        }
      } catch (error) {
        setError("An unexpected error occurred while fetching funds");
        console.error("Error fetching funds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchFunds();
    }
  }, [session]);

  // Filter funds based on search query
  const filteredFunds = funds.filter(fund => 
    fund.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    
    fund.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: "",
      fundSize: "",
      vintage: new Date().getFullYear().toString(),
      status: "ACTIVE",

    });
  };

  // Open edit dialog with fund data
  const openEditDialog = (fund: Fund) => {
    setCurrentFund(fund);
    setFormData({
      name: fund.name,
      fundSize: fund.fundSize.toString(),
      vintage: fund.vintage.toString(),
      status: fund.status,

    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (fund: Fund) => {
    setCurrentFund(fund);
    setShowDeleteDialog(true);
  };

  // Handle add fund
  const handleAddFund = async () => {
    try {
      setFormErrors({});
      
      const response = await fetch("/api/funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          fundSize: parseFloat(formData.fundSize),
          vintage: parseInt(formData.vintage),
          status: formData.status
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFunds(prev => [...prev, data]);
        setShowAddDialog(false);
        resetFormData();
      } else {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          setError(data.error || "Failed to add fund");
        }
        console.error("Failed to add fund:", data.error);
      }
    } catch (error) {
      setError("An unexpected error occurred while adding the fund");
      console.error("Error adding fund:", error);
    }
  };

  // Handle edit fund
  const handleEditFund = async () => {
    if (!currentFund) return;

    try {
      setFormErrors({});
      
      const response = await fetch(`/api/funds/${currentFund.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          fundSize: parseFloat(formData.fundSize),
          vintage: parseInt(formData.vintage),
          status: formData.status
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFunds(prev => 
          prev.map(fund => fund.id === currentFund.id ? data : fund)
        );
        setShowEditDialog(false);
        setCurrentFund(null);
        resetFormData();
      } else {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          setError(data.error || "Failed to update fund");
        }
        console.error("Failed to update fund:", data.error);
      }
    } catch (error) {
      setError("An unexpected error occurred while updating the fund");
      console.error("Error updating fund:", error);
    }
  };

  // Handle delete fund
  const handleDeleteFund = async () => {
    if (!currentFund) return;

    try {
      setError(null);
      
      const response = await fetch(`/api/funds/${currentFund.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setFunds(prev => prev.filter(fund => fund.id !== currentFund.id));
        setShowDeleteDialog(false);
        setCurrentFund(null);
      } else {
        setError(data.error || "Failed to delete fund");
        console.error("Failed to delete fund:", data.error);
      }
    } catch (error) {
      setError("An unexpected error occurred while deleting the fund");
      console.error("Error deleting fund:", error);
    }
  };

  // View fund details
  const viewFundDetails = (fundId: string) => {
    router.push(`/funds/${fundId}`);
  };

  if (loading) {
    return <Loading size="lg" text="Loading..." className="h-[calc(100vh-4rem)]" />;
  }

  return (
    <DashboardLayout user={session?.user || { role: UserRole.READ_ONLY, name: null, email: "", image: null }}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Funds</h1>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search funds..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fund
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Fund</DialogTitle>
                  <DialogDescription>
                    Create a new fund in your portfolio.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Fund Name
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={formErrors.name ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.name?.[0] || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fundSize" className="text-right">
                      Fund Size
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="fundSize"
                        name="fundSize"
                        type="number"
                        value={formData.fundSize}
                        onChange={handleInputChange}
                        className={formErrors.fundSize ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.fundSize?.[0] || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vintage" className="text-right">
                      Vintage Year
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="vintage"
                        name="vintage"
                        type="number"
                        value={formData.vintage}
                        onChange={handleInputChange}
                        className={formErrors.vintage ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.vintage?.[0] || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: string) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="RAISING">Raising</SelectItem>
                        <SelectItem value="FULLY_INVESTED">Fully Invested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    resetFormData();
                    setShowAddDialog(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddFund}>Create Fund</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fund Portfolio</CardTitle>
            <CardDescription>
              Manage your investment funds and track their performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <ApiError error={error} />}
            
            {isLoading ? (
              <CardLoading />
            ) : filteredFunds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No funds found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "Add your first fund to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Vintage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFunds.map((fund) => (
                    <TableRow key={fund.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewFundDetails(fund.id)}>
                      <TableCell className="font-medium">{fund.name}</TableCell>
                      <TableCell>{formatCurrency(fund.fundSize)}</TableCell>
                      <TableCell>{fund.vintage}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          fund.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                          fund.status === "RAISING" ? "bg-blue-100 text-blue-800" :
                          fund.status === "FULLY_INVESTED" ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {fund.status.replace("_", " ")}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openEditDialog(fund);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openDeleteDialog(fund);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Fund Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fund</DialogTitle>
            <DialogDescription>
              Update the details of this fund.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Fund Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-fundSize" className="text-right">
                Fund Size
              </Label>
              <Input
                id="edit-fundSize"
                name="fundSize"
                type="number"
                value={formData.fundSize}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-vintage" className="text-right">
                Vintage Year
              </Label>
              <Input
                id="edit-vintage"
                name="vintage"
                type="number"
                value={formData.vintage}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value: string) => handleSelectChange("status", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="RAISING">Raising</SelectItem>
                  <SelectItem value="FULLY_INVESTED">Fully Invested</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setCurrentFund(null);
              resetFormData();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditFund}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fund Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fund</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fund? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setCurrentFund(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFund}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
