import { test, expect } from '@playwright/test';

test.describe('Leave Management E2E Tests', () => {

  test('Hiển thị số dư phép và danh sách đơn nghỉ phép', async ({ page }) => {
    await page.goto('/leaves');

    // Kiểm tra card hiển thị số dư phép còn lại
    const balanceCard = page.locator('h3:has-text("ANNUAL"), h3:has-text("Nghỉ phép năm"), div:has-text("ANNUAL"), .card').first();
    await expect(balanceCard).toBeVisible({ timeout: 15000 });

    // Kiểm tra bảng danh sách đơn nghỉ phép
    const requestsTable = page.locator('table, .table, [data-testid="leave-requests-table"], div:has-text("Lịch sử nghỉ phép của tôi")').first();
    await expect(requestsTable).toBeVisible({ timeout: 10000 });
  });

  test('Gửi yêu cầu nghỉ phép mới thành công', async ({ page }) => {
    await page.goto('/leaves');

    // Click nút "Tạo đơn xin nghỉ" / "Xin nghỉ phép"
    const applyBtn = page.locator('button:has-text("Xin nghỉ"), button:has-text("Tạo đơn"), [data-testid="apply-leave-button"]').first();
    await expect(applyBtn).toBeVisible({ timeout: 10000 });
    await applyBtn.click();

    // Điền thông tin đơn xin nghỉ phép
    // 1. Chọn loại phép (dropdown/select)
    const selectType = page.locator('select, [data-testid="select-leave-type"]').first();
    if (await selectType.isVisible()) {
      await selectType.selectOption({ index: 1 });
    }

    // 2. Chọn ngày bắt đầu và kết thúc
    await page.fill('input[id="start-date"], input[name="startDate"]', '2026-07-01');
    await page.fill('input[id="end-date"], input[name="endDate"]', '2026-07-02');

    // 3. Nhập lý do nghỉ
    await page.fill('textarea[id="reason"], textarea[name="reason"]', 'Nghỉ việc gia đình E2E');

    // Submit đơn
    const submitBtn = page.locator('button[type="submit"], button:has-text("Gửi"), button:has-text("Xác nhận")').first();
    await submitBtn.click();

    // Chờ thông báo thành công
    const toast = page.locator('[role="alert"], .toast, [data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  });
});
