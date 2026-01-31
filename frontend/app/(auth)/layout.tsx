/**
 * Auth Layout
 * Split-screen layout for authentication pages (login, register)
 * Left panel: Hero image with overlay text
 * Right panel: Form content
 */

'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Hero content configuration for each auth page
const heroContent = {
  login: {
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073',
    headline: 'Plan Your Next Adventure Together',
    subtext: 'Collaborate with friends, track expenses, and create unforgettable memories',
  },
  register: {
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070',
    headline: 'Start Your Journey',
    subtext: 'Join thousands of travelers planning their dream trips together',
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';
  const content = isLogin ? heroContent.login : heroContent.register;

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative"
        data-testid="hero-panel"
      >
        <Image
          src={content.image}
          alt="Travel destination"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero text content */}
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            {content.headline}
          </h2>
          <p className="text-lg opacity-90 max-w-md">
            {content.subtext}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white"
        data-testid="form-panel"
      >
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <Link
            href="/"
            className="block text-center text-2xl font-semibold text-gray-900 mb-10"
          >
            Navio
          </Link>

          {/* Form content from child pages */}
          {children}

          {/* Help link */}
          <div className="mt-8 text-center">
            <button
              type="button"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-sm hover:bg-gray-200 transition-colors"
              aria-label="Help"
            >
              ?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
