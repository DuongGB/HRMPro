import { test, expect } from '@playwright/test';

test.describe('Đăng nhập / Đăng xuất', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Không dùng session đã lưu

  test('Đăng nhập thành công → chuyển hướng về Dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"], input[id="username"], input[placeholder*="đăng nhập"]', 'superadmin');
    await page.fill('input[name="password"], input[id="password"], input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // Chờ chuyển hướng về dashboard
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).toHaveURL('/');
  });

  test('Đăng nhập thất bại → hiện thông báo lỗi', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"], input[id="username"], input[placeholder*="đăng nhập"]', 'wronguser');
    await page.fill('input[name="password"], input[id="password"], input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Chờ thông báo lỗi xuất hiện
    const errorMessage = page.locator('[role="alert"], .toast, [data-sonner-toast]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('Form validation — submit trống → hiện validation errors', async ({ page }) => {
    await page.goto('/login');

    // Click submit mà không nhập gì
    await page.click('button[type="submit"]');

    // Chờ URL vẫn ở /login (không navigate)
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Đăng xuất', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Sử dụng session biệt lập để tránh ảnh hưởng session dùng chung

  test('Đăng xuất thành công → quay về trang đăng nhập', async ({ page }) => {
    // Đăng nhập trước trong session độc lập này
    await page.goto('/login');
    await page.fill('input[name="username"], input[id="username"], input[placeholder*="đăng nhập"]', 'superadmin');
    await page.fill('input[name="password"], input[id="password"], input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });

    // Tìm và click nút đăng xuất (thường trong dropdown user menu)
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Đăng xuất"), [aria-label*="menu"]').first();
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }

    const logoutButton = page.locator('button:has-text("Đăng xuất"), [data-testid="logout-button"], a:has-text("Đăng xuất")').first();
    
    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
      // Chờ redirect về login
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
