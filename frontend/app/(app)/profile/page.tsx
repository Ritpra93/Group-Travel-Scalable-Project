/**
 * Profile Page
 * User profile management with interests selection
 */

'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Globe, Save, AlertCircle } from 'lucide-react';
import { useMyProfile, useUpdateMyProfile, useInterestCategories } from '@/lib/api/hooks/use-users';
import { InterestSelector } from '@/components/patterns/interest-selector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export default function ProfilePage() {
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useMyProfile();
  const { data: categoriesData, isLoading: isLoadingCategories } = useInterestCategories();
  const updateProfile = useUpdateMyProfile();

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setTimezone(profile.timezone || '');
      setInterests(profile.interests || []);
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const changed =
        name !== (profile.name || '') ||
        bio !== (profile.bio || '') ||
        timezone !== (profile.timezone || '') ||
        JSON.stringify(interests.sort()) !== JSON.stringify((profile.interests || []).sort());
      setHasChanges(changed);
    }
  }, [name, bio, timezone, interests, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    updateProfile.mutate(
      {
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        timezone: timezone.trim() || undefined,
        interests,
      },
      {
        onSuccess: () => {
          setHasChanges(false);
        },
      }
    );
  };

  const isLoading = isLoadingProfile || isLoadingCategories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 border-t-transparent mx-auto mb-4" />
          <p className="text-zinc-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Failed to load profile</h3>
              <p className="mt-1 text-sm text-red-700">
                {(profileError as Error)?.message || 'An error occurred while loading your profile.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Profile Settings</h1>
        <p className="mt-1 text-zinc-500">Manage your profile and interests</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </h2>

          <div className="space-y-4 p-4 bg-zinc-50 rounded-lg">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-zinc-500">Email cannot be changed</p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border border-zinc-200',
                  'focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400',
                  'placeholder:text-zinc-400'
                )}
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={3}
                maxLength={500}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border border-zinc-200',
                  'focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400',
                  'placeholder:text-zinc-400 resize-none'
                )}
              />
              <p className="mt-1 text-xs text-zinc-500 text-right">
                {bio.length}/500 characters
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-zinc-700 mb-1">
                <Globe className="w-4 h-4 inline mr-1" />
                Timezone
              </label>
              <input
                type="text"
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g., America/New_York"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border border-zinc-200',
                  'focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400',
                  'placeholder:text-zinc-400'
                )}
              />
            </div>
          </div>
        </section>

        {/* Interests Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-zinc-900">Travel Interests</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Select interests to help find common activities with your travel groups
            </p>
          </div>

          <div className="p-4 bg-zinc-50 rounded-lg">
            <InterestSelector
              availableInterests={categoriesData?.categories || []}
              selectedInterests={interests}
              onChange={setInterests}
              maxInterests={20}
            />
          </div>
        </section>

        {/* Error Display */}
        {updateProfile.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Failed to update profile</h3>
                <p className="mt-1 text-sm text-red-700">
                  {(updateProfile.error as Error)?.message || 'An error occurred while saving.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {updateProfile.isSuccess && !hasChanges && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">Profile updated successfully!</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-zinc-200">
          {hasChanges && (
            <span className="text-sm text-zinc-500">You have unsaved changes</span>
          )}
          <Button
            type="submit"
            disabled={!hasChanges || updateProfile.isPending}
            loading={updateProfile.isPending}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
