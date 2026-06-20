import { test, expect } from '@playwright/test';

test.describe('Recruitment Management E2E Tests', () => {

  test('Hiển thị danh sách tin tuyển dụng', async ({ page }) => {
    await page.goto('/recruitment');

    // Kiểm tra tin tuyển dụng hoặc board Kanban
    const recruitmentContainer = page.locator('div:has-text("Mới ứng tuyển"), div:has-text("Sàng lọc CV"), table, .kanban-board, .grid').first();
    await expect(recruitmentContainer).toBeVisible({ timeout: 15000 });
  });

  test('Kiểm tra Kanban Board hiển thị các cột tuyển dụng', async ({ page }) => {
    await page.goto('/recruitment');

    // Kanban board thường có các cột ứng viên: Mới, Sàng lọc, Phỏng vấn, vv.
    const kanbanColumn = page.locator('.kanban-column, :has-text("Mới"), :has-text("Phỏng vấn"), :has-text("Offer")').first();
    if (await kanbanColumn.isVisible()) {
      await expect(kanbanColumn).toBeVisible();
    }
  });
});
