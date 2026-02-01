/**
 * Uploads Hooks
 * React Query hooks for file uploads
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadsService, type UploadResponse } from '../services/uploads.service';

// ============================================================================
// Types
// ============================================================================

interface UploadImageResult {
  /** Upload an image file, returns the URL */
  upload: (file: File) => Promise<string>;
  /** Upload mutation */
  mutation: ReturnType<typeof useMutation<UploadResponse, Error, File>>;
  /** Is currently uploading */
  isUploading: boolean;
  /** Upload error */
  error: Error | null;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for uploading images
 */
export function useUploadImage(): UploadImageResult {
  const queryClient = useQueryClient();

  const mutation = useMutation<UploadResponse, Error, File>({
    mutationFn: uploadsService.uploadImage,
    onSuccess: () => {
      // Optionally invalidate any cached data that might show the image
      // queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const upload = async (file: File): Promise<string> => {
    const result = await mutation.mutateAsync(file);
    return result.url;
  };

  return {
    upload,
    mutation,
    isUploading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for deleting images
 */
export function useDeleteImage() {
  return useMutation<void, Error, string>({
    mutationFn: uploadsService.deleteImage,
  });
}
