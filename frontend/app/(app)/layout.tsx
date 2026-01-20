/**
 * App Layout - Aura Design
 * Collapsible sidebar navigation with contextual sections
 */

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useLogout } from '@/lib/api/hooks/use-auth';
import { cn } from '@/lib/utils/cn';
import {
  LayoutGrid,
  Users,
  Mail,
  Map,
  Wallet,
  MessageSquare,
  MountainSnow,
  LogOut,
} from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();

  // Mock data - replace with real data from API later
  const activeTrip = {
    id: '1',
    name: 'Iceland: Ring Road',
  };

  const recentTrips = [
    { id: '1', name: 'Ring Road \'24' },
    { id: '2', name: 'Kyoto Spring' },
  ];

  const NavLink = ({
    href,
    icon: Icon,
    children,
    badge,
    active,
  }: {
    href: string;
    icon: React.ElementType;
    children: ReactNode;
    badge?: number;
    active?: boolean;
  }) => {
    const isActive = active !== undefined ? active : pathname === href;

    return (
      <Link
        href={href}
        className={cn(
          'flex items-center lg:gap-3 p-2 rounded-md transition-colors group justify-center lg:justify-start relative',
          isActive
            ? 'text-zinc-900 bg-zinc-100'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
        )}
      >
        <div className="relative">
          <Icon
            className={cn(
              'w-5 h-5',
              isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'
            )}
          />
          {badge && badge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-500 rounded-full border border-white" />
          )}
        </div>
        <span className="font-medium text-sm hidden lg:block">{children}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside data-testid="sidebar" className="w-[70px] lg:w-64 bg-zinc-50/80 backdrop-blur-xl border-r border-zinc-100/50 flex flex-col transition-all duration-300 z-30 fixed h-full">
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-zinc-100">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-zinc-900/20">
            <MountainSnow className="w-4 h-4" />
          </div>
          <span className="ml-3 font-semibold tracking-tight hidden lg:block text-zinc-900">
            Wanderlust
          </span>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {/* Workspace Section */}
          <div className="mb-6">
            <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2 hidden lg:block">
              Workspace
            </p>
            <NavLink href="/dashboard" icon={LayoutGrid}>
              Dashboard
            </NavLink>
            <NavLink href="/groups" icon={Users}>
              Groups
            </NavLink>
            <NavLink href="/invitations" icon={Mail} badge={1}>
              Invitations
            </NavLink>
          </div>

          {/* Current Trip Section */}
          {activeTrip && (
            <div className="mb-6">
              <div className="flex items-center justify-between px-3 mb-2 hidden lg:flex">
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                  Current Trip
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              </div>
              <NavLink href={`/trips/${activeTrip.id}`} icon={Map} active>
                Overview
              </NavLink>
              <NavLink href={`/trips/${activeTrip.id}/budget`} icon={Wallet}>
                Budget
              </NavLink>
              <NavLink href={`/trips/${activeTrip.id}/chat`} icon={MessageSquare} badge={2}>
                Chat
              </NavLink>
            </div>
          )}

          {/* My Trips List */}
          <div className="hidden lg:block">
            <p className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
              My Trips
            </p>
            {recentTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="flex items-center gap-3 px-3 py-2 text-zinc-900 rounded-md transition-colors hover:bg-zinc-50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                <span className="font-medium text-sm">{trip.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 rounded-md hover:bg-zinc-50 p-2 cursor-pointer group relative">
            <div className="w-8 h-8 rounded-full border border-zinc-200 bg-zinc-100 flex items-center justify-center text-zinc-600 grayscale group-hover:grayscale-0 transition-all">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 hidden lg:block">
              <p className="text-sm font-medium text-zinc-900">{user?.name || 'User'}</p>
              <p className="text-[10px] text-zinc-500">{user?.email || 'user@example.com'}</p>
            </div>
            <button
              onClick={() => logout()}
              className="hidden lg:flex text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 main-with-sidebar-offset"
      >
        {children}
      </main>
    </div>
  );
}
