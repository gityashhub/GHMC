import Joi from 'joi';

/**
 * Validation schemas using Joi
 */

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name must not exceed 100 characters',
  }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null).messages({
    'string.pattern.base': 'Phone number must be 10 digits',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters',
    'any.required': 'New password is required',
  }),
});

// Company validation schemas
export const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Company name must be at least 2 characters',
    'string.max': 'Company name must not exceed 200 characters',
    'any.required': 'Company name is required',
  }),
  address: Joi.string().max(500).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  contact: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null).messages({
    'string.email': 'Please provide a valid email address',
  }),
  gstNumber: Joi.string().max(15).optional().allow('', null),
  materials: Joi.array()
    .items(
      Joi.object({
        material: Joi.string().required(),
        rate: Joi.number().positive().required(),
        unit: Joi.string().valid('MT', 'Kg', 'KL').required(),
      })
    )
    .optional()
    .default([]),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  address: Joi.string().max(500).optional().allow('', null),
  city: Joi.string().max(100).optional().allow('', null),
  contact: Joi.string().max(20).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null).messages({
    'string.email': 'Please provide a valid email address',
  }),
  gstNumber: Joi.string().max(15).optional().allow('', null),
});

export const addMaterialSchema = Joi.object({
  material: Joi.string().min(1).required().messages({
    'any.required': 'Material name is required',
  }),
  rate: Joi.number().positive().required().messages({
    'number.positive': 'Rate must be greater than 0',
    'any.required': 'Rate is required',
  }),
  unit: Joi.string().valid('MT', 'Kg', 'KL').required().messages({
    'any.only': 'Unit must be MT, Kg, or KL',
    'any.required': 'Unit is required',
  }),
});

export const updateMaterialSchema = Joi.object({
  material: Joi.string().min(1).optional(),
  rate: Joi.number().positive().optional(),
  unit: Joi.string().valid('MT', 'Kg', 'KL').optional(),
});

// Transporter validation schemas
export const createTransporterSchema = Joi.object({
  transporterId: Joi.string().min(1).max(50).required().messages({
    'any.required': 'Transporter ID is required',
  }),
  name: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Transporter name must be at least 2 characters',
    'string.max': 'Transporter name must not exceed 200 characters',
    'any.required': 'Transporter name is required',
  }),
  contact: Joi.string().max(20).optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null).messages({
    'string.email': 'Please provide a valid email address',
  }),
  gstNumber: Joi.string().max(15).optional().allow('', null),
});

export const updateTransporterSchema = Joi.object({
  transporterId: Joi.string().min(1).max(50).optional(),
  name: Joi.string().min(2).max(200).optional(),
  contact: Joi.string().max(20).optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null).messages({
    'string.email': 'Please provide a valid email address',
  }),
  gstNumber: Joi.string().max(15).optional().allow('', null),
});

// Inward Entry validation schemas
export const createInwardEntrySchema = Joi.object({
  date: Joi.date().required().messages({
    'any.required': 'Date is required',
  }),
  companyId: Joi.string().uuid().required().messages({
    'any.required': 'Company is required',
  }),
  manifestNo: Joi.string().min(1).required().messages({
    'any.required': 'Manifest number is required',
  }),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().min(1).required().messages({
    'any.required': 'Waste name is required',
  }),
  rate: Joi.number().positive().optional().allow(null),
  category: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().required().messages({
    'any.required': 'Quantity is required',
    'number.positive': 'Quantity must be positive',
  }),
  unit: Joi.string().valid('MT', 'Kg', 'KL').required().messages({
    'any.only': 'Unit must be MT, Kg, or KL',
    'any.required': 'Unit is required',
  }),
  month: Joi.string().optional().allow('', null),
  lotNo: Joi.string().optional().allow('', null),
  srNo: Joi.number().integer().positive().optional(),
  invoiceNo: Joi.string().optional().allow('', null),
  dcNo: Joi.string().optional().allow('', null),
});

export const updateInwardEntrySchema = Joi.object({
  date: Joi.date().optional(),
  companyId: Joi.string().uuid().optional(),
  manifestNo: Joi.string().min(1).optional(),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().min(1).optional(),
  rate: Joi.number().positive().optional().allow(null),
  category: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().optional(),
  unit: Joi.string().valid('MT', 'Kg', 'KL').optional(),
  month: Joi.string().optional().allow('', null),
  lotNo: Joi.string().optional().allow('', null),
  invoiceNo: Joi.string().optional().allow('', null),
  dcNo: Joi.string().optional().allow('', null),
});

