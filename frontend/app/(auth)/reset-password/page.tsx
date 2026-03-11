/**
 * Reset Password Page
 * Set a new password using a reset token from email
 */

'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useResetPassword } from '@/lib/api/hooks/use-auth';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/schemas/auth.schema';
import { Button } from '@/components/ui/button';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { mutate: resetPassword, isPending, error, isSuccess } = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) return;
    resetPassword({ token, password: data.password });
  };

  // No token in URL
  if (!token) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Invalid Reset Link
          </h1>
        </div>

        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">
            This password reset link is invalid. Please request a new one.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            <Link
              href="/forgot-password"
              className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Request a new reset link
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Set a new password
        </h1>
        <p className="text-gray-500">
          Choose a strong password to secure your account
        </p>
      </div>

      {/* Success State */}
      {isSuccess ? (
        <div>
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              <Link
                href="/login"
                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Go to Sign In
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Error Alert */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">
                {error.message || 'Something went wrong. Please try again.'}
              </p>
            </div>
          )}

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className={`
                  w-full h-12 rounded-lg border px-4 text-base
                  transition-all duration-200
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400
                  ${errors.password ? 'border-red-500' : 'border-gray-200'}
                `}
                {...register('password')}
              />
              {errors.password ? (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.password.message}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-gray-400">
                  At least 8 characters with letters and numbers
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={`
                  w-full h-12 rounded-lg border px-4 text-base
                  transition-all duration-200
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400
                  ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}
                `}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isPending}
              className="mt-2"
            >
              {isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Remember your password?{' '}
              <Link
                href="/login"
                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
