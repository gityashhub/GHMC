import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Plus, Search, Filter, Eye, Trash2, Loader2, Edit, FileText, Download, Building2, Calendar, Truck, ChevronDown } from "lucide-react";
import outwardService, { OutwardEntry, CreateOutwardEntryData, UpdateOutwardEntryData } from "@/services/outward.service";
import transportersService from "@/services/transporters.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CreateInvoiceModal from "@/components/common/CreateInvoiceModal";
import OutwardMaterialForm from "@/components/common/OutwardMaterialForm";
import outwardMaterialsService from "@/services/outwardMaterials.service";
import { OutwardMaterial } from "@/services/outward.service";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { isNotFutureDate, isValidManifestNumber, isPositiveNumber, isNonNegativeNumber } from "@/utils/validation";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/utils/export";

import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Outward() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedEntry, setSelectedEntry] = useState<OutwardEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<OutwardEntry | null>(null);

  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<OutwardMaterial | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null; type: 'entry' | 'material' }>({
    isOpen: false,
    id: null,
    type: 'entry',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);



  // Fetch transporters for form (cache for longer)
  const { data: transportersData } = useQuery({
    queryKey: ['transporters'],
    queryFn: () => transportersService.getTransporters({ limit: 100 }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch outward entries (use debounced search term with pagination)
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['outward', debouncedSearchTerm, currentPage, pageSize],
    queryFn: () => outwardService.getEntries({
      search: debouncedSearchTerm || undefined,
      page: currentPage,
      limit: pageSize,
    }),
    staleTime: 0, // Always fetch fresh data when filters change
  });



  // Fetch statistics (cache for longer)
  const { data: statsData } = useQuery({
    queryKey: ['outward-stats'],
    queryFn: () => outwardService.getStats(),
    staleTime: 0, // Always fetch fresh stats
    refetchInterval: 10000,
  });

  // Fetch outward materials
  const { data: materialsData } = useQuery({
    queryKey: ['outward-materials'],
    queryFn: () => outwardMaterialsService.getMaterials({ limit: 100 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateOutwardEntryData) => outwardService.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outward'] });
      queryClient.invalidateQueries({ queryKey: ['outward-summary'] });
      queryClient.invalidateQueries({ queryKey: ['outward-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-waste-flow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Outward entry created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create entry');
    },
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOutwardEntryData }) => outwardService.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outward'] });
      queryClient.invalidateQueries({ queryKey: ['outward-summary'] });
      queryClient.invalidateQueries({ queryKey: ['outward-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-waste-flow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Entry updated successfully');
      setIsEditModalOpen(false);
      setEditingEntry(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update entry');
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => outwardService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outward'] });
      queryClient.invalidateQueries({ queryKey: ['outward-summary'] });
      queryClient.invalidateQueries({ queryKey: ['outward-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-waste-flow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Entry deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete entry');
    },

  });

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: (data: any) => outwardMaterialsService.createMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outward-materials'] });
      toast.success('Outward material record created successfully');
      setIsMaterialModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create material record');
    },
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => outwardMaterialsService.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outward-materials'] });
      toast.success('Outward material record updated successfully');
      setIsMaterialModalOpen(false);
      setEditingMaterial(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update material record');
    },
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: (id: string) => outwardMaterialsService.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outward-materials'] });
      toast.success('Material record deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete material record');
    },
  });

  const entries = data?.entries || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };
  const transporters = transportersData?.transporters || [];
  const stats = statsData || { totalDispatches: 0, totalQuantity: 0, totalInvoiced: 0, totalReceived: 0 };
  const materials = materialsData?.materials || [];


  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, id, type: 'entry' });
  }, []);

  const handleDeleteMaterial = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, id, type: 'material' });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm.id) return;

    if (deleteConfirm.type === 'entry') {
      deleteMutation.mutate(deleteConfirm.id);
    } else {
      deleteMaterialMutation.mutate(deleteConfirm.id);
    }

    setDeleteConfirm({ isOpen: false, id: null, type: 'entry' });
  }, [deleteConfirm, deleteMutation, deleteMaterialMutation]);

  const handleCreateEntry = useCallback(async (formData: any) => {
    const entryData: CreateOutwardEntryData = {
      date: formData.date,
      cementCompany: formData.cementCompany,
      manifestNo: formData.manifestNo,
      transporterId: formData.transporterId || undefined,
      vehicleNo: formData.vehicleNo || undefined,
      wasteName: formData.wasteName || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      month: formData.month || undefined,
      location: formData.location || undefined,
      packing: formData.packing || undefined,
      rate: formData.rate ? parseFloat(formData.rate) : undefined,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      gst: formData.gst ? parseFloat(formData.gst) : undefined,
      grossAmount: formData.grossAmount ? parseFloat(formData.grossAmount) : undefined,
      vehicleCapacity: formData.vehicleCapacity || undefined,
      detCharges: formData.detCharges ? parseFloat(formData.detCharges) : undefined,
      paidOn: formData.paidOn || undefined,
      dueOn: formData.dueOn || undefined,
      invoiceNo: formData.invoiceNo || undefined,
    };

    createMutation.mutate(entryData);
  }, [createMutation]);

  const handleUpdateEntry = useCallback(async (formData: any) => {
    if (!editingEntry) return;

    const entryData: UpdateOutwardEntryData = {
      date: formData.date,
      cementCompany: formData.cementCompany,
      manifestNo: formData.manifestNo,
      transporterId: formData.transporterId || undefined,
      vehicleNo: formData.vehicleNo || undefined,
      wasteName: formData.wasteName || undefined,
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
      unit: formData.unit,
      month: formData.month || undefined,
      location: formData.location || undefined,
      packing: formData.packing || undefined,
      rate: formData.rate ? parseFloat(formData.rate) : undefined,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      gst: formData.gst ? parseFloat(formData.gst) : undefined,
      grossAmount: formData.grossAmount ? parseFloat(formData.grossAmount) : undefined,
      vehicleCapacity: formData.vehicleCapacity || undefined,
      detCharges: formData.detCharges ? parseFloat(formData.detCharges) : undefined,
      paidOn: formData.paidOn || undefined,
      dueOn: formData.dueOn || undefined,
      invoiceNo: formData.invoiceNo || undefined,
    };

    updateMutation.mutate({ id: editingEntry.id, data: entryData });
  }, [updateMutation, editingEntry]);



  const columns = [
    { key: "srNo", header: "Sr No.", render: (e: OutwardEntry) => e.srNo || '-' },
    { key: "month", header: "Month", render: (e: OutwardEntry) => e.month || '-' },
    { key: "date", header: "Date", render: (e: OutwardEntry) => format(new Date(e.date), 'dd MMM yyyy') },
    {
      key: "cementCompany",
      header: "Cement Company",
      render: (e: OutwardEntry) => <span className="font-medium text-foreground">{e.cementCompany}</span>,
    },
    {
      key: "transporter",
      header: "Transporter",
      render: (e: OutwardEntry) => <span className="text-sm text-muted-foreground">{e.transporter?.name || '-'}</span>,
    },
    { key: "location", header: "Location", render: (e: OutwardEntry) => e.location || '-' },
    { key: "manifestNo", header: "Manifest No." },
    { key: "vehicleNo", header: "Vehicle No.", render: (e: OutwardEntry) => e.vehicleNo || '-' },
    { key: "wasteName", header: "Waste Name", render: (e: OutwardEntry) => e.wasteName || '-' },
    { key: "quantity", header: "Quantity", render: (e: OutwardEntry) => `${e.quantity} ${e.unit}` },
    { key: "vehicleCapacity", header: "Vehicle Capacity", render: (e: OutwardEntry) => e.vehicleCapacity || '-' },
    ...(user?.role === 'admin' ? [
      { key: "rate", header: "Rate", render: (e: OutwardEntry) => e.rate ? `₹${Number(e.rate).toFixed(2)}` : '-' },
      { key: "amount", header: "Amount", render: (e: OutwardEntry) => e.amount ? `₹${Number(e.amount).toFixed(2)}` : '-' },
      { key: "gst", header: "GST", render: (e: OutwardEntry) => e.gst ? `₹${Number(e.gst).toFixed(2)}` : '-' },
      { key: "grossAmount", header: "Gross Amount", render: (e: OutwardEntry) => e.invoice?.grandTotal ? `₹${Number(e.invoice.grandTotal).toLocaleString()}` : e.grossAmount ? `₹${Number(e.grossAmount).toLocaleString()}` : "-" },
    ] : []),
    { key: "packing", header: "Packing", render: (e: OutwardEntry) => e.packing || '-' },
    ...(user?.role === 'admin' ? [
      { key: "invoiceNo", header: "Invoice No.", render: (e: OutwardEntry) => e.invoice?.invoiceNo || "-" },
    ] : []),
    ...(user?.role === 'admin' ? [
      { key: "dueOn", header: "Due On", render: (e: OutwardEntry) => e.dueOn ? format(new Date(e.dueOn), 'dd MMM yyyy') : "-" },
      { key: "paidOn", header: "Paid On", render: (e: OutwardEntry) => e.paidOn ? format(new Date(e.paidOn), 'dd MMM yyyy') : "-" },
    ] : []),
    {
      key: "actions",
      header: "Actions",
      render: (e: OutwardEntry) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedEntry(e)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingEntry(e);
              setIsEditModalOpen(true);
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit Entry"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleDelete(e.id)}
            disabled={deleteMutation.isPending}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];



  if (isLoading) {
    return (
      <MainLayout title="Outward Management" subtitle="Manage waste dispatch to clients">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Outward Management" subtitle="Manage waste dispatch to clients">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load entries</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Outward Management" subtitle="Manage waste dispatch to clients">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search truck, manifest, or site..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {searchTerm && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-primary transition-colors pr-2 border-r border-border"
              >
                Clear Search
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="btn-secondary flex-none justify-center px-4 gap-2">
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">Export CSV</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={async () => {
                  try {
                    const toastId = toast.loading('Exporting entries...');
                    const { entries: allEntries } = await outwardService.getEntries({
                      limit: 10000,
                      search: debouncedSearchTerm || undefined,
                    });

                    exportToCSV(
                      allEntries,
                      [
                        { key: 'computedSrNo', header: 'Sr No.' },
                        { key: 'computedMonth', header: 'Month' },
                        { key: 'date', header: 'Date' },
                        { key: 'cementCompany', header: 'Cement Company' },
                        { key: 'transporter', header: 'Transporter' },
                        { key: 'location', header: 'Location' },
                        { key: 'manifestNo', header: 'Manifest No.' },
                        { key: 'vehicleNo', header: 'Vehicle No.' },
                        { key: 'wasteName', header: 'Waste Name' },
                        { key: 'quantity', header: 'Quantity' },
                        { key: 'vehicleCapacity', header: 'Vehicle Capacity' },
                        { key: 'rate', header: 'Rate' },
                        { key: 'calculatedAmount', header: 'Amount' },
                        { key: 'gst', header: 'GST' },
                        { key: 'computedGrossAmount', header: 'Gross Amount' },
                        { key: 'packing', header: 'Packing' },
                        { key: 'invoiceNo', header: 'Invoice No.' },
                        { key: 'dueOn', header: 'Due On' },
                        { key: 'paidOn', header: 'Paid On' },
                      ],
                      `outward-entries-${new Date().toISOString().slice(0, 10)}.csv`,
                      {
                        computedSrNo: (_: any, item: any) => String(allEntries.indexOf(item) + 1),
                        computedMonth: (value: any, item: any) => {
                          if (item.month) return item.month;
                          if (item.date) {
                            try {
                              return format(new Date(item.date), 'MMMM');
                            } catch (e) {
                              return '';
                            }
                          }
                          return '';
                        },
                        date: (value: any) => {
                          if (!value) return '';
                          try {
                            return format(new Date(value), 'dd/MM/yyyy');
                          } catch (e) {
                            return String(value);
                          }
                        },
                        transporter: (value: any) => value?.name || '',
                        quantity: (value: any, item: any) => `${value || 0} ${item.unit || ''}`,
                        rate: (value: any) => formatCurrencyForExport(value),
                        calculatedAmount: (_: any, item: any) => {
                          const rate = Number(item.rate) || 0;
                          const qty = Number(item.quantity) || 0;
                          return formatCurrencyForExport(rate * qty);
                        },
                        gst: (value: any) => formatCurrencyForExport(value),
                        computedGrossAmount: (_: any, item: any) => {
                          // If invoice exists, it typically represents the final amount
                          if (item.invoice?.grandTotal) return formatCurrencyForExport(item.invoice.grandTotal);
                          // Fallback to locally stored grossAmount or calculate it
                          const amt = Number(item.amount) || (Number(item.rate) * Number(item.quantity)) || 0;
                          const gst = Number(item.gst) || 0;
                          const det = Number(item.detCharges) || 0;
                          return formatCurrencyForExport(amt + gst + det);
                        },
                        invoiceNo: (_: any, item: any) => item.invoice?.invoiceNo || '',
                        dueOn: (value: any) => {
                          if (!value) return '';
                          try {
                            return format(new Date(value), 'dd/MM/yyyy');
                          } catch (e) {
                            return String(value);
                          }
                        },
                        paidOn: (value: any) => {
                          if (!value) return '';
                          try {
                            return format(new Date(value), 'dd/MM/yyyy');
                          } catch (e) {
                            return String(value);
                          }
                        },
                      }
                    );
                    toast.dismiss(toastId);
                    toast.success('Outward entries exported successfully');
                  } catch (error) {
                    toast.error('Failed to export entries');
                    console.error(error);
                  }
                }}>
                  Export Entry Records
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  try {
                    const toastId = toast.loading('Exporting material records...');
                    const { materials: allMaterials } = await outwardMaterialsService.getMaterials({
                      limit: 10000,
                    });

                    exportToCSV(
                      allMaterials,
                      [
                        { key: 'date', header: 'Date' },
                        { key: 'month', header: 'Month' },
                        { key: 'cementCompany', header: 'Cement Company' },
                        { key: 'manifestNo', header: 'Manifest No.' },
                        { key: 'transporterName', header: 'Transporter' },
                        { key: 'vehicleNo', header: 'Vehicle No.' },
                        { key: 'wasteName', header: 'Waste Name' },
                        { key: 'quantity', header: 'Quantity' },
                        { key: 'unit', header: 'Unit' },
                        ...(user?.role === 'admin' ? [
                          { key: 'rate', header: 'Rate' },
                          { key: 'amount', header: 'Amount' },
                          { key: 'detCharges', header: 'Det Charges' },
                          { key: 'gst', header: 'GST' },
                          { key: 'grossAmount', header: 'Gross Amount' },
                        ] : []),
                        { key: 'invoiceNo', header: 'Invoice No.' },
                      ],
                      `outward-materials-${new Date().toISOString().slice(0, 10)}.csv`,
                      {
                        date: (value: any) => {
                          if (!value) return '';
                          try {
                            return format(new Date(value), 'dd/MM/yyyy');
                          } catch (e) {
                            return String(value);
                          }
                        },
                        month: (value: any, item: any) => {
                          if (value) return value;
                          if (item.date) {
                            try {
                              return format(new Date(item.date), 'MMMM');
                            } catch (e) {
                              return '';
                            }
                          }
                          return '';
                        },
                        rate: (value: any) => formatCurrencyForExport(value),
                        amount: (value: any) => formatCurrencyForExport(value),
                        detCharges: (value: any) => formatCurrencyForExport(value),
                        gst: (value: any) => formatCurrencyForExport(value),
                        grossAmount: (value: any) => formatCurrencyForExport(value),
                        paidOn: (value: any) => {
                          if (!value) return '';
                          try {
                            return format(new Date(value), 'dd/MM/yyyy');
                          } catch (e) {
                            return String(value);
                          }
                        },
                      }
                    );
                    toast.dismiss(toastId);
                    toast.success('Material records exported successfully');
                  } catch (error) {
                    toast.error('Failed to export materials');
                    console.error(error);
                  }
                }}>
                  Export Material Records
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary flex-none justify-center px-4">
              <Plus className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Create Outward Entry</span>
            </button>
          </div>
        </div>

      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Dispatches</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{stats.totalDispatches}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Quantity</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{stats.totalQuantity.toFixed(1)}</p>
        </div>
        {user?.role === 'admin' && (
          <>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              <p className="text-xl md:text-2xl font-bold text-foreground mt-1">₹{stats.totalInvoiced.toLocaleString()}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Payment Received</p>
              <p className="text-xl md:text-2xl font-bold text-success mt-1">₹{stats.totalReceived.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      <h3 className="text-lg font-medium mb-2">Outward Entries</h3>
      <DataTable
        columns={columns}
        data={entries}
        keyExtractor={(entry) => entry.id}
        emptyMessage="No outward entries found"
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        isLoading={isFetching}
      />

      {/* Outward Materials Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Outward Transporter Records</h2>
            <p className="text-sm text-muted-foreground">Manage transporter invoices and payments for outward/dispatch</p>
          </div>
          <Button onClick={() => {
            setEditingMaterial(null);
            setIsMaterialModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" /> Add Material Record
          </Button>
        </div>

        <DataTable
          columns={[
            { key: "date", header: "Date", render: (m: OutwardMaterial) => m.date ? format(new Date(m.date), 'dd MMM yyyy') : '-' },
            { key: "month", header: "Month", render: (m: OutwardMaterial) => m.month || m.outwardEntry?.month || '-' },
            { key: "transporterName", header: "Transporter" },
            { key: "manifestNo", header: "Manifest No.", render: (m: OutwardMaterial) => m.manifestNo || '-' },
            { key: "vehicleNo", header: "Vehicle No.", render: (m: OutwardMaterial) => m.vehicleNo || '-' },
            { key: "wasteName", header: "Waste Name", render: (m: OutwardMaterial) => m.wasteName || '-' },
            { key: "quantity", header: "Quantity", render: (m: OutwardMaterial) => m.quantity ? `${m.quantity} ${m.unit || ''}` : '-' },
            ...(user?.role === 'admin' ? [
              { key: "rate", header: "Rate", render: (m: OutwardMaterial) => m.rate ? `₹${Number(m.rate).toFixed(2)}` : '-' },
              { key: "amount", header: "Amount", render: (m: OutwardMaterial) => m.amount ? `₹${Number(m.amount).toFixed(2)}` : '-' },
              { key: "detCharges", header: "Det. Charges", render: (m: OutwardMaterial) => m.detCharges ? `₹${Number(m.detCharges).toFixed(2)}` : '-' },
              { key: "gst", header: "GST", render: (m: OutwardMaterial) => m.gst ? `₹${Number(m.gst).toFixed(2)}` : '-' },
              { key: "grossAmount", header: "Gross Amount", render: (m: OutwardMaterial) => m.grossAmount ? `₹${Number(m.grossAmount).toFixed(2)}` : '-' },
              { key: "invoiceNo", header: "Invoice No.", render: (m: OutwardMaterial) => m.invoiceNo || '-' },
              { key: "paidOn", header: "Paid On", render: (m: OutwardMaterial) => m.paidOn ? format(new Date(m.paidOn), 'dd MMM yyyy') : '-' },
            ] : []),
            {
              key: "actions",
              header: "Actions",
              render: (m: OutwardMaterial) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingMaterial(m);
                      setIsMaterialModalOpen(true);
                    }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    disabled={deleteMaterialMutation.isPending}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ),
            },
          ]}
          data={materials}
          keyExtractor={(material) => material.id}
          emptyMessage="No outward material records found"
        />
      </div>

      {/* Create Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Outward Entry" size="lg">
        <OutwardEntryForm
          transporters={transporters}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleCreateEntry}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Entry Details Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={`Outward Entry - ${selectedEntry?.manifestNo}`}
        size="xl"
      >
        {selectedEntry && <OutwardEntryDetails entry={selectedEntry} />}
      </Modal>

      {/* Edit Entry Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingEntry(null); }} title="Edit Outward Entry" size="lg">
        {editingEntry && (
          <OutwardEntryForm
            transporters={transporters}
            entry={editingEntry}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingEntry(null);
            }}
            onSubmit={handleUpdateEntry}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>



      {/* Material Form Modal */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setEditingMaterial(null);
        }}
        title={editingMaterial ? "Edit Material Record" : "New Material Record"}
        size="lg"
      >
        <OutwardMaterialForm
          entry={editingMaterial || undefined}
          outwardEntries={entries}
          onCancel={() => {
            setIsMaterialModalOpen(false);
            setEditingMaterial(null);
          }}
          onSubmit={(data) => {
            if (editingMaterial) {
              updateMaterialMutation.mutate({ id: editingMaterial.id, data });
            } else {
              createMaterialMutation.mutate(data);
            }
          }}
          isLoading={createMaterialMutation.isPending || updateMaterialMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, type: 'entry' })}
        onConfirm={confirmDelete}
        title={deleteConfirm.type === 'entry' ? "Delete Outward Entry" : "Delete Material Record"}
        description={
          deleteConfirm.type === 'entry'
            ? "Are you sure you want to delete this outward entry? This action cannot be undone."
            : "Are you sure you want to delete this material record? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending || deleteMaterialMutation.isPending}
      />
    </MainLayout>
  );
}

