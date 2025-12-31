import apiClient, { ApiResponse } from '@/lib/api';

export interface Setting {
  id: string;
  key: string;
  value: string | null;
  type: 'string' | 'number' | 'boolean' | 'json';
  updatedAt: string;
}

export interface UpdateSettingData {
  value: string | number | boolean;
  type?: 'string' | 'number' | 'boolean' | 'json';
}

export interface BulkUpdateSetting {
  key: string;
  value: string | number | boolean;
  type?: 'string' | 'number' | 'boolean' | 'json';
}

/**
 * Settings Service
 */
class SettingsService {
  /**
   * Get all settings
   */
  async getSettings(): Promise<Setting[]> {
    const response = await apiClient.get<ApiResponse<{ settings: Setting[] }>>('/settings');
    return response.data.data.settings;
  }

  /**
   * Get setting by key
   */
  async getSetting(key: string): Promise<Setting> {
    const response = await apiClient.get<ApiResponse<{ setting: Setting }>>(`/settings/${key}`);
    return response.data.data.setting;
  }

  /**
   * Update setting
   */
  async updateSetting(key: string, data: UpdateSettingData): Promise<Setting> {
    const response = await apiClient.put<ApiResponse<{ setting: Setting }>>(`/settings/${key}`, data);
    return response.data.data.setting;
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(settings: BulkUpdateSetting[]): Promise<Setting[]> {
    const response = await apiClient.post<ApiResponse<{ settings: Setting[] }>>('/settings/bulk', {
      settings,
    });
    return response.data.data.settings;
  }

  /**
   * Delete setting
   */
  async deleteSetting(key: string): Promise<void> {
    await apiClient.delete(`/settings/${key}`);
  }

  /**
   * Parse setting value based on type
   */
  parseValue(setting: Setting): any {
    if (setting.value === null || setting.value === undefined) return null;

    switch (setting.type) {
      case 'number':
        return parseFloat(setting.value);
      case 'boolean':
        return setting.value === 'true' || setting.value === '1';
      case 'json':
        try {
          return JSON.parse(setting.value);
        } catch {
          return setting.value;
        }
      default:
        return setting.value;
    }
  }
}

export default new SettingsService();

