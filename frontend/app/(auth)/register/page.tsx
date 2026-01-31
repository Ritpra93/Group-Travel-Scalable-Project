/**
 * Register Page
 * New user registration with form validation
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRegister } from '@/lib/api/hooks/use-auth';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth.schema';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const { mutate: register, isPending, error } = useRegister();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    register(data);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Create your account
        </h1>
        <p className="text-gray-500">
          Get started with collaborative trip planning
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">
            {error.message || 'Registration failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Alex Rivera"
            className={`
              w-full h-12 rounded-lg border px-4 text-base
              transition-all duration-200
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400
              ${errors.name ? 'border-red-500' : 'border-gray-200'}
            `}
            {...registerField('name')}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

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
            {...registerField('email')}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Password
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
            {...registerField('password')}
          />
          <p className="mt-1.5 text-sm text-gray-500">
            At least 8 characters with letters and numbers
          </p>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
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
          {isPending ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
