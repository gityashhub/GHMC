import apiClient, { ApiResponse } from '@/lib/api';

export interface OutwardEntry {
  id: string;
  srNo: number | null;
  month: string | null;
  date: string;
  cementCompany: string;
  location: string | null;
  manifestNo: string;
  transporterId: string | null;
  vehicleNo: string | null;
  wasteName: string | null;
  quantity: number;
  unit: string;
  packing: string | null;
  invoiceId: string | null;
  rate: number | null;
  amount: number | null;
  gst: number | null;
  grossAmount: number | null;
  vehicleCapacity: string | null;
  detCharges: number | null;
  paidOn: string | null;
  dueOn: string | null;
  transporter?: {
    id: string;
    transporterId: string;
    name: string;
  };
  invoice?: {
    id: string;
    invoiceNo: string;
    grandTotal: number;
    paymentReceived: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutwardEntryData {
  date: string;
  cementCompany: string;
  manifestNo: string;
  transporterId?: string;
  vehicleNo?: string;
  wasteName?: string;
  quantity: number;
  unit: 'MT' | 'Kg' | 'KL';
  month?: string;
  location?: string;
  packing?: string;
  rate?: number;
  amount?: number;
  gst?: number;
  grossAmount?: number;
  vehicleCapacity?: string;
  detCharges?: number;
  paidOn?: string;
  dueOn?: string;
  invoiceNo?: string;
}

export interface UpdateOutwardEntryData {
  date?: string;
  cementCompany?: string;
  manifestNo?: string;
  transporterId?: string;
  vehicleNo?: string;
  wasteName?: string;
  quantity?: number;
  unit?: 'MT' | 'Kg' | 'KL';
  month?: string;
  location?: string;
  packing?: string;
  rate?: number;
  amount?: number;
  gst?: number;
  grossAmount?: number;
  vehicleCapacity?: string;
  detCharges?: number;
  paidOn?: string;
  dueOn?: string;
  invoiceNo?: string;
}

export interface OutwardSummary {
  month: string;
  cementCompany: string;
  transporterId: string | null;
  transporterName: string;
  totalQuantity: number;
  totalAmount: number;
  totalGrossAmount: number;
  count: number;
}

export interface OutwardStats {
  totalDispatches: number;
  totalQuantity: number;
  totalInvoiced: number;

  totalReceived: number;
}

export interface OutwardMaterial {
  id: string;
  outwardEntryId?: string | null;
  srNo?: number | null;
  date?: string | null;
  cementCompany?: string | null;
  manifestNo?: string | null;
  month?: string | null;
  vehicleNo?: string | null;
  wasteName?: string | null;
  quantity?: number | null;
  unit?: string | null;
  transporterName?: string;
  invoiceNo?: string | null;
  vehicleCapacity?: string | null;
  rate?: number | null;
  amount?: number | null;
  detCharges?: number | null;
  gst?: number | null;
  grossAmount?: number | null;
  paidOn?: string | null;
  outwardEntry?: OutwardEntry;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOutwardMaterialData {
  outwardEntryId?: string;
  srNo?: number;
  date?: string;
  cementCompany?: string;
  manifestNo?: string;
  month?: string;
  vehicleNo?: string;
  wasteName?: string;
  quantity?: number;
  unit?: string;
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

export interface UpdateOutwardMaterialData {
  outwardEntryId?: string;
  srNo?: number;
  date?: string;
  cementCompany?: string;
  manifestNo?: string;
  month?: string;
  vehicleNo?: string;
  wasteName?: string;
  quantity?: number;
  unit?: string;
  transporterName?: string;
  invoiceNo?: string;
  vehicleCapacity?: string;
  rate?: number;
  amount?: number;
  detCharges?: number;
  gst?: number;
  grossAmount?: number;
  paidOn?: string;
}

export interface GetOutwardEntriesParams {
  page?: number;
  limit?: number;
  search?: string;
  transporterId?: string;
  cementCompany?: string;
  wasteName?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Outward Service
 */
class OutwardService {
  /**
   * Get all outward entries
   */
  async getEntries(params?: GetOutwardEntriesParams): Promise<{ entries: OutwardEntry[]; pagination: any }> {
    const response = await apiClient.get<ApiResponse<OutwardEntry[]>>('/outward', { params });
    return {
      entries: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get outward entry by ID
   */
  async getEntryById(id: string): Promise<OutwardEntry> {
    const response = await apiClient.get<ApiResponse<{ entry: OutwardEntry }>>(`/outward/${id}`);
    return response.data.data.entry;
  }

  /**
   * Create outward entry
   */
  async createEntry(data: CreateOutwardEntryData): Promise<OutwardEntry> {
    const response = await apiClient.post<ApiResponse<{ entry: OutwardEntry }>>('/outward', data);
    return response.data.data.entry;
  }

  /**
   * Update outward entry
   */
  async updateEntry(id: string, data: UpdateOutwardEntryData): Promise<OutwardEntry> {
    const response = await apiClient.put<ApiResponse<{ entry: OutwardEntry }>>(`/outward/${id}`, data);
    return response.data.data.entry;
  }

  /**
   * Delete outward entry
   */
  async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/outward/${id}`);
  }

  /**
   * Get consolidated summary
   */
  async getSummary(params?: { month?: string; cementCompany?: string; transporterId?: string }): Promise<OutwardSummary[]> {
    const response = await apiClient.get<ApiResponse<{ summary: OutwardSummary[] }>>('/outward/summary/all', { params });
    return response.data.data.summary;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<OutwardStats> {
    const response = await apiClient.get<ApiResponse<{ stats: OutwardStats }>>('/outward/stats/all');
    return response.data.data.stats;
  }
}

export default new OutwardService();


