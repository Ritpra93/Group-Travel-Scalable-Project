/**
 * Hero Image Component
 * Reusable hero section with background image and overlay content
 */

'use client';

import { type ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface HeroImageProps {
  src?: string;
  query?: string; // Unsplash query if no src
  alt: string;
  height?: string; // h-screen, h-96, etc.
  overlay?: 'dark' | 'light' | 'gradient';
  children?: ReactNode;
  className?: string;
}

// ============================================================================
// Hero Image Component
// ============================================================================

export function HeroImage({
  src,
  query = 'mountains,travel,landscape',
  alt,
  height = 'h-screen',
  overlay = 'gradient',
  children,
  className,
}: HeroImageProps) {
  // Use a high-quality Unsplash image URL - source.unsplash.com is deprecated
  // Using a specific beautiful landscape image as default
  const imageUrl = src || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&q=80';

  return (
    <div className={cn('relative w-full overflow-hidden bg-slate-900', height, className)}>
      {/* Background Image */}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="100vw"
        priority
        quality={90}
        unoptimized
      />

      {/* Overlay */}
      {overlay && (
        <div
          className={cn(
            'absolute inset-0',
            overlay === 'dark' && 'bg-black/50',
            overlay === 'light' && 'bg-white/30',
            overlay === 'gradient' &&
              'bg-gradient-to-b from-black/60 via-black/40 to-black/70'
          )}
        />
      )}

      {/* Content */}
      {children && (
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
