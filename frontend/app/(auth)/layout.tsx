/**
 * Auth Layout
 * Layout for authentication pages (login, register)
 * Features centered card with mountain background
 */

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070"
          alt="Mountain landscape"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-dark/60 to-dark/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 flex justify-center font-serif text-3xl font-bold text-white"
        >
          Wanderlust
        </Link>

        {/* Auth Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          {children}
        </div>

        {/* Footer Text */}
        <p className="mt-6 text-center text-sm text-white/80">
          Plan your next adventure together
        </p>
      </div>
    </div>
  );
}
