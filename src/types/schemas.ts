import { z } from 'zod';

// ========== AUTH SCHEMAS ==========

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ========== GAS STATION SCHEMAS ==========

export const createStationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  location: z.string().min(1, 'Location is required').max(255),
});

export const updateStationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  location: z.string().min(1).max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export type CreateStationInput = z.infer<typeof createStationSchema>;
export type UpdateStationInput = z.infer<typeof updateStationSchema>;

// ========== PUMP SCHEMAS ==========

export const createPumpSchema = z.object({
  pumpNumber: z.number().int().positive('Pump number must be positive'),
  mainRfidTag: z.string().min(1, 'Main RFID tag is required'),
  expectedChildTags: z.array(
    z.object({
      tagId: z.string().min(1, 'Tag ID is required'),
      description: z.string().optional(),
    })
  ).min(1, 'At least one expected child tag is required'),
});

export const updatePumpSchema = z.object({
  pumpNumber: z.number().int().positive().optional(),
  mainRfidTag: z.string().min(1).optional(),
  status: z.enum(['LOCKED', 'OPEN', 'BROKEN']).optional(),
});

export type CreatePumpInput = z.infer<typeof createPumpSchema>;
export type UpdatePumpInput = z.infer<typeof updatePumpSchema>;

// ========== VERIFICATION SCHEMAS ==========

export const verifyRfidSchema = z.object({
  mainTagScanned: z.string().min(1, 'Main tag is required'),
  scannedChildTags: z.array(z.string()).min(0, 'Scanned child tags must be an array'),
});

export type VerifyRfidInput = z.infer<typeof verifyRfidSchema>;

// ========== QUERY SCHEMAS ==========

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const stationQuerySchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'all']).optional(),
  search: z.string().optional(),
});

export const verificationQuerySchema = paginationSchema.extend({
  result: z.enum(['SUCCESS', 'FAILED', 'ERROR', 'all']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type StationQuery = z.infer<typeof stationQuerySchema>;
export type VerificationQuery = z.infer<typeof verificationQuerySchema>;
