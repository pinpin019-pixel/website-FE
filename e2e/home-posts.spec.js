// KAN-10: khối Case Studies và Media — TC-039..TC-043 (KAN-48)
import { expect, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 768 };
const MOBILE = { width: 390, height: 844 };
const API = 'http://localhost:3001';

// Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__kan10_init')) return;
    sessionStorage.setItem('__kan10_init', '1');
    localStorage.clear();
  });
});

const caseSection = (page) => page.locator('section.case-studies');
const caseCards = (page) => caseSection(page).locator('.case-studies__card');
const media = (page) => page.locator('section.media');
const featured = (page) => media(page).locator('.media__featured');
const items = (page) => media(page).locator('.media__item');

async function api(page, path) {
  const res = await page.request.get(`${API}${path}`);
  expect(res.ok()).toBe(true);
  return res.json();
}

async function blockContent(page, key) {
  const body = await api(page, '/api/home?lang=en');
  return body.blocks.find((b) => b.key === key)?.content;
}

async function openHome(page, size = DESKTOP, path = '/') {
  await page.setViewportSize(size);
  await page.goto(path);
  await expect(caseCards(page).first()).toBeVisible();
  await expect(featured(page)).toBeVisible();
}

test('KAN-10: TC-039 4 thẻ Case Study đúng thứ tự API: ảnh lazy, tiêu đề, trích đoạn, Learn more; line-clamp 2/3; View all', async ({ page }) => {
  const posts = await api(page, '/api/posts?type=case_study&limit=4&lang=en');
  const block = await blockContent(page, 'case_studies');
  expect(posts).toHaveLength(4);
  await openHome(page);
  await expect(caseSection(page).locator('.section-label')).toHaveText(block.label);
  await expect(caseSection(page).locator('h2')).toHaveText('Successful Stories Through Every Project');
  await expect(caseCards(page)).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    const card = caseCards(page).nth(i);
    const p = posts[i];
    await expect(card.locator('h3')).toHaveText(p.title);
    await expect(card.locator('p')).toHaveText(p.excerpt);
    const img = card.locator('img');
    await expect(img).toHaveAttribute('src', p.imageUrl);
    await expect(img).toHaveAttribute('alt', p.title);
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(card.getByRole('link', { name: /Learn more/ })).toHaveAttribute('href', p.url);
  }
  const clamp = (loc) => loc.evaluate((el) => getComputedStyle(el).webkitLineClamp);
  expect(await clamp(caseCards(page).first().locator('h3'))).toBe('2');
  expect(await clamp(caseCards(page).first().locator('p'))).toBe('3');
  const viewAll = caseSection(page).getByRole('link', { name: /^View all/ });
  await expect(viewAll).toHaveAttribute('href', block.viewAllHref);
  expect(block.viewAllHref).toMatch(/case-stud/i);
});

for (const [size, cols] of [[DESKTOP, 4], [TABLET, 2], [MOBILE, 1]]) {
  test(`KAN-10: TC-040 lưới case study ${cols} cột ở ${size.width}px`, async ({ page }) => {
    await openHome(page, size);
    const ys = [];
    for (let i = 0; i < 4; i++) ys.push((await caseCards(page).nth(i).boundingBox()).y);
    const firstRow = ys.filter((y) => Math.abs(y - ys[0]) < 2).length;
    expect(firstRow).toBe(cols);
  });
}

test('KAN-10: TC-041 Media: tin nổi bật (ảnh lớn, tiêu đề, ngày, trích đoạn) + 3 tin danh sách; đúng thứ tự API; View all posts', async ({ page }) => {
  const posts = await api(page, '/api/posts?type=news&limit=4&lang=en');
  const block = await blockContent(page, 'media');
  expect(posts).toHaveLength(4);
  await openHome(page);
  await expect(media(page).locator('.section-label')).toHaveText(block.label);
  await expect(media(page).locator('h2')).toHaveText('Latest news & events');

  const f = featured(page);
  await expect(f.locator('img')).toHaveAttribute('src', posts[0].imageUrl);
  await expect(f.locator('h3')).toHaveText(posts[0].title);
  await expect(f.locator('time')).toHaveText('November 18, 2026');
  await expect(f.locator('p')).toHaveText(posts[0].excerpt);
  await expect(f.locator('a').first()).toHaveAttribute('href', posts[0].url);

  await expect(items(page)).toHaveCount(3);
  const expectedDates = ['November 12, 2026', 'November 10, 2026', 'November 4, 2026'];
  for (let i = 0; i < 3; i++) {
    const it = items(page).nth(i);
    await expect(it.locator('img')).toHaveAttribute('src', posts[i + 1].imageUrl);
    await expect(it.locator('h4')).toHaveText(posts[i + 1].title);
    await expect(it.locator('time')).toHaveText(expectedDates[i]);
  }
  // ảnh tin nổi bật lớn hơn ảnh trong danh sách
  const big = await f.locator('img').boundingBox();
  const small = await items(page).first().locator('img').boundingBox();
  expect(big.width).toBeGreaterThan(small.width * 1.5);

  const viewAll = media(page).getByRole('link', { name: 'View all posts' });
  await expect(viewAll).toHaveAttribute('href', block.viewAllHref);
  expect(block.viewAllHref).toMatch(/news/i);
});

test('KAN-10: TC-042 trang vi hiển thị ngày dạng dd/mm/yyyy', async ({ page }) => {
  await openHome(page, DESKTOP, '/?lang=vi');
  await expect(featured(page).locator('time')).toHaveText('18/11/2026');
  for (let i = 0; i < 3; i++) await expect(items(page).nth(i).locator('time')).toHaveText(/^\d{2}\/\d{2}\/\d{4}$/);
});

test('KAN-10: TC-043 /api/posts lỗi 500 → hai khối báo lỗi nhỏ hoặc ẩn, phần còn lại vẫn hiển thị', async ({ page }) => {
  await page.route('**/api/posts**', (route) => route.fulfill({ status: 500, json: { error: 'Lỗi máy chủ' } }));
  await page.setViewportSize(DESKTOP);
  await page.goto('/');
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('section.solutions')).toBeVisible();
  await expect(page.locator('.site-footer')).toBeVisible();
  await expect(page.locator('.home__error')).toHaveCount(0);
  for (const sec of [caseSection(page), media(page)]) {
    await expect(sec.locator('.posts__error')).toBeVisible();
  }
  await expect(caseCards(page)).toHaveCount(0);
  await expect(featured(page)).toHaveCount(0);
});

test('KAN-10: A/C 12 mọi ảnh trong Case Studies và Media có loading="lazy"', async ({ page }) => {
  await openHome(page);
  const imgs = page.locator('section.case-studies img, section.media img');
  const n = await imgs.count();
  expect(n).toBe(8);
  for (let i = 0; i < n; i++) await expect(imgs.nth(i)).toHaveAttribute('loading', 'lazy');
});