// Inward Material validation schemas
export const createInwardMaterialSchema = Joi.object({
  inwardEntryId: Joi.string().uuid().optional().allow('', null),
  date: Joi.date().optional().allow(null),
  lotNo: Joi.string().optional().allow('', null),
  companyId: Joi.string().uuid().optional().allow('', null),
  manifestNo: Joi.string().optional().allow('', null),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().optional().allow('', null),
  category: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().optional().allow(null),
  unit: Joi.string().valid('MT', 'Kg', 'KL').optional().allow('', null),
  transporterName: Joi.string().min(1).required().messages({
    'any.required': 'Transporter name is required',
  }),
  invoiceNo: Joi.string().optional().allow('', null),
  vehicleCapacity: Joi.string().optional().allow('', null),
  rate: Joi.number().positive().optional().allow(null),
  detCharges: Joi.number().positive().optional().allow(null),
  gst: Joi.number().positive().optional().allow(null),
  paidOn: Joi.date().optional().allow(null),
  srNo: Joi.number().integer().positive().optional(),
});

export const updateInwardMaterialSchema = Joi.object({
  inwardEntryId: Joi.string().uuid().optional().allow('', null),
  date: Joi.date().optional().allow(null),
  lotNo: Joi.string().optional().allow('', null),
  manifestNo: Joi.string().optional().allow('', null),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().optional().allow('', null),
  category: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().optional().allow(null),
  unit: Joi.string().valid('MT', 'Kg', 'KL').optional().allow('', null),
  transporterName: Joi.string().min(1).optional(),
  invoiceNo: Joi.string().optional().allow('', null),
  vehicleCapacity: Joi.string().optional().allow('', null),
  rate: Joi.number().positive().optional().allow(null),
  detCharges: Joi.number().positive().optional().allow(null),
  gst: Joi.number().positive().optional().allow(null),
  paidOn: Joi.date().optional().allow(null),
});

// Outward Material validation schemas
export const createOutwardMaterialSchema = Joi.object({
  outwardEntryId: Joi.string().uuid().optional().allow('', null),
  date: Joi.date().optional().allow(null),
  cementCompany: Joi.string().optional().allow('', null),
  manifestNo: Joi.string().optional().allow('', null),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().optional().allow(null),
  unit: Joi.string().valid('MT', 'Kg', 'KL').optional().allow('', null),
  transporterName: Joi.string().min(1).required().messages({
    'any.required': 'Transporter name is required',
  }),
  invoiceNo: Joi.string().optional().allow('', null),
  vehicleCapacity: Joi.string().optional().allow('', null),
  rate: Joi.number().positive().optional().allow(null),
  detCharges: Joi.number().positive().optional().allow(null),
  gst: Joi.number().positive().optional().allow(null),
  paidOn: Joi.date().optional().allow(null),
  srNo: Joi.number().integer().positive().optional(),
});

export const updateOutwardMaterialSchema = Joi.object({
  outwardEntryId: Joi.string().uuid().optional().allow('', null),
  date: Joi.date().optional().allow(null),
  cementCompany: Joi.string().optional().allow('', null),
  manifestNo: Joi.string().optional().allow('', null),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().optional().allow('', null),
  quantity: Joi.number().positive().optional().allow(null),
  unit: Joi.string().valid('MT', 'Kg', 'KL').optional().allow('', null),
  transporterName: Joi.string().min(1).optional(),
  invoiceNo: Joi.string().optional().allow('', null),
  vehicleCapacity: Joi.string().optional().allow('', null),
  rate: Joi.number().positive().optional().allow(null),
  detCharges: Joi.number().positive().optional().allow(null),
  gst: Joi.number().positive().optional().allow(null),
  paidOn: Joi.date().optional().allow(null),
});

// Outward Entry validation schemas
export const createOutwardEntrySchema = Joi.object({
  date: Joi.date().required().messages({
    'any.required': 'Date is required',
  }),
  cementCompany: Joi.string().min(1).required().messages({
    'any.required': 'Cement company is required',
  }),
  manifestNo: Joi.string().min(1).required().messages({
    'any.required': 'Manifest number is required',
  }),
  transporterId: Joi.string().uuid().optional().allow('', null),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().optional().allow('', null),
  quantity: Joi.number().required().messages({
    'any.required': 'Quantity is required',
  }),
  unit: Joi.string().valid('MT', 'Kg', 'KL').required().messages({
    'any.only': 'Unit must be MT, Kg, or KL',
    'any.required': 'Unit is required',
  }),
  month: Joi.string().optional().allow('', null),
  location: Joi.string().optional().allow('', null),
  packing: Joi.string().optional().allow('', null),
  rate: Joi.number().optional().allow(null),
  amount: Joi.number().optional().allow(null),
  gst: Joi.number().optional().allow(null),
  grossAmount: Joi.number().optional().allow(null),
  vehicleCapacity: Joi.string().optional().allow('', null),
  detCharges: Joi.number().optional().allow(null),
  paidOn: Joi.date().optional().allow(null),
  dueOn: Joi.date().optional().allow(null),
  srNo: Joi.number().integer().positive().optional(),
  invoiceNo: Joi.string().optional().allow('', null),
});

