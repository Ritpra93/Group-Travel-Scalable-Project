/**
 * App Layout
 * Layout for authenticated app pages (dashboard, groups, trips)
 * Features sidebar navigation and app header
 */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLogout } from '@/lib/api/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Trips', href: '/trips', icon: MapPin },
    { name: 'Invitations', href: '/invitations', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link
            href="/dashboard"
            className="font-serif text-2xl font-bold text-primary"
          >
            Wanderlust
          </Link>

          {/* User menu */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-stone-600">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 w-64 transform border-r border-stone-200 bg-white transition-transform lg:static lg:translate-x-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <nav className="mt-8 space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-stone-700 hover:bg-stone-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-dark/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
