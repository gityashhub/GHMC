import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Plus, Search, Filter, Eye, Trash2, Loader2, Edit, Edit2, MapPin, Building2, Download } from "lucide-react";
import companiesService, { Company, CreateCompanyData } from "@/services/companies.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { isValidEmail, isValidPhone, isValidGST, formatPhoneNumber, formatGSTNumber } from "@/utils/validation";
import { exportToCSV, formatCurrencyForExport } from "@/utils/export";
import { useAuth } from "@/contexts/AuthContext";

export default function Companies() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    address: "",
    city: "",
    contact: "",
    email: "",
    materials: [{ id: "", material: "", rate: "", unit: "Kg" as "MT" | "Kg" | "KL" }],
  });

  // Fetch companies (use debounced search term with pagination)
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['companies', debouncedSearchTerm, currentPage, pageSize],
    queryFn: () => companiesService.getCompanies({
      search: debouncedSearchTerm || undefined,
      page: currentPage,
      limit: pageSize,
    }),
    staleTime: 0, // Always fetch fresh data when filters change
  });

  // Fetch global stats
  const { data: statsData } = useQuery({
    queryKey: ['company-stats'],
    queryFn: () => companiesService.getGlobalStats(),
    staleTime: 0,
    refetchInterval: 10000,
  });

  // Create company mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyData) => companiesService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Company created successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create company');
    },
  });

  // Update company mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; companyData: any; materials: any[] }) => {
      // 1. Update Company Details
      await companiesService.updateCompany(data.id, data.companyData);

      // 2. Handle Materials
      // We need to fetch current materials to compare? Or the parent component passed them.
      // Better: assume formData materials are the source of truth.
      // We will blindly sync current formData materials.

      // Fetch fresh existing materials to diff
      const existingMaterials = await companiesService.getCompanyMaterials(data.id);

      const formMaterials = data.materials;

      // A. Delete materials that are not in form
      const formMaterialIds = formMaterials.filter(m => m.id).map(m => m.id);
      const toDelete = existingMaterials.filter(m => !formMaterialIds.includes(m.id));

      for (const m of toDelete) {
        await companiesService.removeMaterial(data.id, m.id);
      }

      // B. Update or Add
      for (const m of formMaterials) {
        if (m.id) {
          // Update existing
          await companiesService.updateMaterial(data.id, m.id, {
            material: m.material,
            rate: Number(m.rate),
            unit: m.unit
          });
        } else {
          // Add new
          // Only add if it has content
          if (m.material && m.rate) {
            await companiesService.addMaterial(data.id, {
              material: m.material,
              rate: Number(m.rate),
              unit: m.unit
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Company updated successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update company');
    },
  });

  // Delete company mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Company deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete company');
    },
  });

  const companies = data?.companies || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialChange = (index: number, field: 'material' | 'rate' | 'unit', value: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { id: "", material: "", rate: "", unit: "Kg" }]
    }));
  };

  const removeMaterial = (index: number) => {
    if (formData.materials.length > 1) {
      setFormData(prev => ({
        ...prev,
        materials: prev.materials.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    // Validate email if provided
    if (formData.email.trim() && !isValidEmail(formData.email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate phone if provided
    if (formData.contact.trim() && !isValidPhone(formData.contact.trim())) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    // Validate GST if provided
    if (formData.gstNumber.trim() && !isValidGST(formData.gstNumber.trim())) {
      toast.error("Please enter a valid GST number (15 characters)");
      return;
    }

    const validMaterials = formData.materials
      .filter(m => m.material.trim() && m.rate.toString().trim() && m.unit) // Ensure checks work on numbers too if rate is number
      .map(m => ({
        id: m.id,
        material: m.material.trim(),
        rate: parseFloat(m.rate as string) || 0,
        unit: m.unit
      }));

    // Only validate materials for admins
    if (user?.role === 'admin' && validMaterials.length === 0) {
      toast.error("Please add at least one material with rate and unit");
      return;
    }

    const companyData: CreateCompanyData = {
      name: formData.name.trim(),
      gstNumber: formData.gstNumber.trim() ? formatGSTNumber(formData.gstNumber.trim()) : undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      contact: formData.contact.trim() ? formatPhoneNumber(formData.contact.trim()) : undefined,
      email: formData.email.trim() || undefined,
      materials: validMaterials,
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        companyData: companyData,
        materials: validMaterials
      });
    } else {
      createMutation.mutate(companyData);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      gstNumber: company.gstNumber || "",
      address: company.address || "",
      city: company.city || "",
      contact: company.contact || "",
      email: company.email || "",
      materials: company.materials && company.materials.length > 0
        ? company.materials.map(m => ({
          id: m.id, // Store ID for updates
          material: m.materialName,
          rate: m.rate.toString(),
          unit: m.unit as any
        }))
        : [{ id: "", material: "", rate: "", unit: "Kg" }]
    });
    setIsModalOpen(true);
  };

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm.id) return;
    deleteMutation.mutate(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: null });
  }, [deleteConfirm, deleteMutation]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      gstNumber: "",
      address: "",
      city: "",
      contact: "",
      email: "",
      materials: [{ id: "", material: "", rate: "", unit: "Kg" }],
    });
  };

  // Use global stats if available, otherwise 0
  const totalInvoiced = statsData?.totalInvoiced || 0;
  const totalPaid = statsData?.totalPaid || 0;
  const totalPending = statsData?.totalPending || 0;

  const columns = [
    {
      key: "name",
      header: "Company Name",
      render: (company: Company) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{company.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-xs">{company.address || '-'}</p>
          </div>
        </div>
      ),
    },
    { key: "city", header: "City", render: (c: Company) => c.city || '-' },
    { key: "contact", header: "Contact", render: (c: Company) => c.contact || '-' },
    { key: "gstNumber", header: "GST Number", render: (c: Company) => c.gstNumber || '-' },
    ...(user?.role === 'admin' ? [{
      key: "materials",
      header: "Materials & Rates",
      render: (company: Company) => (
        <div className="text-sm">
          {company.materials && company.materials.length > 0 ? (
            company.materials.slice(0, 2).map((item, index) => (
              <div key={`${item.id}-${index}`} className="mb-1">
                <span className="font-medium">{item.materialName}</span>
                <span className="text-muted-foreground ml-2">₹{Number(item.rate).toFixed(2)}/{item.unit}</span>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">No materials</span>
          )}
        </div>
      ),
    }] : []),
    ...(user?.role === 'admin' ? [
      {
        key: "totalInvoiced",
        header: "Total Invoiced",
        render: (company: Company) => `₹${(company.totalInvoiced || 0).toLocaleString()}`,
      },
      {
        key: "totalPaid",
        header: "Total Paid",
        render: (company: Company) => (
          <span className="text-success">₹{(company.totalPaid || 0).toLocaleString()}</span>
        ),
      },
      {
        key: "totalPending",
        header: "Pending",
        render: (company: Company) => {
          const pending = company.totalPending || 0;
          return (
            <span className={pending > 0 ? "text-destructive" : "text-success"}>
              ₹{pending.toLocaleString()}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        render: (company: Company) => {
          const pending = company.totalPending || 0;
          const paid = company.totalPaid || 0;
          const status = pending === 0 ? "paid" : paid > 0 ? "partial" : "pending";
          return <StatusBadge status={status} />;
        },
      },
    ] : []),
    {
      key: "actions",
      header: "Actions",
      render: (company: Company) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedCompany(company)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(company)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(company.id)}
            disabled={deleteMutation.isPending}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <MainLayout title="Companies" subtitle="Manage waste generator companies">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Companies" subtitle="Manage waste generator companies">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load companies</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Companies" subtitle="Manage waste generator companies">
      {/* Actions Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Real-time Filters Bar with Labels */}
        {/* Search Bar */}
        <div className="flex-1 p-4 rounded-xl bg-secondary/30 border border-primary/10 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or GST..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="input-field pl-9 w-full text-xs h-9 bg-background"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const toastId = toast.loading('Exporting companies...');
                const { companies: allCompanies } = await companiesService.getCompanies({
                  limit: 10000,
                  search: debouncedSearchTerm || undefined,
                });

                exportToCSV(
                  allCompanies,
                  [
                    { key: 'name', header: 'Company Name' },
                    { key: 'gstNumber', header: 'GST Number' },
                    { key: 'address', header: 'Address' },
                    { key: 'city', header: 'City' },
                    { key: 'contact', header: 'Contact' },
                    { key: 'email', header: 'Email' },
                    { key: 'createdAt', header: 'Created At' },
                    ...(user?.role === 'admin' ? [
                      { key: 'totalInvoiced', header: 'Total Invoiced' },
                      { key: 'totalPaid', header: 'Total Paid' },
                      { key: 'totalPending', header: 'Total Pending' },
                    ] : []),
                  ],
                  `companies-${new Date().toISOString().slice(0, 10)}.csv`,
                  {
                    createdAt: (value: any) => {
                      if (!value) return '';
                      try {
                        return format(new Date(String(value)), 'dd/MM/yyyy');
                      } catch (e) {
                        return String(value);
                      }
                    },
                  }
                );
                toast.dismiss(toastId);
                toast.success('Companies exported successfully');
              } catch (error) {
                toast.error('Failed to export companies');
                console.error(error);
              }
            }}
            className="btn-secondary flex-none justify-center px-4 gap-2"
          >
            <Download className="w-4 h-4" /> <span className="hidden md:inline">Export CSV</span>
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex-none justify-center px-4">
            <Plus className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Add Company</span>
          </button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Companies</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{pagination.total}</p>
        </div>
        {user?.role === 'admin' && (
          <>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              <p className="text-xl md:text-2xl font-bold text-foreground mt-1">
                ₹{totalInvoiced.toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-xl md:text-2xl font-bold text-success mt-1">
                ₹{totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-xl md:text-2xl font-bold text-destructive mt-1">
                ₹{totalPending.toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={companies}
        keyExtractor={(company) => company.id}
        emptyMessage="No companies found"
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        isLoading={isFetching}
      />

      {/* Add/Edit Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Edit Company" : "Add New Company"}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                className="input-field w-full"
                placeholder="Enter company name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                className="input-field w-full"
                placeholder="Enter 15-digit GST number"
                value={formData.gstNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
            <textarea
              name="address"
              className="input-field w-full min-h-[80px]"
              placeholder="Enter full address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                City
              </label>
              <input
                type="text"
                name="city"
                className="input-field w-full"
                placeholder="Enter city name"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Contact Number
              </label>
              <input
                type="tel"
                name="contact"
                className="input-field w-full"
                placeholder="9876543210"
                value={formData.contact}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              className="input-field w-full"
              placeholder="company@example.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>



          {user?.role === 'admin' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-foreground">
                  Materials & Rates *
                </label>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  + Add Material
                </button>
              </div>
              <div className="space-y-4">
                {formData.materials.map((materialItem, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-end p-3 rounded-lg bg-secondary/20 sm:bg-transparent sm:p-0">
                    <div className="w-full sm:flex-1">
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Material {index + 1}
                      </label>
                      <input
                        type="text"
                        className="input-field w-full"
                        placeholder="Enter material type"
                        value={materialItem.material}
                        onChange={(e) => handleMaterialChange(index, 'material', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <div className="flex-1 sm:w-24">
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Unit
                        </label>
                        <select
                          className="input-field w-full"
                          value={materialItem.unit}
                          onChange={(e) => handleMaterialChange(index, 'unit', e.target.value as "MT" | "Kg" | "KL")}
                          required
                        >
                          <option value="Kg">Kg</option>
                          <option value="MT">MT</option>
                          <option value="KL">KL</option>
                        </select>
                      </div>
                      <div className="flex-1 sm:w-32">
                        <label className="block text-xs font-medium text-foreground mb-1">
                          Rate (₹/{materialItem.unit})
                        </label>
                        <input
                          type="number"
                          className="input-field w-full"
                          placeholder="0.00"
                          value={materialItem.rate}
                          onChange={(e) => handleMaterialChange(index, 'rate', e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      {formData.materials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="text-red-500 hover:text-red-700 p-2 self-end sm:self-auto"
                          title="Remove material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingId ? 'Update Company' : 'Add Company'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Company Details Modal */}
      <Modal
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        title={selectedCompany?.name || ""}
        size="xl"
      >
        {selectedCompany && (
          <CompanyDetails id={selectedCompany.id} />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Company"
        description="Are you sure you want to delete this company? This will also delete all associated materials. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </MainLayout >
  );
}

function CompanyDetails({ id }: { id: string }) {
  const { user } = useAuth();
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => companiesService.getCompanyById(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="space-y-6">
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Total Invoiced</p>
            <p className="text-xl font-bold text-foreground mt-1">
              ₹{(company.totalInvoiced || 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-xl font-bold text-success mt-1">
              ₹{(company.totalPaid || 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Pending Amount</p>
            <p className="text-xl font-bold text-destructive mt-1">
              ₹{(company.totalPending || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Company Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">GST Number</p>
              <p className="text-foreground font-medium">{company.gstNumber || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Contact</p>
              <p className="text-foreground font-medium">{company.contact || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Address</p>
              <p className="text-foreground font-medium">{company.address || '-'}</p>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Materials & Rates</h4>
            <div className="space-y-2">
              {company.materials && company.materials.length > 0 ? (
                company.materials.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <span className="font-medium text-foreground">{item.materialName}</span>
                    <span className="text-primary font-semibold">₹{Number(item.rate).toFixed(2)}/{item.unit}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No materials added</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice History */}
      {/* Invoice History */}
      {user?.role === 'admin' && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Invoice History</h4>
          <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Invoice No.</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Received</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {company.invoices && company.invoices.length > 0 ? (
                  company.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(new Date(inv.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{inv.invoiceNo}</td>
                      <td className="px-4 py-3 text-right">₹{Number(inv.grandTotal).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-success">
                        ₹{Number(inv.paymentReceived).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={inv.status as any} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                      No invoice history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
