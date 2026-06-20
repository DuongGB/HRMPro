import { test, expect } from '@playwright/test';

test.describe('Employee Management E2E Tests', () => {

  test('Hiển thị danh sách nhân viên và tìm kiếm', async ({ page }) => {
    await page.goto('/employees');

    // Chờ bảng danh sách nhân viên xuất hiện
    const employeeTable = page.locator('table, .table, [data-testid="employee-table"]').first();
    await expect(employeeTable).toBeVisible({ timeout: 15000 });

    // Lọc/Tìm kiếm thử nhân viên
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"], input[placeholder*="search"], [data-testid="search-input"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Nguyen');
      await searchInput.press('Enter');
      // Chờ bảng reload
      await page.waitForTimeout(1000);
      await expect(employeeTable).toBeVisible();
    }
  });

  test('Tạo nhân viên mới thành công', async ({ page }) => {
    await page.goto('/employees');

    // Click nút "Thêm nhân viên" / "Tạo mới"
    const addBtn = page.locator('button:has-text("Thêm"), button:has-text("Tạo"), [data-testid="add-employee-button"]').first();
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // Điền form tạo nhân viên
    await page.fill('input[id="emp-code"], input[name="employeeCode"]', 'EMP888');
    await page.fill('input[id="emp-lastname"], input[name="lastName"]', 'Test');
    await page.fill('input[id="emp-firstname"], input[name="firstName"]', 'User');
    await page.fill('input[id="emp-email"], input[name="email"]', 'e2e.test@hrmpro.com');
    await page.fill('input[id="emp-hiredate"], input[name="hireDate"]', '2026-06-20');

    // Submit form
    const submitBtn = page.locator('button[type="submit"], button:has-text("Lưu"), button:has-text("Xác nhận")').first();
    await submitBtn.click();

    // Chờ quay lại trang list hoặc hiển thị thông báo thành công
    const toast = page.locator('[role="alert"], .toast, [data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  });
});
