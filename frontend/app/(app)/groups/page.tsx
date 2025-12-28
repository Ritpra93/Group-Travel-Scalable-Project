/**
 * Groups List Page
 * Browse and search all groups
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { useGroups } from '@/lib/api/hooks/use-groups';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { GroupCard } from '@/components/patterns/group-card';

// ============================================================================
// Groups Page Component
// ============================================================================

export default function GroupsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  // Fetch groups with search filter
  const { data, isLoading, error } = useGroups({
    search: search || undefined,
  });

  // data is a PaginatedResponse with data and pagination properties
  const groups = data?.data || [];
  const hasGroups = groups.length > 0;
  const isSearching = search.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-dark">Groups</h1>
          <p className="text-stone-600 mt-1">
            Manage your travel crews and adventure squads
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/groups/new')}
          className="gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Group
        </Button>
      </div>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search groups..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onClear={() => setSearch('')}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-xl bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">
            Failed to load groups. Please try again.
          </p>
        </div>
      )}

      {/* Empty State - No Groups */}
      {!isLoading && !error && !hasGroups && !isSearching && (
        <EmptyState
          icon={Users}
          title="No groups yet"
          description="Create your first group to start planning adventures with your crew."
          action={{
            label: 'Create Your First Group',
            onClick: () => router.push('/groups/new'),
          }}
        />
      )}

      {/* Empty State - No Search Results */}
      {!isLoading && !error && !hasGroups && isSearching && (
        <EmptyState
          icon={Users}
          title="No groups found"
          description={`No groups match "${search}". Try a different search term.`}
          action={{
            label: 'Clear Search',
            onClick: () => setSearch(''),
          }}
        />
      )}

      {/* Groups Grid */}
      {!isLoading && !error && hasGroups && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {!isLoading && !error && hasGroups && data && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <p className="text-sm text-stone-600">
            Showing {groups.length} of {data.pagination?.total || groups.length} groups
          </p>
        </div>
      )}
    </div>
  );
}