export const updateOutwardEntrySchema = Joi.object({
  date: Joi.date().optional(),
  cementCompany: Joi.string().min(1).optional(),
  manifestNo: Joi.string().min(1).optional(),
  transporterId: Joi.string().uuid().optional().allow('', null),
  vehicleNo: Joi.string().optional().allow('', null),
  wasteName: Joi.string().optional().allow('', null),
  quantity: Joi.number().optional(),
  unit: Joi.string().valid('MT', 'Kg', 'KL').optional(),
  month: Joi.string().optional().allow('', null),
  location: Joi.string().optional().allow('', null),
  packing: Joi.string().optional().allow('', null),
  rate: Joi.number().optional().allow(null),
  amount: Joi.number().optional().allow(null),
  gst: Joi.number().optional().allow(null),
  grossAmount: Joi.number().optional().allow(null),
  vehicleCapacity: Joi.string().optional().allow('', null),
  detCharges: Joi.number().optional().allow(null),
  paidOn: Joi.date().optional().allow(null),
  dueOn: Joi.date().optional().allow(null),
  invoiceNo: Joi.string().optional().allow('', null),
});

// Invoice validation schemas
export const createInvoiceSchema = Joi.object({
  type: Joi.string().valid('Inward', 'Outward', 'Transporter').required().messages({
    'any.only': 'Invoice type must be Inward, Outward, or Transporter',
    'any.required': 'Invoice type is required',
  }),
  date: Joi.date().required().messages({
    'any.required': 'Invoice date is required',
  }),
  companyId: Joi.string().uuid().optional().allow('', null),
  transporterId: Joi.string().uuid().optional().allow('', null),
  customerName: Joi.string().max(200).optional().allow('', null),
  materials: Joi.array().items(
    Joi.object({
      materialName: Joi.string().required(),
      rate: Joi.number().positive().optional().allow(null),
      unit: Joi.string().optional().allow('', null),
      quantity: Joi.number().positive().optional().allow(null),
      amount: Joi.number().positive().optional().allow(null),
      manifestNo: Joi.string().optional().allow('', null),
      description: Joi.string().optional().allow('', null),
    })
  ).optional().default([]),
  manifestNos: Joi.array().items(Joi.string()).optional().default([]),
  inwardEntryIds: Joi.array().items(Joi.string().uuid()).optional().default([]),
  outwardEntryIds: Joi.array().items(Joi.string().uuid()).optional().default([]),
  subtotal: Joi.number().positive().optional(),
  cgstRate: Joi.number().min(0).max(100).optional(),
  sgstRate: Joi.number().min(0).max(100).optional(),
  paymentReceived: Joi.number().min(0).optional().default(0),
  paymentReceivedOn: Joi.date().optional().allow(null),
  gstNo: Joi.string().max(15).optional().allow('', null),
  billedTo: Joi.string().max(500).optional().allow('', null),
  shippedTo: Joi.string().max(500).optional().allow('', null),
  description: Joi.string().required(),
  additionalCharges: Joi.number().min(0).optional().default(0),
  additionalChargesDescription: Joi.string().optional().allow('', null),
});

export const updateInvoiceSchema = Joi.object({
  date: Joi.date().optional(),
  customerName: Joi.string().max(200).optional().allow('', null),
  materials: Joi.array().items(
    Joi.object({
      materialName: Joi.string().required(),
      rate: Joi.number().positive().optional().allow(null),
      unit: Joi.string().optional().allow('', null),
      quantity: Joi.number().positive().optional().allow(null),
      amount: Joi.number().positive().optional().allow(null),
      manifestNo: Joi.string().optional().allow('', null),
      description: Joi.string().optional().allow('', null),
    })
  ).optional().allow(null),
  manifestNos: Joi.array().items(Joi.string()).optional().allow(null),
  inwardEntryIds: Joi.array().items(Joi.string().uuid()).optional().allow(null),
  subtotal: Joi.number().positive().optional(),
  cgstRate: Joi.number().min(0).max(100).optional(),
  sgstRate: Joi.number().min(0).max(100).optional(),
  paymentReceived: Joi.number().min(0).optional().allow(null),
  paymentReceivedOn: Joi.date().optional().allow(null),
  gstNo: Joi.string().max(15).optional().allow('', null),
  billedTo: Joi.string().max(500).optional().allow('', null),
  shippedTo: Joi.string().max(500).optional().allow('', null),
  description: Joi.string().optional().allow('', null),
  additionalCharges: Joi.number().min(0).optional().allow(null),
  additionalChargesDescription: Joi.string().optional().allow('', null),
});

export const updateInvoicePaymentSchema = Joi.object({
  paymentReceived: Joi.number().min(0).required().messages({
    'any.required': 'Payment received amount is required',
    'number.min': 'Payment received cannot be negative',
  }),
  paymentReceivedOn: Joi.date().optional().allow(null),
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      console.log(`[Validation Error] Path: ${req.path}, Body:`, JSON.stringify(req.body, null, 2));
      console.log('[Validation Error] Details:', JSON.stringify(error.details, null, 2));
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};
