import apiClient, { ApiResponse, Pagination } from '@/lib/api';

export interface InwardEntry {
  id: string;
  srNo: number | null;
  date: string;
  lotNo: string | null;
  companyId: string;
  manifestNo: string;
  vehicleNo: string | null;
  wasteName: string;
  rate: number | null;
  category: string | null;
  quantity: number;
  unit: string;
  month: string | null;
  invoiceId: string | null;
  company?: {
    id: string;
    name: string;
    gstNumber: string | null;
  };
  invoice?: {
    id: string;
    invoiceNo: string;
    grandTotal: number;
    subtotal: number;
    paymentReceived: number;
    paymentReceivedOn: string | null;
    status: "paid" | "partial" | "pending";
  };
  inwardMaterials?: InwardMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface InwardMaterial {
  id: string;
  inwardEntryId: string | null;
  srNo: number | null;
  date: string | null;
  lotNo: string | null;
  companyId: string | null;
  manifestNo: string | null;
  month: string | null;
  vehicleNo: string | null;
  wasteName: string | null;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  transporterName: string;
  invoiceNo: string | null;
  vehicleCapacity: string | null;
  rate: number | null;
  amount: number | null;
  detCharges: number | null;
  gst: number | null;
  grossAmount: number | null;
  paidOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInwardEntryData {
  date: string;
  companyId: string;
  manifestNo: string;
  vehicleNo?: string;
  wasteName: string;
  rate?: number;
  category?: string;
  quantity: number;
  unit: 'MT' | 'Kg' | 'KL';
  month?: string;
  lotNo?: string;
}

export interface UpdateInwardEntryData {
  date?: string;
  companyId?: string;
  manifestNo?: string;
  vehicleNo?: string;
  wasteName?: string;
  rate?: number;
  category?: string;
  quantity?: number;
  unit?: 'MT' | 'Kg' | 'KL';
  month?: string;
  lotNo?: string;
}

export interface CreateInwardMaterialData {
  inwardEntryId?: string;
  date?: string;
  lotNo?: string;
  companyId?: string;
  manifestNo?: string;
  month?: string;
  vehicleNo?: string;
  wasteName?: string;
  category?: string;
  quantity?: number;
  unit?: 'MT' | 'Kg' | 'KL';
  transporterName: string;
  invoiceNo?: string;
  vehicleCapacity?: string;
  rate?: number;
  amount?: number;
  detCharges?: number;
  gst?: number;
  grossAmount?: number;
  paidOn?: string;
}

export interface InwardStats {
  totalEntries: number;
  totalQuantity: number;
  totalInvoiced: number;
  totalReceived: number;
}

export interface GetInwardEntriesParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  wasteName?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Inward Service
 */
class InwardService {
  /**
   * Get all inward entries
   */
  async getEntries(params?: GetInwardEntriesParams): Promise<{ entries: InwardEntry[]; pagination: Pagination }> {
    const response = await apiClient.get<ApiResponse<InwardEntry[]>>('/inward', { params });
    return {
      entries: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get inward entry by ID
   */
  async getEntryById(id: string): Promise<InwardEntry> {
    const response = await apiClient.get<ApiResponse<{ entry: InwardEntry }>>(`/inward/${id}`);
    return response.data.data.entry;
  }

  /**
   * Create inward entry
   */
  async createEntry(data: CreateInwardEntryData): Promise<InwardEntry> {
    const response = await apiClient.post<ApiResponse<{ entry: InwardEntry }>>('/inward', data);
    return response.data.data.entry;
  }

  /**
   * Update inward entry
   */
  async updateEntry(id: string, data: UpdateInwardEntryData): Promise<InwardEntry> {
    const response = await apiClient.put<ApiResponse<{ entry: InwardEntry }>>(`/inward/${id}`, data);
    return response.data.data.entry;
  }

  /**
   * Delete inward entry
   */
  async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/inward/${id}`);
  }

  /**
   * Update payment
   */
  async updatePayment(id: string, paymentData: any): Promise<InwardEntry> {
    const response = await apiClient.put<ApiResponse<{ entry: InwardEntry }>>(`/inward/${id}/payment`, paymentData);
    return response.data.data.entry;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<InwardStats> {
    const response = await apiClient.get<ApiResponse<{ stats: InwardStats }>>('/inward/stats/all');
    return response.data.data.stats;
  }
}

export default new InwardService();


