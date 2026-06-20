import { test, expect } from '@playwright/test';

test.describe('Attendance E2E Tests', () => {

  test('Thực hiện Chấm công (Check In / Check Out)', async ({ page }) => {
    await page.goto('/attendance');

    // Chờ giao diện chấm công hiển thị
    const checkBtn = page.locator('button:has-text("Chấm công"), button:has-text("Check In"), button:has-text("Check Out"), [data-testid="check-button"]').first();
    await expect(checkBtn).toBeVisible({ timeout: 15000 });

    // Click nút chấm công nếu enabled, ngược lại kiểm tra hiển thị trạng thái đã chấm
    const isEnabled = await checkBtn.isEnabled();
    if (isEnabled) {
      await checkBtn.click();
      const toast = page.locator('[role="alert"], .toast, [data-sonner-toast]').first();
      await expect(toast).toBeVisible({ timeout: 10000 });
    } else {
      // Nếu đã chấm công, kiểm tra text hiển thị đã chấm
      const infoText = page.locator('text=Số lần đã chấm hôm nay, text=Check-in:').first();
      await expect(infoText).toBeVisible({ timeout: 10000 });
    }
  });

  test('Hiển thị lịch sử chấm công', async ({ page }) => {
    await page.goto('/attendance');

    // Kiểm tra bảng lịch sử chấm công hiển thị
    const historyTable = page.locator('table, .table, [data-testid="attendance-table"]').first();
    await expect(historyTable).toBeVisible({ timeout: 10000 });
  });
});
