/**
 * Password Reset E2E Tests
 *
 * Tests the forgot password and reset password user flows.
 * Uses API route mocking to test form behavior, validation,
 * state transitions, and error handling without a running backend.
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Forgot Password Page Tests
// ============================================================================

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/forgot-password');
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({
      content: `* { animation: none !important; transition: none !important; }`,
    });
  });

  test('login page "Forgot password?" link navigates here', async ({ page }) => {
    // Start from login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();

    await forgotLink.click();
    await page.waitForURL('**/forgot-password');

    // Verify we landed on the correct page (scope to form panel to avoid hero heading)
    const heading = page.getByTestId('form-panel').getByRole('heading', { name: /forgot your password/i });
    await expect(heading).toBeVisible();
  });

  test('empty submit shows "Email is required" validation error', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /send reset link/i });
    await submitButton.click();

    const errorMessage = page.getByText('Email is required');
    await expect(errorMessage).toBeVisible();
  });

  test('invalid email is blocked by browser validation', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('notanemail');

    const submitButton = page.getByRole('button', { name: /send reset link/i });
    await submitButton.click();

    // HTML5 email validation prevents form submission — the input should be invalid
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);

    // Form should NOT have been submitted (no success state)
    const successMessage = page.getByText(/password reset link has been sent/i);
    await expect(successMessage).not.toBeVisible();
  });

  test('valid email submission shows success state and hides form', async ({ page }) => {
    // Mock the API to return success
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            message: 'If an account with that email exists, a password reset link has been sent.',
          },
        }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('user@example.com');

    const submitButton = page.getByRole('button', { name: /send reset link/i });
    await submitButton.click();

    // Success message should appear
    const successMessage = page.getByText(/password reset link has been sent/i);
    await expect(successMessage).toBeVisible();

    // Form should be hidden
    await expect(emailInput).not.toBeVisible();
    await expect(submitButton).not.toBeVisible();

    // Back to login link should be visible
    const backLink = page.getByRole('link', { name: /back to sign in/i });
    await expect(backLink).toBeVisible();
  });

  test('API error shows red error alert', async ({ page }) => {
    // Mock API to return an error
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong on the server',
          },
        }),
      });
    });

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('user@example.com');

    const submitButton = page.getByRole('button', { name: /send reset link/i });
    await submitButton.click();

    // Error alert should appear (red background)
    const errorAlert = page.locator('.bg-red-50');
    await expect(errorAlert).toBeVisible();
  });

  test('"Sign In" link navigates back to login', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});

// ============================================================================
// Reset Password Page Tests
// ============================================================================

test.describe('Reset Password Page', () => {
  test.describe('Without token (error state)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/reset-password');
      await page.waitForLoadState('networkidle');
      await page.addStyleTag({
        content: `* { animation: none !important; transition: none !important; }`,
      });
    });

    test('shows error state when no token is in URL', async ({ page }) => {
      const errorMessage = page.getByText(/this password reset link is invalid/i);
      await expect(errorMessage).toBeVisible();

      // Password form should NOT be visible
      const passwordInputs = page.locator('input[type="password"]');
      await expect(passwordInputs).toHaveCount(0);
    });

    test('"Request a new reset link" navigates to forgot-password', async ({ page }) => {
      const resetLink = page.getByRole('link', { name: /request a new reset link/i });
      await expect(resetLink).toBeVisible();

      await resetLink.click();
      await page.waitForURL('**/forgot-password');
      expect(page.url()).toContain('/forgot-password');
    });
  });

  test.describe('With token (form state)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/reset-password?token=test-reset-token');
      await page.waitForLoadState('networkidle');
      await page.addStyleTag({
        content: `* { animation: none !important; transition: none !important; }`,
      });
    });

    test('renders form with two password fields', async ({ page }) => {
      const passwordInputs = page.locator('input[type="password"]');
      await expect(passwordInputs).toHaveCount(2);

      // Scope to form panel to avoid hero heading duplicate
      const heading = page.getByTestId('form-panel').getByRole('heading', { name: /set a new password/i });
      await expect(heading).toBeVisible();

      const submitButton = page.getByRole('button', { name: /reset password/i });
      await expect(submitButton).toBeVisible();
    });

    test('empty submit shows validation errors on both fields', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /reset password/i });
      await submitButton.click();

      const passwordError = page.getByText('Password is required');
      const confirmError = page.getByText('Please confirm your password');

      await expect(passwordError).toBeVisible();
      await expect(confirmError).toBeVisible();
    });

    test('mismatched passwords show "Passwords do not match" error', async ({ page }) => {
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill('SecurePass123');
      await passwordInputs.nth(1).fill('DifferentPass456');

      const submitButton = page.getByRole('button', { name: /reset password/i });
      await submitButton.click();

      const mismatchError = page.getByText('Passwords do not match');
      await expect(mismatchError).toBeVisible();
    });

    test('short password shows length validation error', async ({ page }) => {
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill('ab');
      await passwordInputs.nth(1).fill('ab');

      const submitButton = page.getByRole('button', { name: /reset password/i });
      await submitButton.click();

      const lengthError = page.getByText(/at least 8 characters/i);
      await expect(lengthError).toBeVisible();
    });

    test('successful reset shows success message and hides form', async ({ page }) => {
      // Mock API success
      await page.route('**/api/v1/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { message: 'Password has been reset successfully.' },
          }),
        });
      });

      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill('NewSecurePass123');
      await passwordInputs.nth(1).fill('NewSecurePass123');

      const submitButton = page.getByRole('button', { name: /reset password/i });
      await submitButton.click();

      // Success message should appear
      const successMessage = page.getByText(/password has been reset successfully/i);
      await expect(successMessage).toBeVisible();

      // Form should be hidden
      await expect(passwordInputs.nth(0)).not.toBeVisible();
      await expect(submitButton).not.toBeVisible();

      // Redirect text should be visible
      const redirectText = page.getByText(/redirecting to login/i);
      await expect(redirectText).toBeVisible();
    });

    test('expired token API error shows red error alert with message', async ({ page }) => {
      // Mock API returning expired token error
      await page.route('**/api/v1/auth/reset-password', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid or expired reset token',
            },
          }),
        });
      });

      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(0).fill('NewSecurePass123');
      await passwordInputs.nth(1).fill('NewSecurePass123');

      const submitButton = page.getByRole('button', { name: /reset password/i });
      await submitButton.click();

      // Error alert should appear with the specific message
      const errorAlert = page.locator('.bg-red-50');
      await expect(errorAlert).toBeVisible();

      const errorText = page.getByText('Invalid or expired reset token');
      await expect(errorText).toBeVisible();
    });

    test('helper text is visible below password field', async ({ page }) => {
      const helperText = page.getByText(/at least 8 characters with letters and numbers/i);
      await expect(helperText).toBeVisible();
    });
  });
});
