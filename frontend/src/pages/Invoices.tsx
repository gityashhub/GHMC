import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Search, Filter, Download, Eye, FileText, Plus, Trash2, Loader2, Edit } from "lucide-react";
import invoicesService, { Invoice, CreateInvoiceData, InvoiceStats } from "@/services/invoices.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CreateInvoiceModal from "@/components/common/CreateInvoiceModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from "@/utils/export";
import { generateInvoicePDF } from "@/utils/pdfGenerator";

export default function Invoices() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [paymentEditOpen, setPaymentEditOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'Inward' | 'Outward' | 'Transporter'>('Inward');
  const [paymentForm, setPaymentForm] = useState({
    paymentReceived: 0,
    paymentReceivedOn: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch invoices (use debounced search term with pagination)
  const { data, isLoading, error } = useQuery<{ invoices: Invoice[]; pagination: any }>({
    queryKey: ['invoices', debouncedSearchTerm, typeFilter, statusFilter, currentPage, pageSize],
    queryFn: () => invoicesService.getInvoices({
      search: debouncedSearchTerm || undefined,
      type: typeFilter !== 'all' ? typeFilter as any : undefined,
      status: statusFilter !== 'all' ? statusFilter as any : undefined,
      page: currentPage,
      limit: pageSize,
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: keepPreviousData,
  });

  // Fetch statistics (cache for longer)
  const { data: statsData } = useQuery<InvoiceStats>({
    queryKey: ['invoice-stats'],
    queryFn: () => invoicesService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => invoicesService.updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Payment updated successfully');
      setPaymentEditOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update payment');
    },
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete invoice');
    },
  });

  const invoices = data?.invoices || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false };
  const stats = statsData || {
    totalInvoices: 0,
    totalInvoiced: 0,
    totalReceived: 0,
    totalPending: 0,
    byType: [],
    byStatus: [],
  };

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm.id) return;
    deleteMutation.mutate(deleteConfirm.id);
    setDeleteConfirm({ isOpen: false, id: null });
  }, [deleteConfirm, deleteMutation]);

  const handleUpdatePayment = () => {
    if (!selectedInvoice) return;
    updatePaymentMutation.mutate({
      id: selectedInvoice.id,
      data: {
        paymentReceived: paymentForm.paymentReceived,
        paymentReceivedOn: paymentForm.paymentReceivedOn || undefined,
      },
    });
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);
      // Fetch full details
      const fullInvoice = await invoicesService.getInvoiceById(invoice.id);

      // Determine vehicle number from first inward entry if available
      let vehicleNo = null;
      if (fullInvoice.inwardEntries && fullInvoice.inwardEntries.length > 0) {
        // Accessing property that might not be in the strict TS interface but exists in API response
        vehicleNo = (fullInvoice.inwardEntries[0] as any).vehicleNo;
      }

      const pdfData = {
        invoiceNo: fullInvoice.invoiceNo,
        poNo: null,
        date: fullInvoice.date,
        poDate: null,
        vehicleNo: vehicleNo,
        customerName: fullInvoice.customerName || fullInvoice.company?.name || '',
        customerAddress: fullInvoice.billedTo || '',
        customerGst: fullInvoice.gstNo || fullInvoice.company?.gstNumber || '',
        items: (fullInvoice.invoiceMaterials && fullInvoice.invoiceMaterials.length > 0)
          ? fullInvoice.invoiceMaterials.map(m => ({
            description: m.materialName,
            hsnCode: '999432',
            quantity: m.quantity,
            unit: m.unit,
            rate: m.rate,
            amount: m.amount
          }))
          : (fullInvoice.inwardEntries && fullInvoice.inwardEntries.length > 0)
            ? fullInvoice.inwardEntries.map(e => ({
              description: e.wasteName,
              hsnCode: '999432',
              quantity: e.quantity,
              unit: e.unit,
              rate: (e as any).rate || 0,
              amount: ((e as any).rate && e.quantity) ? ((e as any).rate * e.quantity) : 0
            }))
            : [],
        subTotal: fullInvoice.subtotal,
        cgst: fullInvoice.cgst || 0,
        sgst: fullInvoice.sgst || 0,
        grandTotal: fullInvoice.grandTotal
      };

      await generateInvoicePDF(pdfData);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    {
      key: "invoiceNo",
      header: "Invoice No.",
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{invoice.invoiceNo}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (invoice: Invoice) => (
        <span
          className={`px-2 py-1 rounded text-xs ${invoice.type === "Inward"
            ? "bg-primary/20 text-primary"
            : invoice.type === "Outward"
              ? "bg-warning/20 text-warning"
              : "bg-chart-4/20 text-chart-4"
            }`}
        >
          {invoice.type}
        </span>
      ),
    },
    { key: "date", header: "Date", render: (invoice: Invoice) => format(new Date(invoice.date), 'dd MMM yyyy') },
    {
      key: "customerName",
      header: "Customer/Vendor",
      render: (invoice: Invoice) => (
        <span className="font-medium text-foreground">{invoice.customerName || '-'}</span>
      ),
    },
    {
      key: "manifests",
      header: "Manifest No.",
      render: (invoice: Invoice) => (
        <div className="space-y-1">
          {invoice.invoiceManifests && invoice.invoiceManifests.length > 0 ? (
            invoice.invoiceManifests.map((m, index) => (
              <span key={`${m.id}-${index}`} className="block text-xs text-muted-foreground">
                {m.manifestNo}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (invoice: Invoice) => `₹${Number(invoice.subtotal).toLocaleString()}`,
    },
    {
      key: "gst",
      header: "GST",
      render: (invoice: Invoice) => {
        const cgst = Number(invoice.cgst || 0);
        const sgst = Number(invoice.sgst || 0);
        return <span className="text-muted-foreground">₹{(cgst + sgst).toLocaleString()}</span>;
      },
    },
    {
      key: "grandTotal",
      header: "Grand Total",
      render: (invoice: Invoice) => (
        <span className="font-medium text-foreground">₹{Number(invoice.grandTotal).toLocaleString()}</span>
      ),
    },
    {
      key: "paymentReceived",
      header: "Received",
      render: (invoice: Invoice) => (
        <span className="text-success">₹{Number(invoice.paymentReceived).toLocaleString()}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (invoice: Invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (invoice: Invoice) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadInvoice(invoice)}
            disabled={downloadingId === invoice.id}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            title="Download PDF"
          >
            {downloadingId === invoice.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setSelectedInvoice(invoice)}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="View Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(invoice.id)}
            disabled={deleteMutation.isPending}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <MainLayout title="Invoice Management" subtitle="Track and manage all invoices">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Invoice Management" subtitle="Track and manage all invoices">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load invoices</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Invoice Management" subtitle="Track and manage all invoices">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (currentPage !== 1) {
                setCurrentPage(1);
              }
            }}
            className="input-field pl-10 w-full"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">All Types</option>
          <option value="Inward">Inward</option>
          <option value="Outward">Outward</option>
          <option value="Transporter">Transporter</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
        </select>
        <button
          onClick={() => {
            exportToCSV(
              invoices,
              [
                { key: 'invoiceNo', header: 'Invoice No.' },
                { key: 'type', header: 'Type' },
                { key: 'date', header: 'Date' },
                { key: 'customerName', header: 'Customer/Vendor' },
                { key: 'subtotal', header: 'Subtotal' },
                { key: 'cgst', header: 'CGST' },
                { key: 'sgst', header: 'SGST' },
                { key: 'grandTotal', header: 'Grand Total' },
                { key: 'paymentReceived', header: 'Payment Received' },
                { key: 'status', header: 'Status' },
              ],
              `invoices-${new Date().toISOString().slice(0, 10)}.csv`,
              {
                date: (value) => formatDateForExport(value),
                subtotal: (value) => formatCurrencyForExport(value),
                cgst: (value) => formatCurrencyForExport(value),
                sgst: (value) => formatCurrencyForExport(value),
                grandTotal: (value) => formatCurrencyForExport(value),
                paymentReceived: (value) => formatCurrencyForExport(value),
              }
            );
            toast.success('Invoices exported successfully');
          }}
          className="btn-secondary"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <div className="flex gap-2">
          <Button onClick={() => {
            setInvoiceType('Inward');
            setIsCreateInvoiceOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Inward Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalInvoices}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Invoiced Amount</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            ₹{stats.totalInvoiced.toLocaleString()}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Received</p>
          <p className="text-2xl font-bold text-success mt-1">
            ₹{stats.totalReceived.toLocaleString()}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Total Pending</p>
          <p className="text-2xl font-bold text-destructive mt-1">
            ₹{stats.totalPending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Invoice Type Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {stats.byType.map((typeStat) => (
          <div
            key={typeStat.type}
            className={`glass-card p-4 border-l-4 ${typeStat.type === "Inward"
              ? "border-l-primary"
              : typeStat.type === "Outward"
                ? "border-l-warning"
                : "border-l-chart-4"
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{typeStat.type} Invoices</p>
                <p className="text-xl font-bold text-foreground mt-1">{typeStat.count}</p>
              </div>
              <p className="text-lg font-medium text-foreground">
                ₹{typeStat.totalInvoiced.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={invoices}
        keyExtractor={(invoice) => invoice.id}
        emptyMessage="No invoices found"
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Invoice Details Modal */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => {
          setSelectedInvoice(null);
          setPaymentEditOpen(false);
        }}
        title={`Invoice - ${selectedInvoice?.invoiceNo}`}
        size="xl"
      >
        {selectedInvoice && (
          <InvoiceDetails
            invoice={selectedInvoice}
            paymentEditOpen={paymentEditOpen}
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            onEditPayment={() => {
              setPaymentForm({
                paymentReceived: Number(selectedInvoice.paymentReceived),
                paymentReceivedOn: selectedInvoice.paymentReceivedOn
                  ? format(new Date(selectedInvoice.paymentReceivedOn), 'yyyy-MM-dd')
                  : '',
              });
              setPaymentEditOpen(true);
            }}
            onCancelPaymentEdit={() => setPaymentEditOpen(false)}
            onUpdatePayment={handleUpdatePayment}
            isLoading={updatePaymentMutation.isPending}
          />
        )}
      </Modal>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        type={invoiceType}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
          queryClient.invalidateQueries({ queryKey: ['inward'] });
          queryClient.invalidateQueries({ queryKey: ['outward'] });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This will unlink it from related entries. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </MainLayout>
  );
}

// Invoice Details Component
function InvoiceDetails({
  invoice,
  paymentEditOpen,
  paymentForm,
  setPaymentForm,
  onEditPayment,
  onCancelPaymentEdit,
  onUpdatePayment,
  isLoading,
}: any) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Invoice No.</p>
          <p className="font-medium text-foreground">{invoice.invoiceNo}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="font-medium text-foreground">{invoice.type}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="font-medium text-foreground">{format(new Date(invoice.date), 'dd MMM yyyy')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <StatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Customer/Vendor</p>
          <p className="font-medium text-foreground">{invoice.customerName || '-'}</p>
        </div>
        {invoice.company && (
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-medium text-foreground">{invoice.company.name}</p>
            {invoice.company.gstNumber && (
              <p className="text-xs text-muted-foreground">GST: {invoice.company.gstNumber}</p>
            )}
          </div>
        )}
        {invoice.transporter && (
          <div>
            <p className="text-sm text-muted-foreground">Transporter</p>
            <p className="font-medium text-foreground">{invoice.transporter.name}</p>
            {invoice.transporter.gstNumber && (
              <p className="text-xs text-muted-foreground">GST: {invoice.transporter.gstNumber}</p>
            )}
          </div>
        )}
      </div>

      {/* Manifests */}
      {invoice.invoiceManifests && invoice.invoiceManifests.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Manifest Numbers</p>
          <div className="flex flex-wrap gap-2">
            {invoice.invoiceManifests.map((m: any, index: number) => (
              <span key={`${m.id}-${index}`} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                {m.manifestNo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Materials */}
      {invoice.invoiceMaterials && invoice.invoiceMaterials.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Materials</p>
          <div className="space-y-2">
            {invoice.invoiceMaterials.map((m: any, index: number) => (
              <div key={`${m.id}-${index}`} className="flex justify-between items-center p-2 bg-secondary rounded">
                <div>
                  <p className="font-medium">{m.materialName}</p>
                  {m.quantity && m.unit && (
                    <p className="text-xs text-muted-foreground">
                      {m.quantity} {m.unit}
                    </p>
                  )}
                </div>
                {m.amount && (
                  <p className="font-medium">₹{Number(m.amount).toLocaleString()}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <hr className="border-border" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <p className="text-sm text-muted-foreground">Subtotal</p>
          <p className="font-medium">₹{Number(invoice.subtotal).toLocaleString()}</p>
        </div>
        {invoice.cgst && invoice.sgst && (
          <>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">CGST</p>
              <p className="font-medium">₹{Number(invoice.cgst).toLocaleString()}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">SGST</p>
              <p className="font-medium">₹{Number(invoice.sgst).toLocaleString()}</p>
            </div>
          </>
        )}
        <div className="flex justify-between pt-2 border-t border-border">
          <p className="font-medium text-lg">Grand Total</p>
          <p className="font-bold text-lg">₹{Number(invoice.grandTotal).toLocaleString()}</p>
        </div>
      </div>

      {/* Payment Section */}
      <hr className="border-border" />
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Payment Received</p>
            <p className="font-medium text-lg text-success">
              ₹{Number(invoice.paymentReceived).toLocaleString()}
            </p>
            {invoice.paymentReceivedOn && (
              <p className="text-xs text-muted-foreground">
                On {format(new Date(invoice.paymentReceivedOn), 'dd MMM yyyy')}
              </p>
            )}
          </div>
          {!paymentEditOpen && (
            <Button variant="outline" onClick={onEditPayment}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Payment
            </Button>
          )}
        </div>

        {paymentEditOpen && (
          <div className="space-y-3 p-4 bg-secondary rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Payment Received
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field w-full"
                  value={paymentForm.paymentReceived}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentReceived: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Payment Date
                </label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={paymentForm.paymentReceivedOn}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, paymentReceivedOn: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCancelPaymentEdit} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={onUpdatePayment} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Payment'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
