import apiClient, { ApiResponse } from '@/lib/api';
import { OutwardMaterial, CreateOutwardMaterialData } from './outward.service';

export interface GetOutwardMaterialsParams {
    page?: number;
    limit?: number;
    outwardEntryId?: string;
    search?: string;
}

/**
 * Outward Materials Service
 */
class OutwardMaterialsService {
    /**
     * Get all outward materials
     */
    async getMaterials(params?: GetOutwardMaterialsParams): Promise<{ materials: OutwardMaterial[]; pagination: any }> {
        const response = await apiClient.get<ApiResponse<OutwardMaterial[]>>('/outward-materials', { params });
        return {
            materials: response.data.data,
            pagination: response.data.pagination,
        };
    }

    /**
     * Get outward material by ID
     */
    async getMaterialById(id: string): Promise<OutwardMaterial> {
        const response = await apiClient.get<ApiResponse<{ material: OutwardMaterial }>>(`/outward-materials/${id}`);
        return response.data.data.material;
    }

    /**
     * Create outward material
     */
    async createMaterial(data: CreateOutwardMaterialData): Promise<OutwardMaterial> {
        const response = await apiClient.post<ApiResponse<{ material: OutwardMaterial }>>('/outward-materials', data);
        return response.data.data.material;
    }

    /**
     * Update outward material
     */
    async updateMaterial(id: string, data: Partial<CreateOutwardMaterialData>): Promise<OutwardMaterial> {
        const response = await apiClient.put<ApiResponse<{ material: OutwardMaterial }>>(`/outward-materials/${id}`, data);
        return response.data.data.material;
    }

    /**
     * Delete outward material
     */
    async deleteMaterial(id: string): Promise<void> {
        await apiClient.delete(`/outward-materials/${id}`);
    }
}

export default new OutwardMaterialsService();
