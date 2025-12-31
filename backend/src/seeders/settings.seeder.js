import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Settings Seeder
 * Creates default settings if they don't exist
 */

const defaultSettings = [
  {
    key: 'invoice_number_format',
    value: 'INV-YYYYMM',
    type: 'string',
    description: 'Invoice number prefix format (YYYYMM will be replaced with year and month)',
  },
  {
    key: 'cgst_rate',
    value: '9',
    type: 'number',
    description: 'CGST rate percentage',
  },
  {
    key: 'sgst_rate',
    value: '9',
    type: 'number',
    description: 'SGST rate percentage',
  },
  {
    key: 'payment_terms',
    value: '30',
    type: 'number',
    description: 'Default payment terms in days',
  },
  {
    key: 'company_name',
    value: '',
    type: 'string',
    description: 'Company name for invoices',
  },
  {
    key: 'company_address',
    value: '',
    type: 'string',
    description: 'Company address',
  },
  {
    key: 'company_gst_number',
    value: '',
    type: 'string',
    description: 'Company GST number',
  },
  {
    key: 'company_contact',
    value: '',
    type: 'string',
    description: 'Company contact number',
  },
  {
    key: 'company_email',
    value: '',
    type: 'string',
    description: 'Company email address',
  },
];

async function seedSettings() {
  try {
    logger.info('Starting settings seeder...');

    for (const setting of defaultSettings) {
      const existing = await prisma.setting.findUnique({
        where: { key: setting.key },
      });

      if (!existing) {
        await prisma.setting.create({
          data: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
          },
        });
        logger.info(`Created setting: ${setting.key}`);
      } else {
        logger.info(`Setting already exists: ${setting.key}`);
      }
    }

    logger.info('Settings seeder completed successfully');
  } catch (error) {
    logger.error('Error seeding settings:', error);
    throw error;
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSettings()
    .then(() => {
      logger.info('Settings seeder finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Settings seeder failed:', error);
      process.exit(1);
    });
}

export default seedSettings;

