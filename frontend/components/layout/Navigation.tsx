'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Sign In' },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2 font-serif text-2xl font-bold transition-colors"
            >
              <span className={cn(
                'transition-colors duration-300',
                isScrolled ? 'text-[var(--color-deep-ocean)]' : 'text-white'
              )}>
                Wanderlust
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative font-medium transition-colors duration-300 hover:text-[var(--color-sunset-orange)]',
                    isScrolled ? 'text-gray-700' : 'text-white'
                  )}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[var(--color-sunset-orange)] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <button
                className={cn(
                  'hidden items-center gap-2 rounded-full px-4 py-2 transition-all duration-300 lg:flex',
                  isScrolled
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                )}
                aria-label="Change language"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">EN</span>
              </button>

              {/* Get Started Button */}
              <Link
                href="/register"
                className="hidden rounded-full bg-gradient-to-r from-[var(--color-sky-blue)] to-[var(--color-sunset-orange)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/50 lg:block"
              >
                Get Started
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={cn(
                  'rounded-lg p-2 transition-colors lg:hidden',
                  isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                )}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-40 bg-white shadow-xl lg:hidden"
          >
            <div className="flex flex-col px-6 py-8">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block border-b border-gray-100 py-4 font-medium text-gray-700 transition-colors hover:text-[var(--color-sunset-orange)]"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-6 flex flex-col gap-3">
                <button className="flex items-center justify-center gap-2 rounded-full bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700">
                  <Globe className="h-4 w-4" />
                  English
                </button>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-gradient-to-r from-[var(--color-sky-blue)] to-[var(--color-sunset-orange)] px-6 py-3 text-center text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
