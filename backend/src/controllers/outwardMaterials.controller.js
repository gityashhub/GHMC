import outwardMaterialsService from '../services/outwardMaterials.service.js';
import { logger } from '../utils/logger.js';

/**
 * Outward Materials Controller
 * Handles HTTP requests for outward materials (transporter records)
 */

class OutwardMaterialsController {
    /**
     * Get all outward materials
     * GET /api/outward-materials
     */
    async getAllMaterials(req, res, next) {
        try {
            const { page, limit, outwardEntryId, search, sortBy, sortOrder } = req.query;

            const result = await outwardMaterialsService.getAllMaterials({
                page,
                limit,
                outwardEntryId,
                search,
                sortBy,
                sortOrder,
            });

            const role = req.user?.role;
            const materials = result.materials.map(material => {
                if (role === 'admin') return material;
                const { rate, amount, gst, grossAmount, detCharges, ...rest } = material;
                return rest;
            });

            res.status(200).json({
                success: true,
                data: materials,
                pagination: result.pagination,
                message: 'Outward materials retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get outward material by ID
     * GET /api/outward-materials/:id
     */
    async getMaterialById(req, res, next) {
        try {
            const { id } = req.params;
            const material = await outwardMaterialsService.getMaterialById(id);

            const role = req.user?.role;
            if (role !== 'admin' && material) {
                delete material.rate;
                delete material.amount;
                delete material.gst;
                delete material.grossAmount;
                delete material.detCharges;
            }

            res.status(200).json({
                success: true,
                data: { material },
                message: 'Outward material retrieved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create outward material
     * POST /api/outward-materials
     */
    async createMaterial(req, res, next) {
        try {
            const materialData = req.body;
            const material = await outwardMaterialsService.createMaterial(materialData);

            logger.info(`Outward material created: ${material.id}`);

            const role = req.user?.role;
            if (role !== 'admin' && material) {
                delete material.rate;
                delete material.amount;
                delete material.gst;
                delete material.grossAmount;
                delete material.detCharges;
            }

            res.status(201).json({
                success: true,
                data: { material },
                message: 'Outward material created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update outward material
     * PUT /api/outward-materials/:id
     */
    async updateMaterial(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const material = await outwardMaterialsService.updateMaterial(id, updateData);

            logger.info(`Outward material updated: ${material.id}`);

            const role = req.user?.role;
            if (role !== 'admin' && material) {
                delete material.rate;
                delete material.amount;
                delete material.gst;
                delete material.grossAmount;
                delete material.detCharges;
            }

            res.status(200).json({
                success: true,
                data: { material },
                message: 'Outward material updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete outward material
     * DELETE /api/outward-materials/:id
     */
    async deleteMaterial(req, res, next) {
        try {
            const { id } = req.params;
            await outwardMaterialsService.deleteMaterial(id);

            logger.info(`Outward material deleted: ${id}`);

            res.status(200).json({
                success: true,
                message: 'Outward material deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new OutwardMaterialsController();
