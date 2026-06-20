import { test, expect } from '@playwright/test';

test.describe('Organization Structure E2E Tests', () => {

  test('Hiển thị sơ đồ tổ chức và danh sách phòng ban', async ({ page }) => {
    await page.goto('/organization');

    // Chờ giao diện sơ đồ cây hoặc danh sách phòng ban load xong
    const orgContainer = page.locator('.origin-top, h4, table, .table, .tree, .org-chart').first();
    await expect(orgContainer).toBeVisible({ timeout: 15000 });

    // Kiểm tra có các node phòng ban chính
    const deptNode = page.locator('h4, tr, td, .node, :has-text("Ban Giám Đốc"), :has-text("Phòng")').first();
    await expect(deptNode).toBeVisible({ timeout: 10000 });
  });
});
