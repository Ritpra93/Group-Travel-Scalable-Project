/**
 * Uploads Service
 * Handles file validation, optimization, and storage
 */

import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_DIMENSION,
  type UploadResponse,
  type UploadImageQuery,
} from './uploads.types';
import { ValidationError } from '../../common/utils/errors';

// ============================================================================
// Configuration
// ============================================================================

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const BASE_URL = process.env.API_URL || 'http://localhost:4000';

// ============================================================================
// Service
// ============================================================================

class UploadsService {
  /**
   * Ensure the uploads directory exists
   */
  async ensureUploadsDir(): Promise<void> {
    try {
      await fs.access(UPLOADS_DIR);
    } catch {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    }
  }

  /**
   * Validate an uploaded file
   */
  validateFile(file: Express.Multer.File): void {
    // Check file exists
    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype as typeof ALLOWED_IMAGE_TYPES[number])) {
      throw new ValidationError(
        `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }
  }

  /**
   * Process and save an image
   * - Resizes to max dimensions
   * - Converts to WebP for optimization
   * - Saves to disk
   */
  async processAndSaveImage(
    file: Express.Multer.File,
    options: UploadImageQuery = {}
  ): Promise<UploadResponse> {
    await this.ensureUploadsDir();

    const { maxWidth = MAX_IMAGE_DIMENSION, maxHeight = MAX_IMAGE_DIMENSION, quality = 80 } = options;

    // Generate unique filename
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Process image with sharp
    await sharp(file.buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ quality })
      .toFile(filepath);

    // Get file stats
    const stats = await fs.stat(filepath);

    return {
      url: `${BASE_URL}/uploads/${filename}`,
      filename,
      originalName: file.originalname,
      size: stats.size,
      mimeType: 'image/webp',
    };
  }

  /**
   * Delete an uploaded file
   */
  async deleteFile(filename: string): Promise<void> {
    const filepath = path.join(UPLOADS_DIR, filename);

    try {
      await fs.access(filepath);
      await fs.unlink(filepath);
    } catch {
      // File doesn't exist, nothing to delete
    }
  }

  /**
   * Get file path from URL
   */
  getFilenameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      if (pathname.startsWith('/uploads/')) {
        return pathname.replace('/uploads/', '');
      }

      return null;
    } catch {
      return null;
    }
  }
}

export const uploadsService = new UploadsService();
