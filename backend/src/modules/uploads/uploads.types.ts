/**
 * Uploads Module Types
 * Zod schemas and TypeScript interfaces for file uploads
 */

import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const MAX_IMAGE_DIMENSION = 1200; // Max width/height in pixels

// ============================================================================
// Response Types
// ============================================================================

export interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const uploadImageQuerySchema = z.object({
  // Optional resize parameters
  maxWidth: z.coerce.number().positive().max(2000).optional(),
  maxHeight: z.coerce.number().positive().max(2000).optional(),
  quality: z.coerce.number().min(1).max(100).optional().default(80),
});

export type UploadImageQuery = z.infer<typeof uploadImageQuerySchema>;
