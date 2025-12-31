import apiClient, { ApiResponse } from '@/lib/api';

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: 'Inward' | 'Outward' | 'Transporter';
  date: string;
  customerName: string | null;
  companyId: string | null;
  transporterId: string | null;
  subtotal: number;
  cgst: number | null;
  sgst: number | null;
  grandTotal: number;
  paymentReceived: number;
  paymentReceivedOn: string | null;
  status: 'paid' | 'pending' | 'partial';
  gstNo: string | null;
  billedTo: string | null;
  shippedTo: string | null;
  description: string | null;
  company?: {
    id: string;
    name: string;
    gstNumber: string | null;
  };
  transporter?: {
    id: string;
    name: string;
    gstNumber: string | null;
  };
  invoiceManifests?: Array<{
    id: string;
    manifestNo: string;
  }>;
  invoiceMaterials?: Array<{
    id: string;
    materialName: string;
    rate: number | null;
    unit: string | null;
    quantity: number | null;
    amount: number | null;
    manifestNo: string | null;
  }>;
  inwardEntries?: Array<{
    id: string;
    srNo: number | null;
    date: string;
    lotNo: string | null;
    manifestNo: string;
    wasteName: string;
    quantity: number;
    unit: string;
  }>;
  outwardEntries?: Array<{
    id: string;
    srNo: number | null;
    date: string;
    manifestNo: string;
    cementCompany: string;
    quantity: number;
    unit: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceData {
  type: 'Inward' | 'Outward' | 'Transporter';
  date: string;
  companyId?: string;
  transporterId?: string;
  customerName?: string;
  materials?: Array<{
    materialName: string;
    rate?: number;
    unit?: string;
    quantity?: number;
    amount?: number;
    manifestNo?: string;
  }>;
  manifestNos?: string[];
  inwardEntryIds?: string[];
  outwardEntryIds?: string[];
  subtotal?: number;
  cgstRate?: number;
  sgstRate?: number;
  gstNo?: string;
  billedTo?: string;
  shippedTo?: string;
  description?: string;
  paymentReceived?: number;
  paymentReceivedOn?: string;
}

export interface UpdateInvoiceData {
  date?: string;
  customerName?: string;
  materials?: Array<{
    materialName: string;
    rate?: number;
    unit?: string;
    quantity?: number;
    amount?: number;
    manifestNo?: string;
  }> | null;
  manifestNos?: string[] | null;
  subtotal?: number;
  cgstRate?: number;
  sgstRate?: number;
  gstNo?: string;
  billedTo?: string;
  shippedTo?: string;
  description?: string;
}

export interface UpdatePaymentData {
  paymentReceived: number;
  paymentReceivedOn?: string;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalInvoiced: number;
  totalReceived: number;
  totalPending: number;
  byType: Array<{
    type: string;
    count: number;
    totalInvoiced: number;
    totalReceived: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
    totalInvoiced: number;
    totalReceived: number;
  }>;
}

export interface GetInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'Inward' | 'Outward' | 'Transporter';
  status?: 'paid' | 'pending' | 'partial';
  startDate?: string;
  endDate?: string;
  companyId?: string;
  transporterId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Invoices Service
 */
class InvoicesService {
  /**
   * Get all invoices
   */
  async getInvoices(params?: GetInvoicesParams): Promise<{ invoices: Invoice[]; pagination: any }> {
    const response = await apiClient.get<ApiResponse<Invoice[]>>('/invoices', { params });
    return {
      invoices: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await apiClient.get<ApiResponse<{ invoice: Invoice }>>(`/invoices/${id}`);
    return response.data.data.invoice;
  }

  /**
   * Create invoice
   */
  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const response = await apiClient.post<ApiResponse<{ invoice: Invoice }>>('/invoices', data);
    return response.data.data.invoice;
  }

  /**
   * Update invoice
   */
  async updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    const response = await apiClient.put<ApiResponse<{ invoice: Invoice }>>(`/invoices/${id}`, data);
    return response.data.data.invoice;
  }

  /**
   * Update payment
   */
  async updatePayment(id: string, paymentData: UpdatePaymentData): Promise<Invoice> {
    const response = await apiClient.put<ApiResponse<{ invoice: Invoice }>>(`/invoices/${id}/payment`, paymentData);
    return response.data.data.invoice;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(`/invoices/${id}`);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<InvoiceStats> {
    const response = await apiClient.get<ApiResponse<{ stats: InvoiceStats }>>('/invoices/stats');
    return response.data.data.stats;
  }
}

export default new InvoicesService();

