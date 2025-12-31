import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();
/**
 * Seed admin user
 * Run this once to create the admin user
 * 
 * Usage: node src/seeders/admin.seeder.js
 */

const DEFAULT_ADMIN = {
  email: 'admin@chemwaste.com',
  password: 'admin123', // Change this in production!
  fullName: 'Administrator',
  role: 'admin',
};

async function seedAdmin() {
  try {
    logger.info('🌱 Seeding admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: DEFAULT_ADMIN.email },
    });

    if (existingAdmin) {
      logger.warn('⚠️  Admin user already exists. Skipping seed.');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: DEFAULT_ADMIN.email,
        passwordHash,
        fullName: DEFAULT_ADMIN.fullName,
        role: DEFAULT_ADMIN.role,
        isActive: true,
      },
    });

    logger.info('✅ Admin user created successfully!');
    logger.info(`   Email: ${admin.email}`);
    logger.info(`   Password: ${DEFAULT_ADMIN.password}`);
    logger.warn('⚠️  IMPORTANT: Change the default password after first login!');

    return admin;
  } catch (error) {
    logger.error('❌ Error seeding admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('admin.seeder.js')) {
  seedAdmin()
    .then(() => {
      logger.info('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedAdmin;

