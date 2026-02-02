/**
 * ImageUpload Component
 * File picker with drag-and-drop, preview, and upload functionality
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface ImageUploadProps {
  /** Current image URL */
  value?: string;
  /** Callback when image URL changes */
  onChange: (url: string | undefined) => void;
  /** Upload function - returns the URL of the uploaded image */
  onUpload: (file: File) => Promise<string>;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Aspect ratio for preview (e.g., "16/9", "1/1") */
  aspectRatio?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Error message */
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_MAX_SIZE_MB = 5;

// ============================================================================
// Component
// ============================================================================

export function ImageUpload({
  value,
  onChange,
  onUpload,
  placeholder = 'Click or drag an image to upload',
  disabled = false,
  className,
  aspectRatio = '16/9',
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  error,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file before upload
   */
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a valid image (JPEG, PNG, WebP, or GIF)';
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Maximum size is ${maxSizeMB}MB`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        return;
      }

      setUploadError(null);
      setImageError(false);

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload
      setIsUploading(true);
      try {
        const url = await onUpload(file);
        onChange(url);
        // Keep preview until server image loads (handled by onLoad below)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
        setPreviewUrl(null);
        URL.revokeObjectURL(objectUrl);
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onChange, maxSizeMB]
  );

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, isUploading, handleFile]
  );

  /**
   * Handle drag events
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * Handle click to open file picker
   */
  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  /**
   * Remove current image
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setPreviewUrl(null);
    setUploadError(null);
    setImageError(false);
  };

  // Only show URL if it's a valid non-empty string
  const displayUrl = previewUrl || (value && value.trim() !== '' ? value : null);
  const displayError = error || uploadError;

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed transition-all cursor-pointer',
          'flex items-center justify-center',
          isDragging && 'border-zinc-900 bg-zinc-50',
          !isDragging && !displayUrl && 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/50',
          displayUrl && 'border-transparent',
          disabled && 'opacity-50 cursor-not-allowed',
          isUploading && 'cursor-wait'
        )}
        style={{ aspectRatio }}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* Preview Image */}
        {displayUrl && !imageError && (
          <Image
            src={displayUrl}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={displayUrl.startsWith('blob:') || displayUrl.includes('localhost')}
            onError={() => {
              setImageError(true);
              setUploadError('Failed to load image');
            }}
          />
        )}

        {/* Upload State Overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-2 text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-sm font-medium">Uploading...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!displayUrl && !isUploading && (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isDragging ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
              )}
            >
              {isDragging ? (
                <Upload className="w-6 h-6" />
              ) : (
                <ImageIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700">
                {isDragging ? 'Drop image here' : placeholder}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                JPEG, PNG, WebP, or GIF (max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        )}

        {/* Remove Button */}
        {displayUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'absolute top-2 right-2 p-1.5 rounded-full',
              'bg-black/50 text-white hover:bg-black/70',
              'transition-colors'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {displayError && (
        <p className="mt-2 text-sm text-red-600">{displayError}</p>
      )}
    </div>
  );
}
