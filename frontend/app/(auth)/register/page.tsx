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
import { Input } from '@/components/ui/input';

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
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = data;
    register(registerData);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-serif text-3xl font-bold text-dark">
          Start Your Journey
        </h1>
        <p className="text-stone-600">
          Create an account to plan amazing trips
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
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          error={errors.name?.message}
          {...registerField('name')}
          required
        />

        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          {...registerField('email')}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          helperText="Must be at least 8 characters with uppercase, lowercase, and number"
          error={errors.password?.message}
          {...registerField('password')}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...registerField('confirmPassword')}
          required
        />

        {/* Terms and Conditions */}
        <div className="flex items-start gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
          />
          <label htmlFor="terms">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
        >
          {isPending ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-sm text-stone-500">or</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-stone-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
