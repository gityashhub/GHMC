import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Plus, Search, Filter, FileText, Download, Eye, Trash2, Loader2, Edit, Building2, Calendar, ChevronDown } from "lucide-react";
import inwardService, { InwardEntry, CreateInwardEntryData, UpdateInwardEntryData, InwardMaterial } from "@/services/inward.service";
import companiesService from "@/services/companies.service";
import inwardMaterialsService from "@/services/inwardMaterials.service";
import invoicesService from "@/services/invoices.service";
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CreateInvoiceModal from "@/components/common/CreateInvoiceModal";
import InwardMaterialForm from "@/components/common/InwardMaterialForm";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { isNotFutureDate, isValidManifestNumber, isPositiveNumber, roundToTwoDecimals } from "@/utils/validation";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/utils/export";
import { getErrorMessage, logError } from "@/utils/errorHandler";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Inward() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedEntryForInvoice, setSelectedEntryForInvoice] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedEntry, setSelectedEntry] = useState<InwardEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<InwardEntry | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<InwardMaterial | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null; type: 'entry' | 'material' }>({
    isOpen: false,
    id: null,
    type: 'entry',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [materialCurrentPage, setMaterialCurrentPage] = useState(1);
  const [materialPageSize, setMaterialPageSize] = useState(20);
  const [displayedEntriesCount, setDisplayedEntriesCount] = useState(4);
  const [displayedMaterialsCount, setDisplayedMaterialsCount] = useState(4);



  // Fetch companies for form (cache for longer since it doesn't change often)
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesService.getCompanies({ limit: 100 }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch inward entries (use debounced search term with pagination)
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['inward', debouncedSearchTerm, currentPage, pageSize],
    queryFn: () => {
      const params = {
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: pageSize,
      };
      console.log('🔍 Inward API Request Params:', params);
      return inwardService.getEntries(params);
    },
    staleTime: 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  // Fetch statistics (cache for longer)
  const { data: statsData } = useQuery({
    queryKey: ['inward-stats'],
    queryFn: () => inwardService.getStats(),
    staleTime: 0, // Always fetch fresh stats
    refetchInterval: 10000,
  });

  // Fetch inward materials
  const { data: materialsData, isLoading: isMaterialsLoading, isFetching: isMaterialsFetching } = useQuery({
    queryKey: ['inward-materials', materialCurrentPage, materialPageSize],
    queryFn: () => inwardMaterialsService.getMaterials({
      page: materialCurrentPage,
      limit: materialPageSize
    }),
    staleTime: 1 * 60 * 1000, // 1 minute
    placeholderData: keepPreviousData,
  });

  // Fetch all inward entries for the import dropdown (limit 1000)
  const { data: allInwardEntriesData } = useQuery({
    queryKey: ['inward-all-for-dropdown'],
    queryFn: () => inwardService.getEntries({ limit: 1000 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInwardEntryData) => inwardService.createEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward'] });
      queryClient.invalidateQueries({ queryKey: ['inward-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-waste-flow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Inward entry created successfully');
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      logError('Creating inward entry', error);
      toast.error(getErrorMessage(error, 'Failed to create entry'));
    },
  });

  // Update entry mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInwardEntryData }) => inwardService.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward'] });
      queryClient.invalidateQueries({ queryKey: ['inward-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-waste-flow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Entry updated successfully');
      setIsEditModalOpen(false);
      setEditingEntry(null);
    },
    onError: (error: any) => {
      logError('Updating inward entry', error);
      toast.error(getErrorMessage(error, 'Failed to update entry'));
    },
  });

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inwardService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward'] });
      queryClient.invalidateQueries({ queryKey: ['inward-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-waste-flow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-activity'] });
      toast.success('Entry deleted successfully');
    },
    onError: (error: any) => {
      logError('Deleting inward entry', error);
      toast.error(getErrorMessage(error, 'Failed to delete entry'));
    },
  });

  const entries = data?.entries || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };
  const companies = companiesData?.companies || [];
  const stats = statsData || { totalEntries: 0, totalQuantity: 0, unit: 'MT', totalInvoiced: 0, totalReceived: 0 };
  const materials = materialsData?.materials || [];
  const materialsPagination = materialsData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Create material mutation
  const createMaterialMutation = useMutation({
    mutationFn: (data: any) => inwardMaterialsService.createMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward-materials'] });
      toast.success('Inward material record created successfully');
      setIsMaterialModalOpen(false);
    },
    onError: (error: any) => {
      logError('Creating inward material', error);
      toast.error(getErrorMessage(error, 'Failed to create material record'));
    },
  });

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inwardMaterialsService.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward-materials'] });
      toast.success('Inward material record updated successfully');
      setIsMaterialModalOpen(false);
      setEditingMaterial(null);
    },
    onError: (error: any) => {
      logError('Updating inward material', error);
      toast.error(getErrorMessage(error, 'Failed to update material record'));
    },
  });

  // Delete material mutation
  const deleteMaterialMutation = useMutation({
    mutationFn: (id: string) => inwardMaterialsService.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inward-materials'] });
      toast.success('Material record deleted successfully');
    },
    onError: (error: any) => {
      logError('Deleting inward material', error);
      toast.error(getErrorMessage(error, 'Failed to delete material record'));
    },
  });

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
    const entryData: CreateInwardEntryData = {
      date: formData.date,
      companyId: formData.companyId,
      manifestNo: formData.manifestNo,
      vehicleNo: formData.vehicleNo || undefined,
      wasteName: formData.wasteName,
      rate: formData.rate ? parseFloat(formData.rate) : undefined,
      category: formData.category || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      month: formData.month || undefined,
      lotNo: formData.lotNo || undefined,
      remarks: formData.remarks || undefined,
    };

    createMutation.mutate(entryData);
  }, [createMutation]);

  const handleUpdateEntry = useCallback(async (formData: any) => {
    if (!editingEntry) return;

    const entryData: UpdateInwardEntryData = {
      date: formData.date,
      companyId: formData.companyId,
      manifestNo: formData.manifestNo,
      vehicleNo: formData.vehicleNo || undefined,
      wasteName: formData.wasteName,
      rate: formData.rate ? parseFloat(formData.rate) : undefined,
      category: formData.category || undefined,
      quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
      unit: formData.unit,
      month: formData.month || undefined,
      lotNo: formData.lotNo || undefined,
      remarks: formData.remarks || undefined,
    };

    updateMutation.mutate({ id: editingEntry.id, data: entryData });
  }, [updateMutation, editingEntry]);

  const handleCreateInvoice = useCallback((entryIds: string[]) => {
    setSelectedEntryForInvoice(entryIds);
    setIsInvoiceModalOpen(true);
  }, []);

  const columns = useMemo(() => [
    { key: "srNo", header: "Sr No.", render: (_: InwardEntry, index: number) => <span>{(currentPage - 1) * pageSize + index + 1}</span> },
    { key: "date", header: "Date", render: (e: InwardEntry) => format(new Date(e.date), 'dd MMM yyyy') },
    { key: "month", header: "Month", render: (e: InwardEntry) => e.month || '-' },
    { key: "lotNo", header: "Lot No.", render: (e: InwardEntry) => e.lotNo || '-' },
    {
      key: "company",
      header: "Company",
      render: (e: InwardEntry) => <span className="font-medium text-foreground">{e.company?.name || '-'}</span>,
    },
    { key: "manifestNo", header: "Manifest No." },
    { key: "vehicleNo", header: "Vehicle No.", render: (e: InwardEntry) => e.vehicleNo || '-' },
    { key: "wasteName", header: "Waste Name" },
    ...(['admin', 'superadmin'].includes(user?.role || '') ? [
      {
        key: "rate",
        header: "Rate",
        render: (e: InwardEntry) => {
          const entryRate = e.rate;
          let displayRate = entryRate ? Number(entryRate) : null;

          if (!displayRate && (e.company as any)?.materials) {
            const material = (e.company as any).materials.find((m: any) =>
              m.materialName.trim().toLowerCase() === (e.wasteName || '').trim().toLowerCase()
            );
            if (material?.rate) {
              displayRate = Number(material.rate);
            }
          }

          return displayRate
            ? `₹${displayRate.toFixed(2)}/${e.unit}`
            : <span className="text-[10px] text-amber-500 font-medium uppercase tracking-tight">Rate not defined</span>
        }
      },
    ] : []),
    {
      key: "category",
      header: "Category",
      render: (e: InwardEntry) => e.category ? (
        <span className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground">{e.category}</span>
      ) : '-',
    },
    { key: "quantity", header: "Quantity", render: (e: InwardEntry) => `${e.quantity} ${e.unit}` },
    { key: "remarks", header: "Remarks", render: (e: InwardEntry) => <span className="text-muted-foreground italic text-xs truncate max-w-[150px]" title={e.remarks || ''}>{e.remarks || '-'}</span> },
    ...(['admin', 'superadmin'].includes(user?.role || '') ? [
      {
        key: "amount",
        header: "Amount",
        render: (e: InwardEntry) => {
          if (!e.invoice) return "-";

          // @ts-ignore - invoiceMaterials included from backend
          const materialsOnInv = e.invoice.invoiceMaterials || [];
          const entryBaseInvoiced = materialsOnInv
            .filter((m: any) => m.manifestNo === e.manifestNo && !m.isAdditionalCharge)
            .reduce((sum: number, m: any) => sum + (Number(m.amount) || 0), 0);

          // @ts-ignore - _count is injected by backend
          const entryCount = e.invoice._count?.inwardEntries || 1;
          const additionalCharges = Number(e.invoice.additionalCharges || 0);

          const entrySubtotal = entryBaseInvoiced + (additionalCharges / entryCount);
          return `₹${entrySubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
      { key: "invoiceNo", header: "Invoice No.", render: (e: InwardEntry) => e.invoice?.invoiceNo || "-" },
      {
        key: "gstAmount",
        header: "GST Amount",
        render: (e: InwardEntry) => {
          if (!e.invoice) return "-";

          // @ts-ignore - _count is injected by backend
          const entryCount = e.invoice._count?.inwardEntries || 1;
          const totalGST = (Number(e.invoice.cgst) || 0) + (Number(e.invoice.sgst) || 0);
          const entryGST = totalGST / entryCount;

          return `₹${entryGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
      {
        key: "grandTotal",
        header: "Grand Total",
        render: (e: InwardEntry) => {
          if (!e.invoice) return "-";

          // @ts-ignore - invoiceMaterials included from backend
          const materialsOnInv = e.invoice.invoiceMaterials || [];
          const entryBaseInvoiced = materialsOnInv
            .filter((m: any) => m.manifestNo === e.manifestNo && !m.isAdditionalCharge)
            .reduce((sum: number, m: any) => sum + (Number(m.amount) || 0), 0);

          // @ts-ignore - _count is injected by backend
          const entryCount = e.invoice._count?.inwardEntries || 1;
          const additionalCharges = Number(e.invoice.additionalCharges || 0);
          const totalGST = (Number(e.invoice.cgst) || 0) + (Number(e.invoice.sgst) || 0);

          const entryGross = entryBaseInvoiced + (additionalCharges / entryCount) + (totalGST / entryCount);

          return `₹${entryGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
      {
        key: "paymentReceived",
        header: "Payment Received",
        render: (e: InwardEntry) => {
          if (!e.invoice) return "-";

          const invGrandTotal = Number(e.invoice.grandTotal) || 0;
          const invPaymentReceived = Number(e.invoice.paymentReceived) || 0;

          // If no payment received on invoice, show nothing as requested
          if (invPaymentReceived <= 0) return "-";

          // @ts-ignore - invoiceMaterials included from backend
          const materialsOnInv = e.invoice.invoiceMaterials || [];
          const entryBaseInvoiced = materialsOnInv
            .filter((m: any) => m.manifestNo === e.manifestNo && !m.isAdditionalCharge)
            .reduce((sum: number, m: any) => sum + (Number(m.amount) || 0), 0);

          // @ts-ignore - _count is injected by backend
          const entryCount = e.invoice._count?.inwardEntries || 1;

          const additionalCharges = Number(e.invoice.additionalCharges || 0);
          const totalGST = (Number(e.invoice.cgst) || 0) + (Number(e.invoice.sgst) || 0);
          const entryGross = entryBaseInvoiced + (additionalCharges / entryCount) + (totalGST / entryCount);

          // Calculate proportional payment for this specific entry based on Invoice's payment status
          const paymentRatio = invGrandTotal > 0 ? (invPaymentReceived / invGrandTotal) : 0;
          const entryPaymentReceived = entryGross * paymentRatio;

          return `₹${entryPaymentReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        }
      },
      { key: "paymentReceivedOn", header: "Payment Received On", render: (e: InwardEntry) => e.invoice?.paymentReceivedOn ? format(new Date(e.invoice.paymentReceivedOn), 'dd MMM yyyy') : "-" },
      {
        key: "status",
        header: "Status",
        render: (e: InwardEntry) => {
          if (!e.invoice) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">Not Invoiced</span>;

          if (e.invoice.status) {
            return <StatusBadge status={e.invoice.status} />;
          }

          // Fallback calculation with tolerance
          const received = Number(e.invoice.paymentReceived);
          const total = Number(e.invoice.grandTotal);
          const epsilon = 0.01;

          if (received >= total - epsilon) return <StatusBadge status="paid" />;
          if (received > 0) return <StatusBadge status="partial" />;
          return <StatusBadge status="pending" />;
        },
      },
    ] : []),
    {
      key: "actions",
      header: "Actions",
      render: (e: InwardEntry) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedEntry(e)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {user?.role !== 'admin' && (
            <>
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
              {user?.role === 'superadmin' && !e.invoiceId && (
                <button
                  onClick={() => handleCreateInvoice([e.id])}
                  className="p-2 rounded-lg text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"
                  title="Create Invoice"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(e.id)}
                disabled={deleteMutation.isPending}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ], [handleDelete, handleCreateInvoice, deleteMutation, user, currentPage, pageSize]);

  return (
    <MainLayout title="Inward Management" subtitle="Manage waste collection entries">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search manifest, lot, or waste..."
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
                    const { entries: allEntries } = await inwardService.getEntries({
                      limit: 10000,
                      search: debouncedSearchTerm || undefined,
                    });

                    exportToCSV(
                      allEntries,
                      [
                        { key: 'computedSrNo', header: 'Sr No.' },
                        { key: 'date', header: 'Date' },
                        { key: 'month', header: 'Month' },
                        { key: 'lotNo', header: 'Lot No.' },
                        { key: 'company', header: 'Company' },
                        { key: 'manifestNo', header: 'Manifest No.' },
                        { key: 'vehicleNo', header: 'Vehicle No.' },
                        { key: 'wasteName', header: 'Waste Name' },
                        ...(user?.role === 'admin' || user?.role === 'superadmin' ? [{ key: 'rate', header: 'Rate' }] : []),
                        { key: 'category', header: 'Category' },
                        { key: 'quantity', header: 'Quantity' },
                        { key: 'remarks', header: 'Remarks' },
                        { key: 'amountPortion', header: 'Amount' },
                        { key: 'invoiceNo', header: 'Invoice No.' },
                        ...(user?.role === 'admin' || user?.role === 'superadmin' ? [
                          { key: 'gstPortion', header: 'GST Amount' },
                          { key: 'grandTotalPortion', header: 'Grand Total' },
                          { key: 'allocatedPayment', header: 'Payment Received' },
                          { key: 'paymentReceivedOn', header: 'Payment Received On' },
                          { key: 'status', header: 'Status' },
                        ] : []),
                      ],
                      `inward-entries-${new Date().toISOString().slice(0, 10)}.csv`,
                      {
                        computedSrNo: (_: any, item: any) => String(allEntries.indexOf(item) + 1),
                        date: (value: any, item: any) => {
                          const val = item.date || value;
                          if (!val) return '';
                          try {
                            return format(new Date(val), 'dd/MM/yyyy');
                          } catch (e) {
                            return String(val);
                          }
                        },
                        company: (value: any) => value?.name || '',
                        rate: (value: any) => formatCurrencyForExport(value),
                        amountPortion: (_: any, item: any) => {
                          if (!item.invoice) return '';
                          // @ts-ignore
                          const materialsOnInv = item.invoice.invoiceMaterials || [];
                          const entryBaseInvoiced = materialsOnInv
                            .filter((m: any) => m.manifestNo === item.manifestNo && !m.isAdditionalCharge)
                            .reduce((sum: number, m: any) => sum + (Number(m.amount) || 0), 0);
                          // @ts-ignore
                          const entryCount = item.invoice._count?.inwardEntries || 1;
                          const addChargesShare = Number(item.invoice.additionalCharges || 0) / entryCount;
                          return formatCurrencyForExport(entryBaseInvoiced + addChargesShare);
                        },
                        invoiceNo: (_: any, item: any) => item.invoice?.invoiceNo || '',
                        gstPortion: (_: any, item: any) => {
                          if (!item.invoice) return '';
                          // @ts-ignore
                          const entryCount = item.invoice._count?.inwardEntries || 1;
                          const totalGST = (Number(item.invoice.cgst) || 0) + (Number(item.invoice.sgst) || 0);
                          return formatCurrencyForExport(totalGST / entryCount);
                        },
                        grandTotalPortion: (_: any, item: any) => {
                          if (!item.invoice) return '';
                          // @ts-ignore
                          const materialsOnInv = item.invoice.invoiceMaterials || [];
                          const entryBaseInvoiced = materialsOnInv
                            .filter((m: any) => m.manifestNo === item.manifestNo && !m.isAdditionalCharge)
                            .reduce((sum: number, m: any) => sum + (Number(m.amount) || 0), 0);
                          // @ts-ignore
                          const entryCount = item.invoice._count?.inwardEntries || 1;
                          const totalGST = (Number(item.invoice.cgst) || 0) + (Number(item.invoice.sgst) || 0);
                          const addCharges = Number(item.invoice.additionalCharges || 0);
                          const entryGross = entryBaseInvoiced + (addCharges / entryCount) + (totalGST / entryCount);
                          return formatCurrencyForExport(entryGross);
                        },
                        allocatedPayment: (_: any, item: any) => {
                          if (!item.invoice) return '';
                          // @ts-ignore
                          const materialsOnInv = item.invoice.invoiceMaterials || [];
                          const entryBaseInvoiced = materialsOnInv
                            .filter((m: any) => m.manifestNo === item.manifestNo && !m.isAdditionalCharge)
                            .reduce((sum: number, m: any) => sum + (Number(m.amount) || 0), 0);
                          // @ts-ignore
                          const entryCount = item.invoice._count?.inwardEntries || 1;
                          const totalGST = (Number(item.invoice.cgst) || 0) + (Number(item.invoice.sgst) || 0);
                          const addCharges = Number(item.invoice.additionalCharges || 0);
                          const entryGross = entryBaseInvoiced + (addCharges / entryCount) + (totalGST / entryCount);

                          const grandTotal = Number(item.invoice?.grandTotal) || 0;
                          const totalReceived = Number(item.invoice?.paymentReceived) || 0;

                          if (!grandTotal || grandTotal === 0) return formatCurrencyForExport(0);
                          const allocated = (entryGross / grandTotal) * totalReceived;
                          return formatCurrencyForExport(allocated);
                        },
                        paymentReceivedOn: (_: any, item: any) => {
                          const val = item.invoice?.paymentReceivedOn;
                          if (!val) return '';
                          try {
                            return format(new Date(val), 'dd/MM/yyyy');
                          } catch (e) {
                            return String(val);
                          }
                        },
                        status: (_: any, item: any) => item.invoice?.status || 'pending',
                      }
                    );
                    toast.dismiss(toastId);
                    toast.success('Inward entries exported successfully');
                  } catch (error) {
                    toast.error('Failed to export entries');
                    console.error(error);
                  }
                }}>
                  Export Inward Entry
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  try {
                    const toastId = toast.loading('Exporting material records...');
                    const { materials: allMaterials } = await inwardMaterialsService.getMaterials({
                      limit: 10000,
                    });

                    exportToCSV(
                      allMaterials,
                      [
                        { key: 'date', header: 'Date' },
                        { key: 'month', header: 'Month' },
                        { key: 'transporterName', header: 'Transporter' },
                        { key: 'lotNo', header: 'Lot No.' },
                        { key: 'manifestNo', header: 'Manifest No.' },
                        { key: 'vehicleNo', header: 'Vehicle No.' },
                        { key: 'wasteName', header: 'Waste Name' },
                        { key: 'category', header: 'Category' },
                        { key: 'quantity', header: 'Quantity' },
                        { key: 'unit', header: 'Unit' },
                        ...(user?.role === 'admin' || user?.role === 'superadmin' ? [
                          { key: 'rate', header: 'Rate' },
                          { key: 'amount', header: 'Amount' },
                          { key: 'detCharges', header: 'Det Charges' },
                          { key: 'gst', header: 'GST' },
                          { key: 'grossAmount', header: 'Gross Amount' },
                        ] : []),
                        { key: 'invoiceNo', header: 'Invoice No.' },
                        { key: 'paidOn', header: 'Paid On' },
                      ],
                      `inward-materials-${new Date().toISOString().slice(0, 10)}.csv`,
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
                  Export Inward Transport Entry
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {user?.role !== 'admin' && (
              <button onClick={() => setIsModalOpen(true)} className="btn-primary flex-none justify-center px-4">
                <Plus className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Create Inward Entry</span>
              </button>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Entries</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{stats.totalEntries}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Quantity</p>
          <p className="text-xl md:text-2xl font-bold text-foreground mt-1">
            {stats.totalQuantity.toFixed(1)} {stats.unit || 'MT'}
          </p>
        </div>
        {['admin', 'superadmin'].includes(user?.role || '') && (
          <>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Invoiced Amount</p>
              <p className="text-xl md:text-2xl font-bold text-foreground mt-1">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(stats.totalInvoiced)}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-muted-foreground">Payment Received</p>
              <p className="text-xl md:text-2xl font-bold text-success mt-1">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(stats.totalReceived)}
              </p>
            </div>
          </>
        )}
      </div>

      {error ? (
        <div className="text-center py-12 glass-card">
          <p className="text-destructive">Failed to load entries. Please try again later.</p>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["inward"] })} className="mt-4">
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={entries}
          keyExtractor={(entry) => entry.id}
          emptyMessage="No inward entries found"
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          isLoading={isLoading || isFetching}
          maxHeight="400px"
        />
      )}

      {/* Inward Materials Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Inward Transporter Records</h2>
            <p className="text-sm text-muted-foreground">Manage transporter invoices and payments</p>
          </div>
          {user?.role !== 'admin' && (
            <Button onClick={() => setIsMaterialModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Inward Transporter Entry
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <DataTable
            columns={[
              { key: "srNo", header: "Sr No.", render: (_: any, index: number) => (materialCurrentPage - 1) * materialPageSize + index + 1, className: "w-16" },
              { key: "date", header: "Date", render: (m: InwardMaterial) => m.date ? format(new Date(m.date), 'dd MMM yyyy') : '-' },
              { key: "month", header: "Month", render: (m: any) => m.month || m.inwardEntry?.month || '-' }, // month might be on linked entry or direct
              { key: "transporterName", header: "Transporter" },
              { key: "lotNo", header: "Lot No.", render: (m: InwardMaterial) => m.lotNo || '-' },
              { key: "manifestNo", header: "Manifest No.", render: (m: InwardMaterial) => m.manifestNo || '-' },
              { key: 'vehicleNo', header: 'Vehicle No.', render: (m: InwardMaterial) => m.vehicleNo || '-' },
              { key: "wasteName", header: "Waste Name", render: (m: InwardMaterial) => m.wasteName || '-' },
              { key: "category", header: "Category", render: (m: InwardMaterial) => m.category || '-' },
              { key: "quantity", header: "Quantity", render: (m: InwardMaterial) => m.quantity ? `${m.quantity} ${m.unit || ''}` : '-' },
              { key: "vehicleCapacity", header: "Vehicle Capacity", render: (m: InwardMaterial) => m.vehicleCapacity || '-' },
              ...(user?.role === 'admin' || user?.role === 'superadmin' ? [
                { key: "rate", header: "Rate", render: (m: InwardMaterial) => (m.rate !== null && m.rate !== undefined) ? `₹${Number(m.rate).toFixed(2)}` : '-' },
                { key: "amount", header: "Amount", render: (m: InwardMaterial) => (m.amount !== null && m.amount !== undefined) ? `₹${Number(m.amount).toFixed(2)}` : '-' },
                { key: "detCharges", header: "Det. Charges", render: (m: InwardMaterial) => (m.detCharges !== null && m.detCharges !== undefined) ? `₹${Number(m.detCharges).toFixed(2)}` : '-' },
                { key: "gst", header: "GST", render: (m: InwardMaterial) => (m.gst !== null && m.gst !== undefined) ? `₹${Number(m.gst).toFixed(2)}` : '-' },
                { key: "grossAmount", header: "Gross Amount", render: (m: InwardMaterial) => (m.grossAmount !== null && m.grossAmount !== undefined) ? `₹${Number(m.grossAmount).toFixed(2)}` : '-' },
                { key: "invoiceNo", header: "Invoice No.", render: (m: InwardMaterial) => m.invoiceNo || '-' },
                { key: "paidOn", header: "Paid On", render: (m: InwardMaterial) => m.paidOn ? format(new Date(m.paidOn), 'dd MMM yyyy') : '-' },
              ] : []),
              {
                key: "actions",
                header: "Actions",
                render: (m: InwardMaterial) => (
                  <div className="flex items-center gap-2">
                    {user?.role !== 'admin' && (
                      <>
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
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            data={materials}
            keyExtractor={(material) => material.id}
            emptyMessage="No material records found"
            currentPage={materialsPagination.page}
            totalPages={materialsPagination.totalPages}
            onPageChange={(page) => setMaterialCurrentPage(page)}
            isLoading={isMaterialsLoading || isMaterialsFetching}
            maxHeight="400px"
          />
        </div>
      </div>

      {/* Create Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Inward Entry" size="lg">
        <InwardEntryForm
          companies={companies}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleCreateEntry}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Entry Details Modal */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={`Inward Entry - ${selectedEntry?.lotNo || selectedEntry?.manifestNo}`}
        size="xl"
      >
        {selectedEntry && <InwardEntryDetails entry={selectedEntry} />}
      </Modal>


      {/* Edit Entry Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingEntry(null); }} title="Edit Inward Entry" size="lg">
        {editingEntry && (
          <InwardEntryForm
            companies={companies}
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

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedEntryForInvoice([]);
        }}
        type="Inward"
        preselectedEntryIds={selectedEntryForInvoice}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inward'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
        }}
      />

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
        <InwardMaterialForm
          entry={editingMaterial || undefined}
          inwardEntries={allInwardEntriesData?.entries || []}
          onCancel={() => {
            setIsMaterialModalOpen(false);
            setEditingMaterial(null);
          }}
          onSubmit={(data: any) => {
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
        title={deleteConfirm.type === 'entry' ? "Delete Inward Entry" : "Delete Material Record"}
        description={
          deleteConfirm.type === 'entry'
            ? "Are you sure you want to delete this inward entry? This action cannot be undone."
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

// Simple Inward Entry Form Component
function InwardEntryForm({ companies, entry, onCancel, onSubmit, isLoading }: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: entry?.date ? format(new Date(entry.date), 'yyyy-MM-dd') : new Date().toISOString().slice(0, 10),
    companyId: entry?.companyId || "",
    manifestNo: entry?.manifestNo || "",
    vehicleNo: entry?.vehicleNo || "",
    wasteName: entry?.wasteName || "",
    rate: entry?.rate ? String(entry.rate) : "",
    category: entry?.category || "Solid",
    quantity: entry?.quantity ? String(entry.quantity) : "",
    unit: (entry?.unit as "MT" | "Kg" | "KL") || "Kg",
    month: entry?.month || "",
    lotNo: entry?.lotNo || "",
    remarks: entry?.remarks || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId || !formData.manifestNo || !formData.wasteName || !formData.quantity) {
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

    // Validate rate if provided and user is superadmin
    if (user?.role === 'superadmin' && formData.rate && !isPositiveNumber(formData.rate)) {
      toast.error("Rate must be a positive number");
      return;
    }

    const roundedData = {
      ...formData,
      quantity: roundToTwoDecimals(formData.quantity),
      rate: roundToTwoDecimals(formData.rate),
    };
    onSubmit(roundedData);
  };

  // Get selected company to access its materials
  const selectedCompany = companies.find((c: any) => c.id === formData.companyId);
  const companyMaterials = selectedCompany?.materials || [];

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const materialName = e.target.value;
    const material = companyMaterials.find((m: any) => m.materialName === materialName);

    setFormData({
      ...formData,
      wasteName: materialName,
      // Auto-populate rate and unit if a material is selected
      rate: material ? String(material.rate) : formData.rate,
      unit: material ? (material.unit as "MT" | "Kg" | "KL") : formData.unit,
    });
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
          <label className="block text-sm font-medium text-foreground mb-1.5">Company *</label>
          <select
            className="input-field w-full"
            value={formData.companyId}
            onChange={(e) => {
              // Reset waste name, rate and unit when company changes
              setFormData({
                ...formData,
                companyId: e.target.value,
                wasteName: "",
                rate: "",
                unit: "Kg"
              });
            }}
            required
          >
            <option value="">Select Company</option>
            {companies.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Waste Name *</label>
          <select
            className="input-field w-full"
            value={formData.wasteName}
            onChange={handleMaterialChange}
            required
            disabled={!formData.companyId}
          >
            <option value="">Select Waste Material</option>
            {companyMaterials.map((m: any) => (
              <option key={m.id} value={m.materialName}>
                {['admin', 'superadmin'].includes(user?.role || '')
                  ? `${m.materialName} (${m.rate ? `${m.rate}/${m.unit}` : 'Rate Pending'})`
                  : m.materialName}
              </option>
            ))}
            {!formData.companyId && <option value="" disabled>Select a company first</option>}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
          <select
            className="input-field w-full"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="Solid">Solid</option>
            <option value="Semi-solid">Semi-solid</option>
            <option value="Liquid">Liquid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          // Optional: disable unit if forced by material, but usually flexible
          >
            <option value="Kg">Kg</option>
            <option value="MT">MT</option>
            <option value="KL">KL</option>
          </select>
        </div>
        {['admin', 'superadmin'].includes(user?.role || '') && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Rate {user?.role !== 'superadmin' && <span className="text-[10px] text-amber-500 ml-1">(Super Admin only)</span>}
            </label>
            <input
              type="number"
              step="0.01"
              className={`input-field w-full ${user?.role !== 'superadmin' ? 'bg-muted/50 cursor-not-allowed opacity-75' : ''}`}
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              disabled={user?.role !== 'superadmin'}
              placeholder={user?.role === 'superadmin' ? "0.00" : "Rate pending..."}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Lot No.</label>
          <input
            type="text"
            className="input-field w-full"
            value={formData.lotNo}
            onChange={(e) => setFormData({ ...formData, lotNo: e.target.value })}
            placeholder="Auto-generated if empty"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Remarks</label>
        <textarea
          className="input-field w-full min-h-[80px] py-2"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          placeholder="Any additional notes..."
        />
      </div>

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
function InwardEntryDetails({ entry }: { entry: InwardEntry }) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!entry.invoice?.id) return;

    try {
      setIsDownloading(true);
      const invoiceData = await invoicesService.getInvoiceById(entry.invoice.id);

      const materials = (invoiceData.invoiceMaterials || []).filter(m => !(m as any).isAdditionalCharge);
      const additionalChargesList = (invoiceData.invoiceMaterials || []).filter(m => (m as any).isAdditionalCharge);

      const pdfData = {
        invoiceNo: invoiceData.invoiceNo,
        poNo: null,
        date: invoiceData.date,
        poDate: null,
        vehicleNo: entry.vehicleNo,
        customerName: invoiceData.customerName || entry.company?.name || '',
        customerAddress: invoiceData.billedTo || '',
        customerGst: invoiceData.gstNo || entry.company?.gstNumber || '',
        description: invoiceData.description || '',
        customKey: invoiceData.customKey,
        customValue: invoiceData.customValue,
        items: materials.length > 0
          ? materials.map(m => ({
            description: (m as any).description || '',
            manifestNo: (m as any).manifestNo || '',
            materialName: m.materialName,
            hsnCode: '999432',
            quantity: m.quantity,
            unit: m.unit,
            rate: m.rate,
            amount: m.amount
          }))
          : (invoiceData.inwardEntries && invoiceData.inwardEntries.length > 0)
            ? invoiceData.inwardEntries.map(e => ({
              description: '',
              manifestNo: e.manifestNo || '',
              hsnCode: '999432',
              quantity: e.quantity,
              unit: e.unit,
              rate: (e as any).rate || 0,
              amount: ((e as any).rate && e.quantity) ? ((e as any).rate * e.quantity) : 0
            }))
            : [],
        subTotal: invoiceData.subtotal,
        cgst: invoiceData.cgst || 0,
        sgst: invoiceData.sgst || 0,
        additionalCharges: invoiceData.additionalCharges || 0,
        additionalChargesDescription: invoiceData.additionalChargesDescription || '',
        additionalChargesQuantity: invoiceData.additionalChargesQuantity || 0,
        additionalChargesRate: invoiceData.additionalChargesRate || 0,
        additionalChargesUnit: invoiceData.additionalChargesUnit || '',
        additionalChargesList: additionalChargesList,
        grandTotal: invoiceData.grandTotal
      };

      await generateInvoicePDF(pdfData);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="font-medium text-foreground">{format(new Date(entry.date), 'dd MMM yyyy')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Lot No.</p>
          <p className="font-medium text-foreground">{entry.lotNo || '-'}</p>
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
          <p className="text-sm text-muted-foreground">Company</p>
          <p className="font-medium text-foreground">{entry.company?.name || '-'}</p>
        </div>
        {['admin', 'superadmin'].includes(user?.role || '') && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Rate</p>
              <p className="font-medium text-foreground">
                {entry.rate
                  ? `₹${Number(entry.rate).toFixed(2)}/${entry.unit}`
                  : <span className="text-amber-500">Rate not defined</span>
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice No.</p>
              <p className="font-medium text-foreground">{entry.invoice?.invoiceNo || '-'}</p>
            </div>
          </>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Waste Name</p>
          <p className="font-medium text-foreground">{entry.wasteName}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Category</p>
          <p className="font-medium text-foreground">{entry.category || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Quantity</p>
          <p className="font-medium text-foreground">{entry.quantity} {entry.unit}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Month</p>
          <p className="font-medium text-foreground">{entry.month || '-'}</p>
        </div>
      </div>

      {entry.remarks && (
        <div>
          <p className="text-sm text-muted-foreground">Remarks</p>
          <p className="font-medium text-foreground bg-muted/30 p-2 rounded mt-1 text-sm italic whitespace-pre-wrap">
            {entry.remarks}
          </p>
        </div>
      )}

      {/* Linked Transporter Records */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Transporter Records</h4>
        {entry.inwardMaterials && entry.inwardMaterials.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-[300px] rounded-xl border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs sticky top-0 z-[5]">
                <tr>
                  <th className="px-4 py-2 font-semibold">Transporter</th>
                  <th className="px-4 py-2 font-semibold">Vehicle No</th>
                  <th className="px-4 py-2 font-semibold text-right">Quantity</th>
                  {['admin', 'superadmin'].includes(user?.role || '') && (
                    <>
                      <th className="px-4 py-2 font-semibold text-right">Rate</th>
                      <th className="px-4 py-2 font-semibold text-right">Gross Amount</th>
                      <th className="px-4 py-2 font-semibold">Invoice No</th>
                      <th className="px-4 py-2 font-semibold">Paid On</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entry.inwardMaterials.map((mat: any) => (
                  <tr key={mat.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">{mat.transporterName}</td>
                    <td className="px-4 py-3">{mat.vehicleNo || '-'}</td>
                    <td className="px-4 py-3 text-right">{mat.quantity} {mat.unit}</td>
                    {['admin', 'superadmin'].includes(user?.role || '') && (
                      <>
                        <td className="px-4 py-3 text-right">₹{Number(mat.rate || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{Number(mat.grossAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">{mat.invoiceNo || '-'}</td>
                        <td className="px-4 py-3">
                          {mat.paidOn ? format(new Date(mat.paidOn), 'dd MMM yyyy') : <span className="text-destructive font-medium">Pending</span>}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic bg-secondary/20 p-4 rounded-xl text-center">
            No linked transporter records found for this entry.
          </p>
        )}
      </div>

      {
        entry.invoice && ['admin', 'superadmin'].includes(user?.role || '') && (
          <>
            <hr className="border-border" />
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Company Invoice Details</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download PDF
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice No.</p>
                <p className="font-medium text-foreground">{entry.invoice.invoiceNo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Amount</p>
                <p className="font-medium text-foreground text-lg">₹{Number(entry.invoice.grandTotal).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Received</p>
                <p className="font-medium text-success">₹{Number(entry.invoice.paymentReceived).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge
                  status={
                    Number(entry.invoice.paymentReceived) >= Number(entry.invoice.grandTotal)
                      ? "paid"
                      : Number(entry.invoice.paymentReceived) > 0
                        ? "partial"
                        : "pending"
                  }
                />
              </div>
            </div>
          </>
        )
      }
    </div >
  );
}
