/**
 * Create Group Page
 * Form for creating a new group
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateGroup } from '@/lib/api/hooks/use-groups';
import { useUploadImage } from '@/lib/api/hooks/use-uploads';
import {
  createGroupSchema,
  type CreateGroupFormData,
} from '@/lib/schemas/groups.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// Create Group Page Component
// ============================================================================

export default function CreateGroupPage() {
  const router = useRouter();
  const { mutate: createGroup, isPending, error } = useCreateGroup();
  const { upload: uploadImage } = useUploadImage();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema) as any,
  });

  const imageUrl = watch('imageUrl');

  const onSubmit = (data: CreateGroupFormData) => {
    createGroup(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-serif font-bold text-dark">
          Create New Group
        </h1>
        <p className="text-stone-600 mt-1">
          Start a new travel crew for your next adventure
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">
                  {error instanceof Error
                    ? error.message
                    : 'Failed to create group. Please try again.'}
                </p>
              </div>
            )}

            {/* Group Name */}
            <Input
              label="Group Name"
              placeholder="Weekend Warriors, Beach Buddies, Mountain Crew..."
              required
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-dark">
                Description
                <span className="text-stone-400 font-normal ml-1">
                  (optional)
                </span>
              </label>
              <textarea
                placeholder="What's this group all about?"
                rows={4}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-dark">
                Cover Image
                <span className="text-stone-400 font-normal ml-1">
                  (optional)
                </span>
              </label>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setValue('imageUrl', url || '')}
                onUpload={uploadImage}
                placeholder="Click or drag an image to upload"
                aspectRatio="16/9"
                error={errors.imageUrl?.message}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                loading={isPending}
                fullWidth
              >
                Create Group
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
