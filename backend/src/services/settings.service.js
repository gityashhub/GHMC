import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Settings Service
 * Handles all settings-related business logic
 */

class SettingsService {
  /**
   * Get all settings
   * @returns {Promise<array>} All settings
   */
  async getAllSettings() {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });

    return settings;
  }

  /**
   * Get setting by key
   * @param {string} key - Setting key
   * @returns {Promise<object>} Setting
   */
  async getSettingByKey(key) {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundError(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  /**
   * Get setting value (returns just the value, parsed if needed)
   * @param {string} key - Setting key
   * @param {any} defaultValue - Default value if setting doesn't exist
   * @returns {Promise<any>} Setting value
   */
  async getSettingValue(key, defaultValue = null) {
    try {
      const setting = await this.getSettingByKey(key);
      return this.parseValue(setting.value, setting.type);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Parse setting value based on type
   * @param {string} value - Raw value
   * @param {string} type - Value type
   * @returns {any} Parsed value
   */
  parseValue(value, type) {
    if (value === null || value === undefined) return null;

    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Create or update setting
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   * @param {string} type - Value type (string, number, boolean, json)
   * @returns {Promise<object>} Setting
   */
  async upsertSetting(key, value, type = 'string') {
    // Validate type
    const validTypes = ['string', 'number', 'boolean', 'json'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate value based on type
    if (type === 'number' && isNaN(parseFloat(value))) {
      throw new ValidationError('Value must be a valid number');
    }

    if (type === 'boolean' && value !== 'true' && value !== 'false' && value !== '1' && value !== '0') {
      throw new ValidationError('Value must be a valid boolean (true/false/1/0)');
    }

    if (type === 'json') {
      try {
        JSON.parse(value);
      } catch {
        throw new ValidationError('Value must be valid JSON');
      }
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value: String(value),
        type,
      },
      create: {
        key,
        value: String(value),
        type,
      },
    });

    return setting;
  }

  /**
   * Update setting
   * @param {string} key - Setting key
   * @param {object} updateData - Update data
   * @returns {Promise<object>} Updated setting
   */
  async updateSetting(key, updateData) {
    const setting = await this.getSettingByKey(key);

    const { value, type } = updateData;

    // Use existing type if not provided
    const finalType = type || setting.type;

    // Validate type
    const validTypes = ['string', 'number', 'boolean', 'json'];
    if (finalType && !validTypes.includes(finalType)) {
      throw new ValidationError(`Invalid type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Validate value if provided
    if (value !== undefined) {
      if (finalType === 'number' && isNaN(parseFloat(value))) {
        throw new ValidationError('Value must be a valid number');
      }

      if (finalType === 'boolean' && value !== 'true' && value !== 'false' && value !== '1' && value !== '0') {
        throw new ValidationError('Value must be a valid boolean (true/false/1/0)');
      }

      if (finalType === 'json') {
        try {
          JSON.parse(value);
        } catch {
          throw new ValidationError('Value must be valid JSON');
        }
      }
    }

    const updatedSetting = await prisma.setting.update({
      where: { key },
      data: {
        value: value !== undefined ? String(value) : setting.value,
        type: finalType,
      },
    });

    return updatedSetting;
  }

  /**
   * Bulk update settings
   * @param {array} settings - Array of {key, value, type} objects
   * @returns {Promise<array>} Updated settings
   */
  async bulkUpdateSettings(settings) {
    if (!Array.isArray(settings)) {
      throw new ValidationError('Settings must be an array');
    }

    const results = await Promise.all(
      settings.map((setting) => {
        const { key, value, type = 'string' } = setting;
        if (!key) {
          throw new ValidationError('Each setting must have a key');
        }
        return this.upsertSetting(key, value, type);
      })
    );

    return results;
  }

  /**
   * Delete setting
   * @param {string} key - Setting key
   * @returns {Promise<void>}
   */
  async deleteSetting(key) {
    await this.getSettingByKey(key); // Check if exists
    await prisma.setting.delete({
      where: { key },
    });
  }
}

export default new SettingsService();

