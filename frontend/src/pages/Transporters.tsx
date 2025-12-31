import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { isValidEmail, isValidPhone, isValidGST, formatPhoneNumber, formatGSTNumber } from "@/utils/validation";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Plus, Search, Filter, Truck, Eye, Trash2, Loader2, Edit } from "lucide-react";
import transportersService, { Transporter, CreateTransporterData, UpdateTransporterData } from "@/services/transporters.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

import { useAuth } from "@/contexts/AuthContext";

export default function Transporters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null);
  const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formData, setFormData] = useState({
    transporterId: "",
    name: "",
    contact: "",
    address: "",
    email: "",
    gstNumber: "",
  });

  // Fetch transporters (use debounced search term with pagination)
  const { data, isLoading, error } = useQuery({
    queryKey: ['transporters', debouncedSearchTerm, currentPage, pageSize],
    queryFn: () => transportersService.getTransporters({
      search: debouncedSearchTerm || undefined,
      page: currentPage,
      limit: pageSize,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: keepPreviousData,
  });

  // Create transporter mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTransporterData) => transportersService.createTransporter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporters'] });
      toast.success('Transporter created successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create transporter');
    },
  });

  // Update transporter mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransporterData }) => transportersService.updateTransporter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporters'] });
      toast.success('Transporter updated successfully');
      handleCloseModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update transporter');
    },
  });

  // Delete transporter mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => transportersService.deleteTransporter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporters'] });
      toast.success('Transporter deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete transporter');
    },
  });

  const transporters = data?.transporters || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.transporterId.trim() || !formData.name.trim()) {
      toast.error("Transporter ID and name are required");
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

    if (editingTransporter) {
      const updateData: UpdateTransporterData = {
        name: formData.name.trim(),
        contact: formData.contact.trim() ? formatPhoneNumber(formData.contact.trim()) : undefined,
        address: formData.address.trim() || undefined,
        email: formData.email.trim() || undefined,
        gstNumber: formData.gstNumber.trim() ? formatGSTNumber(formData.gstNumber.trim()) : undefined,
      };
      // Only include transporterId if it changed (though usually ID shouldn't change, let's assume it can't or handled by backend)
      if (formData.transporterId.trim() !== editingTransporter.transporterId) {
        updateData.transporterId = formData.transporterId.trim();
      }

      updateMutation.mutate({ id: editingTransporter.id, data: updateData });
    } else {
      const transporterData: CreateTransporterData = {
        transporterId: formData.transporterId.trim(),
        name: formData.name.trim(),
        contact: formData.contact.trim() ? formatPhoneNumber(formData.contact.trim()) : undefined,
        address: formData.address.trim() || undefined,
        email: formData.email.trim() || undefined,
        gstNumber: formData.gstNumber.trim() ? formatGSTNumber(formData.gstNumber.trim()) : undefined,
      };

      createMutation.mutate(transporterData);
    }
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
    setEditingTransporter(null);
    setFormData({
      transporterId: "",
      name: "",
      contact: "",
      address: "",
      email: "",
      gstNumber: "",
    });
  };


  // Calculate summary stats
  const totalInvoiced = transporters.reduce((sum, t) => sum + (t.totalInvoiced || 0), 0);
  const totalPaid = transporters.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalPending = transporters.reduce((sum, t) => sum + (t.totalPending || 0), 0);

  const columns = [
    {
      key: "name",
      header: "Transporter Name",
      render: (transporter: Transporter) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-medium text-foreground">{transporter.name}</p>
            <p className="text-xs text-muted-foreground">{transporter.vehicleCount || 0} vehicles</p>
          </div>
        </div>
      ),
    },
    { key: "transporterId", header: "Transporter ID" },
    { key: "contact", header: "Contact", render: (t: Transporter) => t.contact || '-' },
    { key: "address", header: "Address", render: (t: Transporter) => t.address || '-' },
    {
      key: "gstNumber",
      header: "GST Number",
      render: (transporter: Transporter) => transporter.gstNumber || "—",
    },
    ...(user?.role === 'admin' ? [
      {
        key: "totalInvoiced",
        header: "Total Invoiced",
        render: (transporter: Transporter) => `₹${(transporter.totalInvoiced || 0).toLocaleString()}`,
      },
      {
        key: "totalPaid",
        header: "Paid Amount",
        render: (transporter: Transporter) => (
          <span className="text-success">₹{(transporter.totalPaid || 0).toLocaleString()}</span>
        ),
      },
      {
        key: "totalPending",
        header: "Balance",
        render: (transporter: Transporter) => {
          const pending = transporter.totalPending || 0;
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
        render: (transporter: Transporter) => {
          const pending = transporter.totalPending || 0;
          const paid = transporter.totalPaid || 0;
          const status = pending === 0 ? "paid" : paid > 0 ? "partial" : "pending";
          return <StatusBadge status={status} />;
        },
      },
    ] : []),
    {
      key: "actions",
      header: "Actions",
      render: (transporter: Transporter) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTransporter(transporter)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingTransporter(transporter);
              setFormData({
                transporterId: transporter.transporterId,
                name: transporter.name,
                contact: transporter.contact || "",
                address: transporter.address || "",
                email: transporter.email || "",
                gstNumber: transporter.gstNumber || "",
              });
              setIsModalOpen(true);
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(transporter.id)}
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
      <MainLayout title="Transporters" subtitle="Manage waste transporters">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Transporters" subtitle="Manage waste transporters">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load transporters</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Transporters" subtitle="Manage waste transporters">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transporters by name or ID..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        <button className="btn-secondary">
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Transporter
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Transporters</p>
          <p className="text-2xl font-bold text-foreground mt-1">{pagination.total}</p>
        </div>
        {user?.role === 'admin' && (
          <>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ₹{totalInvoiced.toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-success mt-1">
                ₹{totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold text-destructive mt-1">
                ₹{totalPending.toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={transporters}
        keyExtractor={(transporter) => transporter.id}
        emptyMessage="No transporters found"
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Add Transporter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTransporter ? "Edit Transporter" : "Add New Transporter"}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Transporter ID *
              </label>
              <input
                type="text"
                name="transporterId"
                className="input-field w-full"
                placeholder="TRP-001"
                value={formData.transporterId}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Transporter Name *
              </label>
              <input
                type="text"
                name="name"
                className="input-field w-full"
                placeholder="Enter transporter name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
            <textarea
              name="address"
              className="input-field w-full min-h-[80px]"
              placeholder="Enter address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="input-field w-full"
                placeholder="transporter@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              GST Number
            </label>
            <input
              type="text"
              name="gstNumber"
              className="input-field w-full"
              placeholder="27AABCU9603R1ZM"
              value={formData.gstNumber}
              onChange={handleInputChange}
            />
          </div>

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
                  {editingTransporter ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingTransporter ? 'Update Transporter' : 'Add Transporter'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transporter Details Modal */}
      <Modal
        isOpen={!!selectedTransporter}
        onClose={() => setSelectedTransporter(null)}
        title={selectedTransporter?.name || ""}
        size="xl"
      >
        {selectedTransporter && (
          <TransporterDetails id={selectedTransporter.id} />
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Transporter"
        description="Are you sure you want to delete this transporter? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </MainLayout>
  );
}

function TransporterDetails({ id }: { id: string }) {
  const { user } = useAuth();
  const { data: transporter, isLoading } = useQuery({
    queryKey: ['transporter', id],
    queryFn: () => transportersService.getTransporterById(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!transporter) return null;

  return (
    <div className="space-y-6">
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Total Invoiced</p>
            <p className="text-xl font-bold text-foreground mt-1">
              ₹{(transporter.totalInvoiced || 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-xl font-bold text-success mt-1">
              ₹{(transporter.totalPaid || 0).toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Pending Amount</p>
            <p className="text-xl font-bold text-destructive mt-1">
              ₹{(transporter.totalPending || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Inward Transport History</h3>
          <DataTable
            columns={[
              { key: "date", header: "Date", render: (m: any) => m.date ? format(new Date(m.date), 'dd MMM yyyy') : '-' },
              { key: "month", header: "Month", render: (m: any) => m.month || m.inwardEntry?.month || '-' },
              { key: "manifestNo", header: "Manifest No.", render: (m: any) => m.manifestNo || '-' },
              { key: "wasteName", header: "Waste Name", render: (m: any) => m.wasteName || '-' },
              { key: "quantity", header: "Quantity", render: (m: any) => m.quantity ? `${m.quantity} ${m.unit || ''}` : '-' },
              ...(user?.role === 'admin' ? [
                { key: "invoiceNo", header: "Invoice No.", render: (m: any) => m.invoiceNo || '-' },
                { key: "rate", header: "Rate", render: (m: any) => m.rate ? `₹${Number(m.rate).toFixed(2)}` : '-' },
                { key: "grossAmount", header: "Gross Amount", render: (m: any) => m.grossAmount ? `₹${Number(m.grossAmount).toFixed(2)}` : '-' },
                { key: "paidOn", header: "Paid On", render: (m: any) => m.paidOn ? format(new Date(m.paidOn), 'dd MMM yyyy') : <span className="text-destructive font-medium">Pending</span> },
              ] : []),
            ]}
            data={transporter.inwardHistory || []}
            keyExtractor={(m) => m.id}
            emptyMessage="No inward transport records found"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Outward Transport History</h3>
          <DataTable
            columns={[
              { key: "date", header: "Date", render: (m: any) => m.date ? format(new Date(m.date), 'dd MMM yyyy') : '-' },
              { key: "month", header: "Month", render: (m: any) => m.month || m.outwardEntry?.month || '-' },
              { key: "manifestNo", header: "Manifest No.", render: (m: any) => m.manifestNo || '-' },
              { key: "wasteName", header: "Waste Name", render: (m: any) => m.wasteName || '-' },
              ...(user?.role === 'admin' ? [
                { key: "invoiceNo", header: "Invoice No.", render: (m: any) => m.invoiceNo || '-' },
                { key: "grossAmount", header: "Gross Amount", render: (m: any) => m.grossAmount ? `₹${Number(m.grossAmount).toFixed(2)}` : '-' },
                { key: "paidOn", header: "Paid On", render: (m: any) => m.paidOn ? format(new Date(m.paidOn), 'dd MMM yyyy') : <span className="text-destructive font-medium">Pending</span> },
              ] : []),
            ]}
            data={transporter.outwardHistory || []}
            keyExtractor={(m) => m.id}
            emptyMessage="No outward transport records found"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground mb-3">Transporter Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Transporter ID</p>
            <p className="text-foreground font-medium">{transporter.transporterId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contact</p>
            <p className="text-foreground font-medium">{transporter.contact || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="text-foreground font-medium">{transporter.email || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">GST Number</p>
            <p className="text-foreground font-medium">{transporter.gstNumber || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Address</p>
            <p className="text-foreground font-medium">{transporter.address || '-'}</p>
          </div>
        </div>
      </div>

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
                  <th className="px-4 py-3 font-semibold text-right">Paid/Received</th>
                  <th className="px-4 py-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(() => {
                  const combinedInvoices = [
                    ...(transporter.invoices || []).map(inv => ({
                      id: inv.id,
                      date: inv.date,
                      invoiceNo: inv.invoiceNo,
                      amount: inv.grandTotal,
                      paid: inv.paymentReceived,
                      status: inv.status
                    })),
                    ...(transporter.inwardHistory || [])
                      .filter(m => m.invoiceNo)
                      .map(m => ({
                        id: m.id,
                        date: m.date,
                        invoiceNo: m.invoiceNo,
                        amount: m.grossAmount,
                        paid: m.paidOn ? m.grossAmount : 0,
                        status: m.paidOn ? 'paid' : 'pending'
                      })),
                    ...(transporter.outwardHistory || [])
                      .filter(m => m.invoiceNo)
                      .map(m => ({
                        id: m.id,
                        date: m.date,
                        invoiceNo: m.invoiceNo,
                        amount: m.grossAmount,
                        paid: m.paidOn ? m.grossAmount : 0,
                        status: m.paidOn ? 'paid' : 'pending'
                      }))
                  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  return combinedInvoices.length > 0 ? (
                    combinedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{inv.invoiceNo}</td>
                        <td className="px-4 py-3 text-right">₹{Number(inv.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-success">
                          ₹{Number(inv.paid || 0).toLocaleString()}
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
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
