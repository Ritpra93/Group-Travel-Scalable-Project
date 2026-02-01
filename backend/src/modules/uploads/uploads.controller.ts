/**
 * Uploads Controller
 * Handles HTTP requests for file uploads
 */

import { Request, Response, NextFunction } from 'express';
import { uploadsService } from './uploads.service';
import { uploadImageQuerySchema } from './uploads.types';

class UploadsController {
  /**
   * Upload an image
   * POST /api/v1/uploads/image
   */
  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;

      // Validate file
      uploadsService.validateFile(file!);

      // Parse query options
      const options = uploadImageQuerySchema.parse(req.query);

      // Process and save
      const result = await uploadsService.processAndSaveImage(file!, options);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an uploaded file
   * DELETE /api/v1/uploads/:filename
   */
  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.params;

      await uploadsService.deleteFile(filename);

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadsController = new UploadsController();
