import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Outward Materials Service
 * Handles outward material (transporter record) business logic
 */

class OutwardMaterialsService {
    /**
     * Get all outward materials with pagination and filters
     * @param {object} options - Query options
     * @returns {Promise<{materials: array, pagination: object}>}
     */
    async getAllMaterials(options = {}) {
        const {
            page = 1,
            limit = 20,
            outwardEntryId = '',
            search = '',
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const skip = (page - 1) * limit;
        const take = parseInt(limit);

        // Build where clause
        const where = {};

        if (outwardEntryId) {
            where.outwardEntryId = outwardEntryId;
        }

        if (search) {
            where.OR = [
                { manifestNo: { contains: search, mode: 'insensitive' } },
                { transporterName: { contains: search, mode: 'insensitive' } },
                { wasteName: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get materials and total count
        const [materials, total] = await Promise.all([
            prisma.outwardMaterial.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    outwardEntry: {
                        select: {
                            id: true,
                            srNo: true,
                            manifestNo: true,
                            month: true,
                            cementCompany: true,
                        },
                    },
                },
            }),
            prisma.outwardMaterial.count({ where }),
        ]);

        return {
            materials,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
                hasNext: page * take < total,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Get outward material by ID
     * @param {string} materialId - Material ID
     * @returns {Promise<object>} Material object
     */
    async getMaterialById(materialId) {
        const material = await prisma.outwardMaterial.findUnique({
            where: { id: materialId },
            include: {
                outwardEntry: true,
            },
        });

        if (!material) {
            throw new NotFoundError('Outward material');
        }

        return material;
    }

    /**
     * Create outward material record
     * @param {object} materialData - Material data
     * @returns {Promise<object>} Created material
     */
    async createMaterial(materialData) {
        const {
            outwardEntryId,
            date,
            cementCompany,
            manifestNo,
            vehicleNo,
            wasteName,
            quantity,
            unit,
            transporterName,
            invoiceNo,
            vehicleCapacity,
            rate,
            detCharges,
            gst,
            month,
            paidOn,
        } = materialData;

        // Validate required fields
        if (!transporterName) {
            throw new ValidationError('Transporter name is required');
        }

        // If outwardEntryId provided, verify it exists
        if (outwardEntryId) {
            const entry = await prisma.outwardEntry.findUnique({
                where: { id: outwardEntryId },
            });

            if (!entry) {
                throw new NotFoundError('Outward entry');
            }
        }

        // Calculate amount if rate and quantity provided
        let amount = null;
        if (rate && quantity) {
            amount = parseFloat(rate) * parseFloat(quantity);
        }

        // Calculate gross amount
        let grossAmount = amount || 0;
        if (detCharges) {
            grossAmount += parseFloat(detCharges);
        }
        if (gst) {
            grossAmount += parseFloat(gst);
        }

        // Create material
        const material = await prisma.outwardMaterial.create({
            data: {
                outwardEntryId: outwardEntryId || null,
                srNo: materialData.srNo || null,
                date: date ? new Date(date) : null,
                cementCompany: cementCompany?.trim() || null,
                manifestNo: manifestNo?.trim() || null,
                vehicleNo: vehicleNo?.trim() || null,
                wasteName: wasteName?.trim() || null,
                month: month?.trim() || null,
                quantity: quantity ? parseFloat(quantity) : null,
                unit: unit?.trim() || null,
                transporterName: transporterName.trim(),
                invoiceNo: invoiceNo?.trim() || null,
                vehicleCapacity: vehicleCapacity?.trim() || null,
                rate: rate ? parseFloat(rate) : null,
                amount: amount,
                detCharges: detCharges ? parseFloat(detCharges) : null,
                gst: gst ? parseFloat(gst) : null,
                grossAmount: grossAmount || null,
                paidOn: paidOn ? new Date(paidOn) : null,
            },
            include: {
                outwardEntry: true,
            },
        });

        return material;
    }

    /**
     * Update outward material
     * @param {string} materialId - Material ID
     * @param {object} updateData - Data to update
     * @returns {Promise<object>} Updated material
     */
    async updateMaterial(materialId, updateData) {
        await this.getMaterialById(materialId); // Check if exists

        // Recalculate amount and gross amount if rate/quantity changed
        let amount = updateData.amount;
        if (updateData.rate !== undefined || updateData.quantity !== undefined) {
            const material = await this.getMaterialById(materialId);
            const rate = updateData.rate !== undefined ? parseFloat(updateData.rate) : Number(material.rate);
            const quantity = updateData.quantity !== undefined ? parseFloat(updateData.quantity) : Number(material.quantity);

            if (rate && quantity) {
                amount = rate * quantity;
            }
        }

        // Recalculate gross amount
        let grossAmount = amount || 0;
        if (updateData.detCharges !== undefined) {
            grossAmount += parseFloat(updateData.detCharges) || 0;
        } else {
            const material = await this.getMaterialById(materialId);
            grossAmount += Number(material.detCharges) || 0;
        }

        if (updateData.gst !== undefined) {
            grossAmount += parseFloat(updateData.gst) || 0;
        } else {
            const material = await this.getMaterialById(materialId);
            grossAmount += Number(material.gst) || 0;
        }

        // Update material
        const updated = await prisma.outwardMaterial.update({
            where: { id: materialId },
            data: {
                ...(updateData.outwardEntryId !== undefined && { outwardEntryId: updateData.outwardEntryId || null }),
                ...(updateData.date !== undefined && { date: updateData.date ? new Date(updateData.date) : null }),
                ...(updateData.cementCompany !== undefined && { cementCompany: updateData.cementCompany?.trim() || null }),
                ...(updateData.manifestNo !== undefined && { manifestNo: updateData.manifestNo?.trim() || null }),
                ...(updateData.vehicleNo !== undefined && { vehicleNo: updateData.vehicleNo?.trim() || null }),
                ...(updateData.wasteName !== undefined && { wasteName: updateData.wasteName?.trim() || null }),
                ...(updateData.month !== undefined && { month: updateData.month?.trim() || null }),
                ...(updateData.quantity !== undefined && { quantity: updateData.quantity ? parseFloat(updateData.quantity) : null }),
                ...(updateData.unit !== undefined && { unit: updateData.unit?.trim() || null }),
                ...(updateData.transporterName !== undefined && { transporterName: updateData.transporterName.trim() }),
                ...(updateData.invoiceNo !== undefined && { invoiceNo: updateData.invoiceNo?.trim() || null }),
                ...(updateData.vehicleCapacity !== undefined && { vehicleCapacity: updateData.vehicleCapacity?.trim() || null }),
                ...(updateData.rate !== undefined && { rate: updateData.rate ? parseFloat(updateData.rate) : null }),
                ...(updateData.detCharges !== undefined && { detCharges: updateData.detCharges ? parseFloat(updateData.detCharges) : null }),
                ...(updateData.gst !== undefined && { gst: updateData.gst ? parseFloat(updateData.gst) : null }),
                ...(updateData.paidOn !== undefined && { paidOn: updateData.paidOn ? new Date(updateData.paidOn) : null }),
                ...(amount !== undefined && { amount }),
                ...(grossAmount !== undefined && { grossAmount }),
            },
            include: {
                outwardEntry: true,
            },
        });

        return updated;
    }

    /**
     * Delete outward material
     * @param {string} materialId - Material ID
     * @returns {Promise<void>}
     */
    async deleteMaterial(materialId) {
        await this.getMaterialById(materialId); // Check if exists

        await prisma.outwardMaterial.delete({
            where: { id: materialId },
        });
    }
}

export default new OutwardMaterialsService();
