import { test as setup, expect } from '@playwright/test';

const ADMIN_FILE = 'e2e/.auth/admin.json';

/**
 * Global setup: Đăng nhập với tài khoản Super Admin → lưu storage state
 * để các test khác tái sử dụng session mà không cần login lại.
 */
setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Wait for form to be visible
  await page.waitForSelector('form', { timeout: 10000 });

  // Fill in login credentials (from V2__insert_test_accounts.sql)
  await page.fill('input[name="username"], input[id="username"], input[placeholder*="đăng nhập"]', 'superadmin');
  await page.fill('input[name="password"], input[id="password"], input[type="password"]', '123456');

  // Submit login form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard (successful login)
  await page.waitForURL('/', { timeout: 15000 });

  // Verify we are on dashboard
  await expect(page).toHaveURL('/');

  // Save authentication state
  await page.context().storageState({ path: ADMIN_FILE });
});
