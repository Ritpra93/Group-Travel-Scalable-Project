/**
 * Uploads Routes
 * File upload endpoints
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../middleware/asyncHandler.middleware';
import { uploadsController } from './uploads.controller';
import { MAX_FILE_SIZE } from './uploads.types';

// ============================================================================
// Multer Configuration
// ============================================================================

// Use memory storage - file is kept in buffer, not written to disk
// This allows us to process with sharp before saving
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ============================================================================
// Router
// ============================================================================

const router = Router();

/**
 * @route   POST /api/v1/uploads/image
 * @desc    Upload an image
 * @access  Private
 */
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  asyncHandler(uploadsController.uploadImage.bind(uploadsController))
);

/**
 * @route   DELETE /api/v1/uploads/:filename
 * @desc    Delete an uploaded image
 * @access  Private
 */
router.delete(
  '/:filename',
  authenticate,
  asyncHandler(uploadsController.deleteImage.bind(uploadsController))
);

export default router;
