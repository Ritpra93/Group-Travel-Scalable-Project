/**
 * Conditional Navigation Component
 * Shows Navigation only on the homepage
 */

'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './Navigation';

export function ConditionalNavigation() {
  const pathname = usePathname();

  // Only show Navigation on homepage
  if (pathname === '/') {
    return <Navigation />;
  }

  return null;
}
