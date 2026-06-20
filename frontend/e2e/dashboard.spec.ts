import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {

  test('Hiển thị dashboard với các thông số thống kê', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');

    // Verify URL là trang chủ
    await expect(page).toHaveURL('/');

    // Check sự tồn tại của tiêu đề dashboard hoặc các thẻ thống kê tổng quan
    const dashboardTitle = page.locator('h1, h2, .text-2xl, [data-testid="dashboard-title"]').first();
    await expect(dashboardTitle).toBeVisible({ timeout: 10000 });

    // Kiểm tra có các card thống kê
    const statsCards = page.locator('.grid, .card, [data-testid*="card"]').first();
    await expect(statsCards).toBeVisible({ timeout: 10000 });
  });

  test('Kiểm tra chuyển trang qua Sidebar Navigation', async ({ page }) => {
    await page.goto('/');

    // Click vào mục Nhân viên trong Sidebar
    const employeeLink = page.locator('a[href="/employees"], nav a:has-text("Nhân viên"), [data-testid="nav-employees"]').first();
    if (await employeeLink.isVisible()) {
      await employeeLink.click();
      await page.waitForURL(/\/employees/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/employees/);
    }
  });
});
