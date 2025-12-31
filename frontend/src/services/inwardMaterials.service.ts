import apiClient, { ApiResponse } from '@/lib/api';
import { InwardMaterial, CreateInwardMaterialData } from './inward.service';

export interface GetInwardMaterialsParams {
  page?: number;
  limit?: number;
  inwardEntryId?: string;
  search?: string;
}

/**
 * Inward Materials Service
 */
class InwardMaterialsService {
  /**
   * Get all inward materials
   */
  async getMaterials(params?: GetInwardMaterialsParams): Promise<{ materials: InwardMaterial[]; pagination: any }> {
    const response = await apiClient.get<ApiResponse<InwardMaterial[]>>('/inward-materials', { params });
    return {
      materials: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get inward material by ID
   */
  async getMaterialById(id: string): Promise<InwardMaterial> {
    const response = await apiClient.get<ApiResponse<{ material: InwardMaterial }>>(`/inward-materials/${id}`);
    return response.data.data.material;
  }

  /**
   * Create inward material
   */
  async createMaterial(data: CreateInwardMaterialData): Promise<InwardMaterial> {
    const response = await apiClient.post<ApiResponse<{ material: InwardMaterial }>>('/inward-materials', data);
    return response.data.data.material;
  }

  /**
   * Update inward material
   */
  async updateMaterial(id: string, data: Partial<CreateInwardMaterialData>): Promise<InwardMaterial> {
    const response = await apiClient.put<ApiResponse<{ material: InwardMaterial }>>(`/inward-materials/${id}`, data);
    return response.data.data.material;
  }

  /**
   * Delete inward material
   */
  async deleteMaterial(id: string): Promise<void> {
    await apiClient.delete(`/inward-materials/${id}`);
  }
}

export default new InwardMaterialsService();

