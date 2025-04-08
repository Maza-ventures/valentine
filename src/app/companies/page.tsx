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

// Company type definition
interface Company {
  id: string;
  name: string;
  sector: string;
  website: string;
  description: string;
  founded: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export default function CompaniesPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[] | undefined>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sector: "",
    website: "",
    description: "",
    founded: new Date().getFullYear(),
    location: ""
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Fetch companies data
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/companies");
        const data = await response.json();
        
        if (response.ok) {
          setCompanies(data);
        } else {
          setError(data.error || "Failed to fetch companies");
          console.error("Failed to fetch companies:", data.error);
        }
      } catch (error) {
        setError("An unexpected error occurred while fetching funds");
        console.error("Error fetching funds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchCompanies();
    }
  }, [session]);

  // Filter companies based on search query
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    
    company.sector.toLowerCase().includes(searchQuery.toLowerCase())
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
      sector: "",
      website: "",
      description: "",
      founded: new Date().getFullYear(),
      location: ""
    });
  };

  // Open edit dialog with company data
  const openEditDialog = (company: Company) => {
    setCurrentCompany(company);
    setFormData({
      name: company.name,
      sector: company.sector,
      website: company.website,
      description: company.description,
      founded: company.founded,
      location: company.location
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (company: Company) => {
    setCurrentCompany(company);
    setShowDeleteDialog(true);
  };

  // Handle add company
  const handleAddCompany = async () => {
    try {
      setFormErrors({});
      
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sector: formData.sector,
          website: formData.website,
          description: formData.description,
          founded: formData.founded,
          location: formData.location
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCompanies(prev => [...prev, data]);
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

  // Handle edit company
  const handleEditCompany = async () => {
    if (!currentCompany) return;

    try {
      setFormErrors({});
      
      const response = await fetch(`/api/companies/${currentCompany.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          sector: formData.sector,
          website: formData.website,
          description: formData.description,
          founded: formData.founded,
          location: formData.location
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCompanies(prev => 
          prev.map(company => company.id === currentCompany.id ? data : company)
        );
        setShowEditDialog(false);
        setCurrentCompany(null);
        resetFormData();
      } else {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          setError(data.error || "Failed to update company");
        }
        console.error("Failed to update company:", data.error);
      }
    } catch (error) {
      setError("An unexpected error occurred while updating the company");
      console.error("Error updating company:", error);
    }
  };

  // Handle delete company
  const handleDeleteCompany = async () => {
    if (!currentCompany) return;

    try {
      setError(null);
      
      const response = await fetch(`/api/companies/${currentCompany.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setCompanies(prev => prev.filter(company => company.id !== currentCompany.id));
        setShowDeleteDialog(false);
        setCurrentCompany(null);
      } else {
        setError(data.error || "Failed to delete company");
        console.error("Failed to delete company:", data.error);
      }
    } catch (error) {
      setError("An unexpected error occurred while deleting the company");
      console.error("Error deleting company:", error);
    }
  };

  // View company details
  const viewCompanyDetails = (companyId: string) => {
    router.push(`/companies/${companyId}`);
  };

  if (loading) {
    return <Loading size="lg" text="Loading..." className="h-[calc(100vh-4rem)]" />;
  }

  return (
    <DashboardLayout user={session?.user || { role: UserRole.READ_ONLY, name: null, email: "", image: null }}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Companies</h1>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search companies..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                  <DialogDescription>
                    Create a new company in your portfolio.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Company Name
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
                    <Label htmlFor="sector" className="text-right">
                      Sector
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="sector"
                        name="sector"
                        value={formData.sector}
                        onChange={handleInputChange}
                        className={formErrors.sector ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.sector?.[0] || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="website" className="text-right">
                      Website
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className={formErrors.website ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.website?.[0] || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={formErrors.description ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.description?.[0] || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="founded" className="text-right">
                      Founded
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="founded"
                        name="founded"
                        type="number"
                        value={formData.founded}
                        onChange={handleInputChange}
                        className={formErrors.founded ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.founded?.[0] || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">
                      Location
                    </Label>
                    <div className="col-span-3 space-y-1">
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className={formErrors.location ? "border-destructive" : ""}
                      />
                      <ErrorMessage message={formErrors.location?.[0] || ""} />
                    </div>
                  </div>

                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    resetFormData();
                    setShowAddDialog(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCompany}>Create Company</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Portfolio</CardTitle>
            <CardDescription>
              Manage your investment companies and track their performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <ApiError error={error} />}
            
            {isLoading ? (
              <CardLoading />
            ) : companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No companies found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search term" : "Add your first company to get started"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Founded</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewCompanyDetails(company.id)}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.sector}</TableCell>
                      <TableCell>{company.website}</TableCell>
                      <TableCell>{company.description}</TableCell>
                      <TableCell>{company.founded}</TableCell>
                      <TableCell>{company.location}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openEditDialog(company);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              openDeleteDialog(company);
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
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update the details of this company.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Company Name
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
              <Label htmlFor="edit-sector" className="text-right">
                Sector
              </Label>
              <Input
                id="edit-sector"
                name="sector"
                value={formData.sector}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-website" className="text-right">
                Website
              </Label>
              <Input
                id="edit-website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-founded" className="text-right">
                Founded
              </Label>
              <Input
                id="edit-founded"
                name="founded"
                type="number"
                value={formData.founded}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-location" className="text-right">
                Location
              </Label>
              <Input
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setCurrentCompany(null);
              resetFormData();
            }}>
              Cancel
            </Button>
            <Button onClick={handleEditCompany}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setCurrentCompany(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
