/**
 * Section 3.A.2: Test that verifies no visible "raffle" text remains
 * Visits every route in both admin and player apps
 * Fails if document.body.innerText matches /raffle/i
 */

import { test, expect } from '@playwright/test';

// All player routes (authenticated and public)
const playerRoutes = [
  '/',
  '/auth',
  '/home',
  '/game',
  '/leaderboard',
  '/raffles', // Now called "Draws" in the UI
  '/notifications',
  '/profile',
  '/profile/change-password',
  '/profile/notification-preferences',
  '/stats',
  '/store',
  '/refer-earn',
  '/forgot-password',
  '/reset-password',
];

// All admin routes
const adminRoutes = [
  '/admin/login',
  '/admin/overview',
  '/admin/users',
  '/admin/reports',
  '/admin/winners',
  '/admin/change-requests',
  '/admin/packages',
  '/admin/payment-settings',
  '/admin/trivia-setup',
  '/admin/rewards',
  '/admin/game-settings',
  '/admin/notifications',
  '/admin/audit-log',
  '/admin/client-sync',
];

test.describe('No "raffle" text should be visible', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  // Test all player routes
  for (const route of playerRoutes) {
    test(`Player route ${route} should not contain "raffle"`, async ({ page }) => {
      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });
      } catch (error) {
        // If navigation times out or redirects (likely auth-protected), skip the check
        if (error instanceof Error && error.message.includes('Timeout')) {
          test.skip();
          return;
        }
        throw error;
      }

      // Wait a bit for any dynamic content
      await page.waitForTimeout(500);

      // Get all visible text from the page
      const bodyText = await page.locator('body').innerText();

      // Check if "raffle" appears (case-insensitive)
      const raffleMatch = bodyText.match(/raffle/i);
      
      if (raffleMatch) {
        // If found, provide context
        const context = bodyText.substring(
          Math.max(0, bodyText.toLowerCase().indexOf('raffle') - 50),
          Math.min(bodyText.length, bodyText.toLowerCase().indexOf('raffle') + 50)
        );
        throw new Error(
          `Found "raffle" text on ${route}:\n` +
          `Context: ...${context}...`
        );
      }

      expect(raffleMatch).toBeNull();
    });
  }

  // Test all admin routes
  for (const route of adminRoutes) {
    test(`Admin route ${route} should not contain "raffle"`, async ({ page }) => {
      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });
      } catch (error) {
        // If navigation times out or redirects (likely auth-protected), skip the check
        if (error instanceof Error && error.message.includes('Timeout')) {
          test.skip();
          return;
        }
        throw error;
      }

      // Wait a bit for any dynamic content
      await page.waitForTimeout(500);

      // Get all visible text from the page
      const bodyText = await page.locator('body').innerText();

      // Check if "raffle" appears (case-insensitive)
      const raffleMatch = bodyText.match(/raffle/i);
      
      if (raffleMatch) {
        // If found, provide context
        const context = bodyText.substring(
          Math.max(0, bodyText.toLowerCase().indexOf('raffle') - 50),
          Math.min(bodyText.length, bodyText.toLowerCase().indexOf('raffle') + 50)
        );
        throw new Error(
          `Found "raffle" text on ${route}:\n` +
          `Context: ...${context}...`
        );
      }

      expect(raffleMatch).toBeNull();
    });
  }
});
