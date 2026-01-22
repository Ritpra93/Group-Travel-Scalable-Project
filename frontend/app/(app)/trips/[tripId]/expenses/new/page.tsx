/**
 * Create Expense Page
 * Multi-step form for creating a new expense
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTrip } from '@/lib/api/hooks/use-trips';
import { useGroupMembers } from '@/lib/api/hooks/use-groups';
import { useCreateExpense } from '@/lib/api/hooks/use-expenses';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ExpenseForm } from '@/components/patterns/expense-form';
import type { CreateExpenseFormData } from '@/lib/schemas/expenses.schema';

// ============================================================================
// Page Component
// ============================================================================

export default function NewExpensePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Fetch trip data
  const { data: trip, isLoading: tripLoading, error: tripError } = useTrip(tripId);

  // Fetch group members for split selection
  const {
    data: members,
    isLoading: membersLoading,
  } = useGroupMembers(trip?.groupId || '');

  // Create expense mutation
  const createExpense = useCreateExpense(tripId);

  // Loading state
  if (tripLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400">
        Loading...
      </div>
    );
  }

  // Error state
  if (tripError || !trip) {
    return (
      <div className="h-screen flex items-center justify-center">
        <EmptyState
          title="Trip not found"
          description="The trip you're looking for doesn't exist."
          action={{
            label: 'Go to Trips',
            onClick: () => router.push('/trips'),
          }}
        />
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = (data: CreateExpenseFormData & { tripId: string }) => {
    createExpense.mutate({
      tripId: data.tripId,
      title: data.title,
      description: data.description || undefined,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      paidAt: data.paidAt,
      receiptUrl: data.receiptUrl || undefined,
      splitType: data.splitType,
      splitWith: data.splitWith,
      customSplits: data.customSplits,
    });
  };

  // Transform members for form
  const formMembers = members?.map((m) => ({
    userId: m.userId,
    user: m.user,
  })) || [];

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/trips/${tripId}/expenses`}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">Add Expense</h1>
              <p className="text-sm text-zinc-500">{trip.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 pt-8">
        {membersLoading ? (
          <div className="text-center py-12 text-zinc-400">
            Loading group members...
          </div>
        ) : formMembers.length === 0 ? (
          <EmptyState
            title="No group members"
            description="Cannot create an expense without group members."
            action={{
              label: 'Back to Trip',
              onClick: () => router.push(`/trips/${tripId}`),
            }}
          />
        ) : (
          <ExpenseForm
            tripId={tripId}
            members={formMembers}
            currentUserId={user?.id || ''}
            onSubmit={handleSubmit}
            isSubmitting={createExpense.isPending}
          />
        )}

        {/* Error message */}
        {createExpense.isError && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            Failed to create expense. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
