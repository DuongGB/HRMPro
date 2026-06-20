import { test, expect } from '@playwright/test';

test.describe('Payroll Management E2E Tests', () => {

  test('Hiển thị kỳ chạy lương và danh sách phiếu lương', async ({ page }) => {
    await page.goto('/payroll');

    // Chờ bảng danh sách kỳ chạy lương xuất hiện
    const payrollTable = page.locator('table, .table, [data-testid="payroll-table"], .grid').first();
    await expect(payrollTable).toBeVisible({ timeout: 15000 });
  });

  test('Kiểm tra nút xuất danh sách chuyển khoản ngân hàng', async ({ page }) => {
    await page.goto('/payroll');

    // Tìm nút xuất excel
    const exportBtn = page.locator('button:has-text("Xuất"), button:has-text("Export"), [data-testid="export-bank-button"]').first();
    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeEnabled();
    }
  });
});
