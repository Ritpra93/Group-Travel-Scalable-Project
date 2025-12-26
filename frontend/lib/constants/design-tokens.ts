/**
 * Wanderlust Design System
 * Centralized design tokens for consistent styling across the application
 */

export const colors = {
  // Primary Colors - Bright & Adventurous
  primary: {
    skyBlue: '#0EA5E9',
    sunsetOrange: '#FB923C',
    deepOcean: '#1E3A8A',
  },

  // Supporting Colors
  supporting: {
    warmSand: '#FEF3C7',
    forestGreen: '#059669',
    coral: '#F87171',
  },

  // Neutrals
  neutral: {
    white: '#FFFFFF',
    lightGray: '#F3F4F6',
    darkGray: '#111827',
  },
} as const;

export const typography = {
  // Font Families
  fonts: {
    display: 'var(--font-playfair)', // Playfair Display for headlines
    body: 'var(--font-inter)', // Inter for body text
  },

  // Font Sizes (mobile-first, then desktop)
  sizes: {
    hero: {
      mobile: '2.5rem', // 40px
      desktop: '5rem', // 80px
    },
    h1: {
      mobile: '2rem', // 32px
      desktop: '3.5rem', // 56px
    },
    h2: {
      mobile: '1.75rem', // 28px
      desktop: '2.5rem', // 40px
    },
    h3: {
      mobile: '1.5rem', // 24px
      desktop: '2rem', // 32px
    },
    body: {
      mobile: '1rem', // 16px
      desktop: '1.125rem', // 18px
    },
    small: {
      mobile: '0.875rem', // 14px
      desktop: '1rem', // 16px
    },
  },

  // Line Heights
  lineHeights: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.75',
  },

  // Font Weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  // Container widths
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Section padding
  section: {
    mobile: '3rem 1.5rem', // 48px vertical, 24px horizontal
    desktop: '6rem 3rem', // 96px vertical, 48px horizontal
  },
} as const;

export const animations = {
  // Transition durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },

  // Easing functions
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
