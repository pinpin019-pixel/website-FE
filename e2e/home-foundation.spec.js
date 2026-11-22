// KAN-6: nền tảng trang chủ — router, GET /api/home, ngôn ngữ, SEO
import { expect, test } from '@playwright/test';

// Dữ liệu mẫu khối seo trong be/migrations/002_home_blocks.sql
const SEO_EN = {
  title: 'CMC Global - Leading software development company since 1993',
  description: 'CMC Global – one-stop IT solution: World-class IT Services, Digital Transformation, AI Solutions, CMC Solutions.',
};
const SEO_VI_TITLE = 'CMC Global - Công ty phát triển phần mềm hàng đầu từ năm 1993';

// Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
async function freshStorage(page, lang) {
  await page.addInitScript(([l]) => {
    if (sessionStorage.getItem('__kan6_init')) return;
    sessionStorage.setItem('__kan6_init', '1');
    localStorage.clear();
    if (l) localStorage.setItem('lang', l);
  }, [lang || null]);
}

test.beforeEach(async ({ page }, info) => {
  if (!info.title.includes('localStorage')) await freshStorage(page);
});

test('KAN-6: TC-01 mở / hiển thị trang chủ .home, không còn màn hình Sản phẩm', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Danh sách sản phẩm' })).toHaveCount(0);
});

test('KAN-6: TC-08 title, meta description, html lang từ khối seo (en)', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(SEO_EN.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', SEO_EN.description);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('KAN-6: TC-09 ?lang=vi dùng bản seo vi, ?lang=ja fallback bản en', async ({ page }) => {
  await page.goto('/?lang=vi');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page).toHaveTitle(SEO_VI_TITLE);
  await page.goto('/?lang=ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page).toHaveTitle(SEO_EN.title);
});

test('KAN-6: TC-10 ngôn ngữ từ localStorage khi không có query', async ({ page }) => {
  await freshStorage(page, 'vi');
  await page.goto('/');
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(page).toHaveTitle(SEO_VI_TITLE);
});

test('KAN-6: TC-10 query ưu tiên hơn localStorage và được ghi nhớ', async ({ page }) => {
  await freshStorage(page, 'vi');
  await page.goto('/?lang=ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.goto('/');
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});

test('KAN-6: TC-10 giá trị lạ → en; mặc định en', async ({ page }) => {
  await page.goto('/?lang=xx');
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(SEO_EN.title);
});

test('KAN-6: TC-07 API lỗi → thông báo lỗi thân thiện (role alert), không trắng trang', async ({ page }) => {
  await page.route('**/api/home**', (route) => route.fulfill({
    status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Lỗi máy chủ' }),
  }));
  await page.goto('/');
  await expect(page.locator('.home')).toBeVisible();
  const alert = page.locator('.home').getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).not.toHaveText('');
  await expect(alert).not.toContainText('500');
});

test('KAN-6: TC-11 khối chưa có component bị bỏ qua, trang không lỗi', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/api/home**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      lang: 'en',
      blocks: [
        { key: 'khoi_chua_co', lang: 'en', content: { x: 1 } },
        { key: 'seo', lang: 'en', content: { title: 'Mock title', description: 'Mock desc' } },
      ],
    }),
  }));
  await page.goto('/');
  await expect(page).toHaveTitle('Mock title');
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('KAN-6: TC-12 story này không thêm h1: toàn trang nhiều nhất một h1', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(SEO_EN.title); // đã tải xong nội dung
  expect(await page.locator('h1').count()).toBeLessThanOrEqual(1);
});