// Simple Outward Entry Form Component
function OutwardEntryForm({ transporters, entry, onCancel, onSubmit, isLoading }: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: entry?.date ? format(new Date(entry.date), 'yyyy-MM-dd') : new Date().toISOString().slice(0, 10),
    cementCompany: entry?.cementCompany || "",
    manifestNo: entry?.manifestNo || "",
    transporterId: entry?.transporterId || "",
    vehicleNo: entry?.vehicleNo || "",
    wasteName: entry?.wasteName || "",
    quantity: entry?.quantity ? String(entry.quantity) : "",
    unit: (entry?.unit as "MT" | "Kg" | "KL") || "MT",
    month: entry?.month || "",
    location: entry?.location || "",
    packing: entry?.packing || "",
    rate: entry?.rate ? String(entry.rate) : "",
    amount: entry?.amount ? String(entry.amount) : "",
    gst: entry?.gst ? String(entry.gst) : "",
    grossAmount: entry?.grossAmount ? String(entry.grossAmount) : "",
    vehicleCapacity: entry?.vehicleCapacity || "",
    detCharges: entry?.detCharges ? String(entry.detCharges) : "",
    paidOn: entry?.paidOn ? format(new Date(entry.paidOn), 'yyyy-MM-dd') : "",
    dueOn: entry?.dueOn ? format(new Date(entry.dueOn), 'yyyy-MM-dd') : "",
    invoiceNo: entry?.invoice?.invoiceNo || "",
  });

  useEffect(() => {
    const qty = parseFloat(String(formData.quantity || '')) || 0;
    const rate = parseFloat(String(formData.rate || '')) || 0;
    const computedAmount = qty > 0 && rate > 0 ? qty * rate : undefined;
    if ((computedAmount ?? '') !== (formData.amount || '')) {
      setFormData((prev) => ({ ...prev, amount: computedAmount !== undefined ? String(Number(computedAmount.toFixed(2))) : prev.amount }));
    }
  }, [formData.quantity, formData.rate]);

  useEffect(() => {
    const amount = parseFloat(String(formData.amount || '')) || 0;
    const det = parseFloat(String(formData.detCharges || '')) || 0;
    const gst = parseFloat(String(formData.gst || '')) || 0;
    const gross = amount + det + gst;
    if (String(formData.grossAmount || '') !== String(gross)) {
      setFormData((prev) => ({ ...prev, grossAmount: String(Number(gross.toFixed(2))) }));
    }
  }, [formData.amount, formData.detCharges, formData.gst]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cementCompany || !formData.manifestNo || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate date
    if (!isNotFutureDate(formData.date)) {
      toast.error("Date cannot be in the future");
      return;
    }

    // Validate manifest number
    if (!isValidManifestNumber(formData.manifestNo)) {
      toast.error("Manifest number must be at least 3 characters");
      return;
    }

    // Validate quantity
    if (!isPositiveNumber(formData.quantity)) {
      toast.error("Quantity must be a positive number");
      return;
    }

    // Validate amounts if provided
    if (formData.rate && !isNonNegativeNumber(formData.rate)) {
      toast.error("Rate must be a non-negative number");
      return;
    }
    if (formData.amount && !isNonNegativeNumber(formData.amount)) {
      toast.error("Amount must be a non-negative number");
      return;
    }
    if (formData.gst && !isNonNegativeNumber(formData.gst)) {
      toast.error("GST must be a non-negative number");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
          <input
            type="date"
            className="input-field w-full"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Month</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            placeholder="e.g., January 2024"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Cement Company *</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.cementCompany}
            onChange={(e) => setFormData({ ...formData, cementCompany: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Transporter</label>
          <select
            className="input-field w-full"
            value={formData.transporterId}
            onChange={(e) => setFormData({ ...formData, transporterId: e.target.value })}
          >
            <option value="">Select Transporter</option>
            {transporters.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Manifest No. *</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.manifestNo}
            onChange={(e) => setFormData({ ...formData, manifestNo: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle No.</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.vehicleNo}
            onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user?.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Invoice No.</label>
            <input
              type="text"
              className="input-field w-full"
              value={formData.invoiceNo}
              onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
              placeholder="Enter invoice number (optional)"
            />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Waste Name</label>
          <select
            className="input-field w-full"
            value={formData.wasteName}
            onChange={(e) => setFormData({ ...formData, wasteName: e.target.value })}
          >
            <option value="">Select Waste</option>
            <option value="SOLID">SOLID</option>
            <option value="LIQUID">LIQUID</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Quantity *</label>
          <input
            type="number"
            step="0.01"
            className="input-field w-full"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Unit *</label>
          <select
            className="input-field w-full"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value as "MT" | "Kg" | "KL" })}
            required
          >
            <option value="Kg">Kg</option>
            <option value="MT">MT</option>
            <option value="KL">KL</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Packing</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.packing}
            onChange={(e) => setFormData({ ...formData, packing: e.target.value })}
          />
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Rate</label>
            <input
              type="number"
              step="0.01"
              className="input-field w-full"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
            <input
              type="number"
              step="0.01"
              className="input-field w-full"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">GST</label>
            <input
              type="number"
              step="0.01"
              className="input-field w-full"
              value={formData.gst}
              onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Gross Amount</label>
            <input
              type="number"
              step="0.01"
              className="input-field w-full"
              value={formData.grossAmount}
              onChange={(e) => setFormData({ ...formData, grossAmount: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Vehicle Capacity</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.vehicleCapacity}
            onChange={(e) => setFormData({ ...formData, vehicleCapacity: e.target.value })}
          />
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Due On</label>
            <input
              type="date"
              className="input-field w-full"
              value={formData.dueOn}
              onChange={(e) => setFormData({ ...formData, dueOn: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Paid On</label>
            <input
              type="date"
              className="input-field w-full"
              value={formData.paidOn}
              onChange={(e) => setFormData({ ...formData, paidOn: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Entry'
          )}
        </Button>
      </div>
    </form>
  );
}

// Entry Details Component
function OutwardEntryDetails({ entry }: { entry: OutwardEntry }) {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="font-medium text-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Month</p>
          <p className="font-medium text-foreground">{entry.month || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Manifest No.</p>
          <p className="font-medium text-foreground">{entry.manifestNo}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vehicle No.</p>
          <p className="font-medium text-foreground">{entry.vehicleNo || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Cement Company</p>
          <p className="font-medium text-foreground">{entry.cementCompany}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Location</p>
          <p className="font-medium text-foreground">{entry.location || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Transporter</p>
          <p className="font-medium text-foreground">{entry.transporter?.name || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Waste Name</p>
          <p className="font-medium text-foreground">{entry.wasteName || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Quantity</p>
          <p className="font-medium text-foreground">{entry.quantity} {entry.unit}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Packing</p>
          <p className="font-medium text-foreground">{entry.packing || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Vehicle Capacity</p>
          <p className="font-medium text-foreground">{entry.vehicleCapacity || '-'}</p>
        </div>
      </div>

      {user?.role === 'admin' && entry.invoice && (
        <>
          <hr className="border-border" />
          <h4 className="font-medium text-foreground">Invoice Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice No.</p>
              <p className="font-medium text-foreground">{entry.invoice.invoiceNo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rate</p>
              <p className="font-medium text-foreground">
                {entry.rate ? `₹${Number(entry.rate).toFixed(2)}/${entry.unit}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium text-foreground">
                {entry.amount ? `₹${Number(entry.amount).toLocaleString()}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">GST</p>
              <p className="font-medium text-foreground">
                {entry.gst ? `₹${Number(entry.gst).toLocaleString()}` : '-'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Gross Amount</p>
              <p className="font-medium text-foreground text-lg">
                ₹{Number(entry.invoice.grandTotal).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Received</p>
              <p className="font-medium text-success">
                ₹{Number(entry.invoice.paymentReceived).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid On</p>
              <p className="font-medium text-foreground">
                {entry.paidOn ? format(new Date(entry.paidOn), 'dd MMM yyyy') : '-'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
