import apiClient, { ApiResponse, Pagination } from '@/lib/api';
import { Invoice } from './invoices.service';

export interface Transporter {
  id: string;
  transporterId: string;
  name: string;
  contact: string | null;
  address: string | null;
  email: string | null;
  gstNumber: string | null;
  invoices?: Invoice[];
  totalInvoiced?: number;
  totalPaid?: number;
  totalPending?: number;
  vehicleCount?: number;
  inwardHistory?: any[];
  outwardHistory?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransporterData {
  transporterId: string;
  name: string;
  contact?: string;
  address?: string;
  email?: string;
  gstNumber?: string;
}

export interface UpdateTransporterData {
  transporterId?: string;
  name?: string;
  contact?: string;
  address?: string;
  email?: string;
  gstNumber?: string;
}

export interface TransporterStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
}

export interface GetTransportersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Transporters Service
 */
class TransportersService {
  /**
   * Get all transporters
   */
  async getTransporters(params?: GetTransportersParams): Promise<{ transporters: Transporter[]; pagination: Pagination }> {
    const response = await apiClient.get<ApiResponse<Transporter[]>>('/transporters', { params });
    return {
      transporters: response.data.data,
      pagination: response.data.pagination!,
    };
  }

  /**
   * Get transporter by ID
   */
  async getTransporterById(id: string): Promise<Transporter> {
    const response = await apiClient.get<ApiResponse<{ transporter: Transporter }>>(`/transporters/${id}`);
    return response.data.data.transporter;
  }

  /**
   * Create transporter
   */
  async createTransporter(data: CreateTransporterData): Promise<Transporter> {
    const response = await apiClient.post<ApiResponse<{ transporter: Transporter }>>('/transporters', data);
    return response.data.data.transporter;
  }

  /**
   * Update transporter
   */
  async updateTransporter(id: string, data: UpdateTransporterData): Promise<Transporter> {
    const response = await apiClient.put<ApiResponse<{ transporter: Transporter }>>(`/transporters/${id}`, data);
    return response.data.data.transporter;
  }

  /**
   * Delete transporter
   */
  async deleteTransporter(id: string): Promise<void> {
    await apiClient.delete(`/transporters/${id}`);
  }

  /**
   * Get transporter statistics
   */
  async getTransporterStats(transporterId: string): Promise<TransporterStats> {
    const response = await apiClient.get<ApiResponse<{ stats: TransporterStats }>>(`/transporters/${transporterId}/stats`);
    return response.data.data.stats;
  }
}

export default new TransportersService();

