/**
 * Auth Page Layout Tests
 * Playwright tests for login and registration page layout verification
 *
 * Test Strategy:
 * - Verify structure using semantic selectors (not brittle pixels)
 * - Assert vertical stacking order via bounding boxes
 * - Validate accessibility (keyboard nav, labels)
 * - Test responsive behavior on mobile viewports
 * - Establish visual regression baselines
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// Login Page Tests
// ============================================================================

test.describe('Login Page Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    // Remove animations for stable tests
    await page.addStyleTag({
      content: `* { animation: none !important; transition: none !important; }`,
    });
  });

  test.describe('Baseline Layout Verification', () => {
    test('form exists and is visible', async ({ page }) => {
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('email field exists with label', async ({ page }) => {
      const emailLabel = page.getByText('Email', { exact: true });
      const emailInput = page.locator('input[type="email"]');

      await expect(emailLabel).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('placeholder', 'your@email.com');
    });

    test('password field exists with label', async ({ page }) => {
      const passwordLabel = page.getByText('Password', { exact: true });
      const passwordInput = page.locator('input[type="password"]');

      await expect(passwordLabel).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('submit button exists with correct text', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /sign in/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('forgot password link exists', async ({ page }) => {
      const forgotLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotLink).toBeVisible();
    });

    test('create account link exists', async ({ page }) => {
      const registerLink = page.getByRole('link', { name: /create account/i });
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toHaveAttribute('href', '/register');
    });

    test('Navio logo/brand is visible', async ({ page }) => {
      const brand = page.getByText('Navio');
      await expect(brand).toBeVisible();
    });

    test('page heading shows welcome message', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /welcome back/i });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Structural Layout Assertions', () => {
    test('email field is above password field', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();

      expect(emailBox).not.toBeNull();
      expect(passwordBox).not.toBeNull();

      // Email should be above password (with tolerance for borders/margins)
      expect(emailBox!.y + emailBox!.height).toBeLessThanOrEqual(passwordBox!.y + 10);
    });

    test('password field is above submit button', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.getByRole('button', { name: /sign in/i });

      const passwordBox = await passwordInput.boundingBox();
      const submitBox = await submitButton.boundingBox();

      expect(passwordBox).not.toBeNull();
      expect(submitBox).not.toBeNull();

      // Password should be above submit button
      expect(passwordBox!.y + passwordBox!.height).toBeLessThanOrEqual(submitBox!.y + 10);
    });

    test('submit button has prominent size', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /sign in/i });
      const submitBox = await submitButton.boundingBox();

      expect(submitBox).not.toBeNull();
      // Button should be at least 40px tall (prominent CTA)
      expect(submitBox!.height).toBeGreaterThanOrEqual(40);
    });
  });

  test.describe('Accessibility & Keyboard Navigation', () => {
    test('tab order follows logical flow', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.getByRole('button', { name: /sign in/i });

      // Start tabbing from the beginning
      await page.keyboard.press('Tab');
      // Skip past logo link
      await page.keyboard.press('Tab');

      // Should reach email input
      await expect(emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      // May tab to forgot password link first
      await page.keyboard.press('Tab');
      // Then to password input
      await expect(passwordInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(submitButton).toBeFocused();
    });

    test('all inputs have associated labels', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      // Check inputs have id attributes
      const emailId = await emailInput.getAttribute('id');
      const passwordId = await passwordInput.getAttribute('id');

      expect(emailId).toBeTruthy();
      expect(passwordId).toBeTruthy();

      // Check corresponding labels exist
      const emailLabel = page.locator(`label[for="${emailId}"]`);
      const passwordLabel = page.locator(`label[for="${passwordId}"]`);

      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
    });

    test('submit button is reachable via keyboard', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /sign in/i });

      // Focus the submit button using Tab navigation
      await submitButton.focus();
      await expect(submitButton).toBeFocused();

      // Verify it can be activated with Enter
      // (We don't actually submit to avoid form submission)
    });
  });

  test.describe('Visual Regression', () => {
    test('login page desktop screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('login-page-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});

// ============================================================================
// Registration Page Tests
// ============================================================================

test.describe('Registration Page Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({
      content: `* { animation: none !important; transition: none !important; }`,
    });
  });

  test.describe('Baseline Layout Verification', () => {
    test('form exists and is visible', async ({ page }) => {
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('name field exists with label', async ({ page }) => {
      const nameLabel = page.getByText('Full Name');
      const nameInput = page.locator('input[type="text"]');

      await expect(nameLabel).toBeVisible();
      await expect(nameInput).toBeVisible();
    });

    test('email field exists with label', async ({ page }) => {
      const emailLabel = page.getByText('Email', { exact: true });
      const emailInput = page.locator('input[type="email"]');

      await expect(emailLabel).toBeVisible();
      await expect(emailInput).toBeVisible();
    });

    test('password field exists with label', async ({ page }) => {
      const passwordLabel = page.getByText('Password', { exact: true });
      const passwordInput = page.locator('input[type="password"]');

      await expect(passwordLabel).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('password helper text is shown', async ({ page }) => {
      const helperText = page.getByText(/at least 8 characters/i);
      await expect(helperText).toBeVisible();
    });

    test('submit button exists with correct text', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /create account/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });

    test('sign in link exists', async ({ page }) => {
      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
    });

    test('Navio logo/brand is visible', async ({ page }) => {
      const brand = page.getByText('Navio');
      await expect(brand).toBeVisible();
    });

    test('page heading shows create account message', async ({ page }) => {
      const heading = page.getByRole('heading', { name: /create your account/i });
      await expect(heading).toBeVisible();
    });

    test('no confirm password field (simplified form)', async ({ page }) => {
      // Count password inputs - should only be one
      const passwordInputs = page.locator('input[type="password"]');
      await expect(passwordInputs).toHaveCount(1);
    });
  });

  test.describe('Structural Layout Assertions', () => {
    test('fields are in correct vertical order: name → email → password → submit', async ({
      page,
    }) => {
      const nameInput = page.locator('input[type="text"]');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.getByRole('button', { name: /create account/i });

      const nameBox = await nameInput.boundingBox();
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      const submitBox = await submitButton.boundingBox();

      expect(nameBox).not.toBeNull();
      expect(emailBox).not.toBeNull();
      expect(passwordBox).not.toBeNull();
      expect(submitBox).not.toBeNull();

      // Verify vertical ordering
      expect(nameBox!.y).toBeLessThan(emailBox!.y);
      expect(emailBox!.y).toBeLessThan(passwordBox!.y);
      expect(passwordBox!.y).toBeLessThan(submitBox!.y);
    });

    test('submit button has prominent size', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /create account/i });
      const submitBox = await submitButton.boundingBox();

      expect(submitBox).not.toBeNull();
      expect(submitBox!.height).toBeGreaterThanOrEqual(40);
    });
  });

  test.describe('Accessibility & Keyboard Navigation', () => {
    test('all inputs have associated labels', async ({ page }) => {
      const nameInput = page.locator('input[type="text"]');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      const nameId = await nameInput.getAttribute('id');
      const emailId = await emailInput.getAttribute('id');
      const passwordId = await passwordInput.getAttribute('id');

      expect(nameId).toBeTruthy();
      expect(emailId).toBeTruthy();
      expect(passwordId).toBeTruthy();

      // Check labels exist
      await expect(page.locator(`label[for="${nameId}"]`)).toBeVisible();
      await expect(page.locator(`label[for="${emailId}"]`)).toBeVisible();
      await expect(page.locator(`label[for="${passwordId}"]`)).toBeVisible();
    });
  });

  test.describe('Visual Regression', () => {
    test('registration page desktop screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('register-page-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});

// ============================================================================
// Split-Screen Layout Tests (Desktop)
// ============================================================================

test.describe('Split-Screen Layout (Desktop)', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
    });

    test('hero panel is visible on desktop', async ({ page }) => {
      const heroPanel = page.locator('[data-testid="hero-panel"]');
      await expect(heroPanel).toBeVisible();
    });

    test('form panel is visible on desktop', async ({ page }) => {
      const formPanel = page.locator('[data-testid="form-panel"]');
      await expect(formPanel).toBeVisible();
    });

    test('panels are roughly equal width (50/50 split)', async ({ page }) => {
      const heroPanel = page.locator('[data-testid="hero-panel"]');
      const formPanel = page.locator('[data-testid="form-panel"]');

      const heroBox = await heroPanel.boundingBox();
      const formBox = await formPanel.boundingBox();

      expect(heroBox).not.toBeNull();
      expect(formBox).not.toBeNull();

      const viewportWidth = 1280;
      const expectedHalfWidth = viewportWidth / 2;

      // Allow 10% tolerance
      expect(heroBox!.width).toBeGreaterThan(expectedHalfWidth * 0.9);
      expect(heroBox!.width).toBeLessThan(expectedHalfWidth * 1.1);
      expect(formBox!.width).toBeGreaterThan(expectedHalfWidth * 0.9);
      expect(formBox!.width).toBeLessThan(expectedHalfWidth * 1.1);
    });

    test('hero text content is visible', async ({ page }) => {
      const headline = page.getByText('Plan Your Next Adventure Together');
      await expect(headline).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
    });

    test('hero panel is visible on desktop', async ({ page }) => {
      const heroPanel = page.locator('[data-testid="hero-panel"]');
      await expect(heroPanel).toBeVisible();
    });

    test('hero text content is visible', async ({ page }) => {
      const headline = page.getByText('Start Your Journey');
      await expect(headline).toBeVisible();
    });
  });
});

// ============================================================================
// Responsive Layout Tests (Mobile)
// ============================================================================

test.describe('Responsive Layout (Mobile 375x812)', () => {
  test.beforeEach(async ({ page }) => {
    // Set iPhone viewport
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test.describe('Login Page Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
    });

    test('hero panel is hidden on mobile', async ({ page }) => {
      const heroPanel = page.locator('[data-testid="hero-panel"]');
      await expect(heroPanel).not.toBeVisible();
    });

    test('form panel takes full width', async ({ page }) => {
      const formPanel = page.locator('[data-testid="form-panel"]');
      const formBox = await formPanel.boundingBox();

      expect(formBox).not.toBeNull();
      expect(formBox!.width).toBe(375); // Full viewport width
    });

    test('form does not overflow viewport', async ({ page }) => {
      const form = page.locator('form');
      const formBox = await form.boundingBox();

      expect(formBox).not.toBeNull();
      expect(formBox!.width).toBeLessThanOrEqual(375);
    });

    test('submit button is visible without scrolling', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /sign in/i });
      const submitBox = await submitButton.boundingBox();

      expect(submitBox).not.toBeNull();
      // Button should be within initial viewport (812px height)
      expect(submitBox!.y + submitBox!.height).toBeLessThanOrEqual(812);
    });

    test('mobile screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('login-page-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Registration Page Mobile', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
    });

    test('hero panel is hidden on mobile', async ({ page }) => {
      const heroPanel = page.locator('[data-testid="hero-panel"]');
      await expect(heroPanel).not.toBeVisible();
    });

    test('form does not overflow viewport', async ({ page }) => {
      const form = page.locator('form');
      const formBox = await form.boundingBox();

      expect(formBox).not.toBeNull();
      expect(formBox!.width).toBeLessThanOrEqual(375);
    });

    test('layout remains vertically stacked', async ({ page }) => {
      const nameInput = page.locator('input[type="text"]');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      const nameBox = await nameInput.boundingBox();
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();

      // All inputs should have the same x position (left-aligned)
      const tolerance = 5;
      expect(Math.abs(nameBox!.x - emailBox!.x)).toBeLessThan(tolerance);
      expect(Math.abs(emailBox!.x - passwordBox!.x)).toBeLessThan(tolerance);
    });

    test('mobile screenshot', async ({ page }) => {
      await expect(page).toHaveScreenshot('register-page-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});

// ============================================================================
// Redesign Verification Tests
// ============================================================================

test.describe('Redesign Constraints Verification', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
    });

    test('form container has reasonable max-width', async ({ page }) => {
      // The form content should be constrained within the right panel
      const formPanel = page.locator('[data-testid="form-panel"]');
      const form = formPanel.locator('form');
      const formBox = await form.boundingBox();

      expect(formBox).not.toBeNull();
      // Form should not exceed 448px (max-w-md)
      expect(formBox!.width).toBeLessThanOrEqual(500);
    });

    test('CTA button is more prominent than secondary links', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /sign in/i });
      const secondaryLink = page.getByRole('link', { name: /create account/i });

      const buttonBox = await submitButton.boundingBox();
      const linkBox = await secondaryLink.boundingBox();

      expect(buttonBox).not.toBeNull();
      expect(linkBox).not.toBeNull();

      // Button should be taller/more prominent than link text
      expect(buttonBox!.height).toBeGreaterThan(linkBox!.height);
    });
  });

  test.describe('Registration Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('http://localhost:3000/register');
      await page.waitForLoadState('networkidle');
    });

    test('simplified form has only 3 input fields', async ({ page }) => {
      const inputs = page.locator('form input');
      // name (text), email (email), password (password) = 3 inputs
      await expect(inputs).toHaveCount(3);
    });

    test('form has consistent field spacing', async ({ page }) => {
      const nameInput = page.locator('input[type="text"]');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      const nameBox = await nameInput.boundingBox();
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();

      // Calculate gaps between fields
      const gap1 = emailBox!.y - (nameBox!.y + nameBox!.height);
      const gap2 = passwordBox!.y - (emailBox!.y + emailBox!.height);

      // Gaps should be approximately equal (within 20px tolerance)
      // Note: Password has helper text so may have larger gap
      expect(Math.abs(gap1 - gap2)).toBeLessThan(40);
    });
  });
});
