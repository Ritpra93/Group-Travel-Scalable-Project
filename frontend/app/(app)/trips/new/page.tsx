/**
 * Create Trip Page
 * Multi-step wizard for creating a new trip
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useCreateTrip } from '@/lib/api/hooks/use-trips';
import { useGroups } from '@/lib/api/hooks/use-groups';
import {
  createTripSchema,
  type CreateTripFormData,
} from '@/lib/schemas/trips.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// Create Trip Page Component
// ============================================================================

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Trip name and destination' },
  { id: 2, name: 'Dates & Budget', description: 'When and how much' },
  { id: 3, name: 'Group', description: 'Select your travel crew' },
];

export default function CreateTripPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const { mutate: createTrip, isPending, error } = useCreateTrip();
  const { data: groupsData } = useGroups();
  const groups = groupsData?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    mode: 'onChange',
  });

  // Validate current step before proceeding
  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof CreateTripFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['name', 'destination', 'description'];
        break;
      case 2:
        fieldsToValidate = ['startDate', 'endDate', 'budget'];
        break;
      case 3:
        fieldsToValidate = ['groupId'];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: CreateTripFormData) => {
    createTrip(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
          Create New Trip
        </h1>
        <p className="text-stone-600 mt-1">
          Plan your next adventure in a few simple steps
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep > step.id
                    ? 'bg-primary text-white'
                    : currentStep === step.id
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="text-center mt-2">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-dark' : 'text-stone-500'
                  }`}
                >
                  {step.name}
                </p>
                <p className="text-xs text-stone-400 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors ${
                  currentStep > step.id ? 'bg-primary' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1]?.name || 'Step'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">
                  {error instanceof Error
                    ? error.message
                    : 'Failed to create trip. Please try again.'}
                </p>
              </div>
            )}

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <Input
                  label="Trip Name"
                  placeholder="Weekend in Paris, Summer Road Trip..."
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Destination"
                  placeholder="Paris, France"
                  required
                  error={errors.destination?.message}
                  {...register('destination')}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark">
                    Description
                    <span className="text-stone-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    placeholder="Tell your crew about this adventure..."
                    rows={5}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <Input
                  label="Image URL"
                  placeholder="https://images.unsplash.com/..."
                  type="url"
                  helperText="Optional: Add a cover image for your trip"
                  error={errors.imageUrl?.message}
                  {...register('imageUrl')}
                />
              </div>
            )}

            {/* Step 2: Dates & Budget */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    required
                    error={errors.startDate?.message}
                    {...register('startDate')}
                  />

                  <Input
                    label="End Date"
                    type="date"
                    required
                    error={errors.endDate?.message}
                    {...register('endDate')}
                  />
                </div>

                <Input
                  label="Budget"
                  type="number"
                  placeholder="1000"
                  helperText="Optional: Estimated budget per person in USD"
                  error={errors.budget?.message}
                  {...register('budget', { valueAsNumber: true })}
                />

                {watch('startDate') && watch('endDate') && (
                  <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
                    <p className="text-sm text-stone-700">
                      <span className="font-medium">Duration:</span>{' '}
                      {Math.ceil(
                        (new Date(watch('endDate')).getTime() -
                          new Date(watch('startDate')).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{' '}
                      days
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Group Selection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark">
                    Select Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                    {...register('groupId')}
                  >
                    <option value="">Choose a group...</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {errors.groupId && (
                    <p className="text-sm text-red-600">
                      {errors.groupId.message}
                    </p>
                  )}
                </div>

                {groups.length === 0 && (
                  <div className="rounded-lg bg-golden/10 border border-golden/20 p-4">
                    <p className="text-sm text-dark">
                      You don't have any groups yet.{' '}
                      <button
                        type="button"
                        onClick={() => router.push('/groups/new')}
                        className="text-primary font-medium hover:underline"
                      >
                        Create a group first
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" variant="primary" onClick={handleNext}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              loading={isPending}
              disabled={groups.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Create Trip
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
