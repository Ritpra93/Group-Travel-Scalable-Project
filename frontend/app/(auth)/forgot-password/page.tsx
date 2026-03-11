/**
 * Forgot Password Page
 * Request a password reset link via email
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForgotPassword } from '@/lib/api/hooks/use-auth';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/schemas/auth.schema';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const { mutate: forgotPassword, isPending, error, isSuccess } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Forgot your password?
        </h1>
        <p className="text-gray-500">
          Enter your email and we&apos;ll send you a link to reset your password
        </p>
      </div>

      {/* Success State */}
      {isSuccess ? (
        <div>
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800">
              If an account with that email exists, a password reset link has been sent. Check your inbox.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              <Link
                href="/login"
                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Back to Sign In
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

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                className={`
                  w-full h-12 rounded-lg border px-4 text-base
                  transition-all duration-200
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400
                  ${errors.email ? 'border-red-500' : 'border-gray-200'}
                `}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.email.message}
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
              {isPending ? 'Sending...' : 'Send Reset Link'}
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
