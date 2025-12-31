import apiClient, { ApiResponse, Pagination } from '@/lib/api';
import { User } from './auth.service';
import { Invoice } from './invoices.service';

export interface Company {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  contact: string | null;
  email: string | null;
  gstNumber: string | null;
  materials: CompanyMaterial[];
  invoices?: Invoice[];
  totalInvoiced?: number;
  totalPaid?: number;
  totalPending?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMaterial {
  id: string;
  companyId: string;
  materialName: string;
  rate: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
  name: string;
  address?: string;
  city?: string;
  contact?: string;
  email?: string;
  gstNumber?: string;
  materials?: Array<{
    material: string;
    rate: number;
    unit: 'MT' | 'Kg' | 'KL';
  }>;
}

export interface UpdateCompanyData {
  name?: string;
  address?: string;
  city?: string;
  contact?: string;
  email?: string;
  gstNumber?: string;
}

export interface AddMaterialData {
  material: string;
  rate: number;
  unit: 'MT' | 'Kg' | 'KL';
}

export interface UpdateMaterialData {
  material?: string;
  rate?: number;
  unit?: 'MT' | 'Kg' | 'KL';
}

export interface CompanyStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
}

export interface GetCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Companies Service
 */
class CompaniesService {
  /**
   * Get all companies
   */
  async getCompanies(params?: GetCompaniesParams): Promise<{ companies: Company[]; pagination: Pagination }> {
    const response = await apiClient.get<ApiResponse<Company[]>>('/companies', { params });
    return {
      companies: response.data.data,
      pagination: response.data.pagination!,
    };
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: string): Promise<Company> {
    const response = await apiClient.get<ApiResponse<{ company: Company }>>(`/companies/${id}`);
    return response.data.data.company;
  }

  /**
   * Create company
   */
  async createCompany(data: CreateCompanyData): Promise<Company> {
    const response = await apiClient.post<ApiResponse<{ company: Company }>>('/companies', data);
    return response.data.data.company;
  }

  /**
   * Update company
   */
  async updateCompany(id: string, data: UpdateCompanyData): Promise<Company> {
    const response = await apiClient.put<ApiResponse<{ company: Company }>>(`/companies/${id}`, data);
    return response.data.data.company;
  }

  /**
   * Delete company
   */
  async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`);
  }

  /**
   * Get company materials
   */
  async getCompanyMaterials(companyId: string): Promise<CompanyMaterial[]> {
    const response = await apiClient.get<ApiResponse<{ materials: CompanyMaterial[] }>>(
      `/companies/${companyId}/materials`
    );
    return response.data.data.materials;
  }

  /**
   * Add material to company
   */
  async addMaterial(companyId: string, data: AddMaterialData): Promise<CompanyMaterial> {
    const response = await apiClient.post<ApiResponse<{ material: CompanyMaterial }>>(
      `/companies/${companyId}/materials`,
      data
    );
    return response.data.data.material;
  }

  /**
   * Update material
   */
  async updateMaterial(companyId: string, materialId: string, data: UpdateMaterialData): Promise<CompanyMaterial> {
    const response = await apiClient.put<ApiResponse<{ material: CompanyMaterial }>>(
      `/companies/${companyId}/materials/${materialId}`,
      data
    );
    return response.data.data.material;
  }

  /**
   * Remove material from company
   */
  async removeMaterial(companyId: string, materialId: string): Promise<void> {
    await apiClient.delete(`/companies/${companyId}/materials/${materialId}`);
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(companyId: string): Promise<CompanyStats> {
    const response = await apiClient.get<ApiResponse<{ stats: CompanyStats }>>(`/companies/${companyId}/stats`);
    return response.data.data.stats;
  }
}

export default new CompaniesService();

