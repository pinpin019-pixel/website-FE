import { expect, test } from '@playwright/test';

test('hiện danh sách sản phẩm từ backend', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sản phẩm' })).toBeVisible();
  const table = page.getByRole('table', { name: 'Danh sách sản phẩm' });
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).not.toHaveCount(1); // có ít nhất một dòng dữ liệu ngoài tiêu đề
});

test('thêm sản phẩm mới và thấy trong danh sách', async ({ page }) => {
  const name = `SP thử ${Date.now()}`;
  await page.goto('/');
  await page.getByLabel('Tên sản phẩm').fill(name);
  await page.getByLabel('Giá (₫)').fill('125000');
  await page.getByRole('button', { name: 'Thêm sản phẩm' }).click();
  const row = page.getByRole('row', { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row).toContainText('125.000 ₫');
});

test('báo lỗi khi bỏ trống tên', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Giá (₫)').fill('1000');
  await page.getByRole('button', { name: 'Thêm sản phẩm' }).click();
  await expect(page.getByRole('alert')).toHaveText('Tên sản phẩm là bắt buộc');
});
