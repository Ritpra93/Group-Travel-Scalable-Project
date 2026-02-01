/**
 * Uploads Service
 * Handles file upload API calls
 */

import { apiClient } from '../client';

// ============================================================================
// Types
// ============================================================================

export interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

// ============================================================================
// Service
// ============================================================================

export const uploadsService = {
  /**
   * Upload an image file
   * @param file - The file to upload
   * @returns Upload response with URL
   */
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post<{ success: boolean; data: UploadResponse }>(
      '/uploads/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data!;
  },

  /**
   * Delete an uploaded image
   * @param filename - The filename to delete
   */
  deleteImage: async (filename: string): Promise<void> => {
    await apiClient.delete(`/uploads/${filename}`);
  },
};
