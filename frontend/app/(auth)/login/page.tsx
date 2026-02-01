/**
 * Login Page
 * User authentication with email and password
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useLogin } from '@/lib/api/hooks/use-auth';
import { loginSchema, type LoginFormData } from '@/lib/schemas/auth.schema';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome back
        </h1>
        <p className="text-gray-500">
          Sign in to continue planning your adventures
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">
            {error.message || 'Invalid email or password. Please try again.'}
          </p>
        </div>
      )}

      {/* Login Form */}
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

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
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
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
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
          {isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Register Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
