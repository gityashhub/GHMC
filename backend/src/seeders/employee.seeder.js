import prisma from '../config/database.js';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed employee user
 * Run this once to create the employee user
 * 
 * Usage: node src/seeders/employee.seeder.js
 */

const DEFAULT_EMPLOYEE = {
    email: 'employee@chemwaste.com',
    password: 'employee123',
    fullName: 'Employee User',
    role: 'employee',
};

async function seedEmployee() {
    try {
        logger.info('🌱 Seeding employee user...');

        // Check if employee already exists
        const existingEmployee = await prisma.user.findUnique({
            where: { email: DEFAULT_EMPLOYEE.email },
        });

        if (existingEmployee) {
            logger.warn('⚠️  Employee user already exists. Skipping seed.');

            // If it exists, we might want to update the role to ensure it is 'employee' in case it was created differently
            if (existingEmployee.role !== 'employee') {
                logger.info('Updating existing user role to employee...');
                await prisma.user.update({
                    where: { id: existingEmployee.id },
                    data: { role: 'employee' }
                });
                logger.info('✅ User role updated to employee.');
            }
            return;
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(DEFAULT_EMPLOYEE.password, saltRounds);

        // Create employee user
        const employee = await prisma.user.create({
            data: {
                email: DEFAULT_EMPLOYEE.email,
                passwordHash,
                fullName: DEFAULT_EMPLOYEE.fullName,
                role: DEFAULT_EMPLOYEE.role,
                isActive: true, // Assuming isActive is a field based on schema
            },
        });

        logger.info('✅ Employee user created successfully!');
        logger.info(`   Email: ${employee.email}`);
        logger.info(`   Password: ${DEFAULT_EMPLOYEE.password}`);

        return employee;
    } catch (error) {
        logger.error('❌ Error seeding employee user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('employee.seeder.js')) {
    seedEmployee()
        .then(() => {
            logger.info('✅ Seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('❌ Seeding failed:', error);
            process.exit(1);
        });
}

export default seedEmployee;
