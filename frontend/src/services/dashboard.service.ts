import apiClient, { ApiResponse } from '@/lib/api';

export interface DashboardStats {
  inward: {
    entries: number;
    quantity: number;
    allTimeEntries: number;
    allTimeQuantity: number;
  };
  outward: {
    entries: number;
    quantity: number;
    allTimeEntries: number;
    allTimeQuantity: number;
  };
  invoices: {
    thisMonth: number;
  };
  revenue: {
    ytd: number;
    paid: number;
    pending: number;
  };
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  paid: number;
  pending: number;
}

export interface PaymentStatus {
  paid: {
    amount: number;
    count: number;
  };
  pending: {
    amount: number;
    count: number;
  };
  partial: {
    amount: number;
    paid: number;
    pending: number;
    count: number;
  };
  overdue: {
    amount: number;
    count: number;
  };
}

export interface RecentActivity {
  inward: Array<{
    id: string;
    type: 'inward';
    date: string;
    description: string;
    details: string;
    createdAt: string;
  }>;
  outward: Array<{
    id: string;
    type: 'outward';
    date: string;
    description: string;
    details: string;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    type: 'invoice';
    date: string;
    description: string;
    details: string;
    status: string;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    type: 'payment';
    date: string;
    description: string;
    details: string;
    createdAt: string;
  }>;
}

export interface WasteFlowData {
  month: string;
  inward: number;
  outward: number;
}

/**
 * Dashboard Service
 */
class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<ApiResponse<{ stats: DashboardStats }>>('/dashboard/stats');
    return response.data.data.stats;
  }

  /**
   * Get revenue chart data
   */
  async getRevenueChart(year?: number): Promise<RevenueChartData[]> {
    const params = year ? { year } : {};
    const response = await apiClient.get<ApiResponse<{ chartData: RevenueChartData[] }>>('/dashboard/revenue', { params });
    return response.data.data.chartData;
  }

  /**
   * Get payment status breakdown
   */
  async getPaymentStatus(): Promise<PaymentStatus> {
    const response = await apiClient.get<ApiResponse<{ paymentStatus: PaymentStatus }>>('/dashboard/payment-status');
    return response.data.data.paymentStatus;
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity> {
    const response = await apiClient.get<ApiResponse<RecentActivity>>('/dashboard/recent-activity', {
      params: { limit },
    });
    return response.data.data;
  }

  /**
   * Get waste flow chart data
   */
  async getWasteFlow(year?: number): Promise<WasteFlowData[]> {
    const params = year ? { year } : {};
    const response = await apiClient.get<ApiResponse<{ chartData: WasteFlowData[] }>>('/dashboard/waste-flow', { params });
    return response.data.data.chartData;
  }
}

export default new DashboardService();

