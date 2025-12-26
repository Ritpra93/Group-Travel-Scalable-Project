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
import { Input } from '@/components/ui/input';

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
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-serif text-3xl font-bold text-dark">
          Welcome Back
        </h1>
        <p className="text-stone-600">
          Sign in to continue your adventure
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
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...register('email')}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
          required
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
        >
          {isPending ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-sm text-stone-500">or</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {/* Register Link */}
      <div className="text-center">
        <p className="text-sm text-stone-600">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
