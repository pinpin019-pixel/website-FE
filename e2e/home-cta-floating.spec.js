// KAN-12: CTA cuối trang, nút chat + lời chào, Back to top — TC-048..TC-051, TC-035 (KAN-48)
import { expect, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const CONTACT_URL = 'https://cmcglobal.com.vn/contact-us/';
const CYAN = 'rgb(0, 187, 228)';
const NAVY = 'rgb(10, 37, 64)';

// Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__kan12_init')) return;
    sessionStorage.setItem('__kan12_init', '1');
    localStorage.clear();
  });
});

const cta = (page) => page.locator('section.cta');
const ctaButton = (page) => cta(page).getByRole('link', { name: "Let's Chat!", exact: true });
const chatButton = (page) => page.getByRole('button', { name: 'Chat', exact: true });
const greeting = (page) => page.locator('.chat-greeting__text');
const closeGreeting = (page) => page.getByRole('button', { name: 'Close greeting', exact: true });
const toTop = (page) => page.getByRole('button', { name: 'Back to top', exact: true });

// Dữ liệu thật của khối từ backend (migration 008)
async function blockContent(page, key) {
  const res = await page.request.get('http://localhost:3001/api/home?lang=en');
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return body.blocks.find((b) => b.key === key)?.content;
}

async function openHome(page, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.goto('/');
  await expect(cta(page)).toBeVisible();
  await expect(chatButton(page)).toBeVisible();
}

// Đồng hồ giả: cài trước khi nạp trang, dừng thời gian ngay khi trang đã hiện
async function openHomeWithClock(page, size) {
  await page.clock.install();
  await openHome(page, size);
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 100);
}

test('KAN-12: TC-048 khối CTA cuối trang: tiêu đề, nút "Let\'s Chat!" tới trang Contact, nằm trước footer', async ({ page }) => {
  await openHome(page);
  await cta(page).scrollIntoViewIfNeeded();
  await expect(cta(page).getByRole('heading', { level: 2 })).toHaveText('Maximize Your ROI in the Cloud');
  await expect(ctaButton(page)).toHaveAttribute('href', CONTACT_URL);
  const ctaBox = await cta(page).boundingBox();
  const footerBox = await page.locator('footer.site-footer').boundingBox();
  expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(footerBox.y + 1);
});

test('KAN-12: TC-049 nút chat cố định góc dưới phải, lời chào từ dữ liệu, không tự ẩn ở 1440px; đóng được; bấm chat không mở gì', async ({ page, context }) => {
  const data = await blockContent(page, 'floating');
  expect(data?.chatGreeting).toBeTruthy();
  await openHomeWithClock(page, DESKTOP);

  // Bước 1: position fixed, góc dưới phải, lời chào đúng dữ liệu
  expect(await chatButton(page).evaluate((el) => getComputedStyle(el).position)).toBe('fixed');
  const box = await chatButton(page).boundingBox();
  expect(DESKTOP.width - (box.x + box.width)).toBeLessThanOrEqual(40);
  expect(DESKTOP.height - (box.y + box.height)).toBeLessThanOrEqual(40);
  await expect(greeting(page)).toBeVisible();
  await expect(greeting(page)).toHaveText(data.chatGreeting);

  // Vẫn cố định khi cuộn
  await page.evaluate(() => window.scrollTo(0, 2000));
  const after = await chatButton(page).boundingBox();
  expect(Math.abs(after.y - box.y)).toBeLessThanOrEqual(1);

  // Bước 2: tiến 10 giây → lời chào vẫn hiện
  await page.clock.runFor(10000);
  await expect(greeting(page)).toBeVisible();

  // Bước 3: bấm đóng → lời chào ẩn
  await closeGreeting(page).click();
  await expect(greeting(page)).toBeHidden();
  await expect(closeGreeting(page)).toHaveCount(0);

  // Bước 4: bấm chat → không mở tab/cửa sổ mới, không điều hướng
  const url = page.url();
  let opened = 0;
  context.on('page', () => { opened += 1; });
  await chatButton(page).click();
  await page.clock.runFor(1000);
  expect(opened).toBe(0);
  expect(page.url()).toBe(url);
  await expect(chatButton(page)).toBeVisible();
});

test('KAN-12: TC-050 lời chào tự ẩn sau 5 giây ở 390px, nút chat vẫn hiện', async ({ page }) => {
  await openHomeWithClock(page, MOBILE);
  await expect(greeting(page)).toBeVisible();
  await page.clock.runFor(3500);
  await expect(greeting(page)).toBeVisible();
  await page.clock.runFor(2000);
  await expect(greeting(page)).toBeHidden();
  await expect(chatButton(page)).toBeVisible();
});

test('KAN-12: TC-051 Back to top ẩn khi chưa cuộn quá 1 màn hình, hiện khi đã cuộn quá; bấm thì về đầu trang', async ({ page }) => {
  await openHome(page);
  const { sh, ih } = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: window.innerHeight }));
  expect(sh).toBeGreaterThan(2 * ih); // tiền điều kiện: trang dài hơn 2 màn hình

  await expect(toTop(page)).toBeHidden();
  await page.evaluate((y) => window.scrollTo(0, y), ih - 10);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(ih - 10);
  await expect(toTop(page)).toBeHidden();

  await page.evaluate((y) => window.scrollTo(0, y), ih + 200);
  await expect(toTop(page)).toBeVisible();
  expect(await toTop(page).evaluate((el) => getComputedStyle(el).position)).toBe('fixed');

  await toTop(page).click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
  await expect(toTop(page)).toBeHidden();
});

test('KAN-12: TC-035 nút CTA cuối trang: màu cyan/navy, bo 6px, Montserrat (NFR-13)', async ({ page }) => {
  await openHome(page);
  const s = await ctaButton(page).evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, radius: cs.borderRadius, font: cs.fontFamily };
  });
  expect([CYAN, NAVY]).toContain(s.bg);
  expect(s.radius).toBe('6px');
  expect(s.font).toContain('Montserrat');
});

test('KAN-12: tên truy cập tiếng Việt cho nút chat, đóng lời chào, Back to top (?lang=vi)', async ({ page }) => {
  await page.setViewportSize(DESKTOP);
  await page.goto('/?lang=vi');
  await expect(cta(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Trò chuyện', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đóng lời chào', exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
  await expect(page.getByRole('button', { name: 'Lên đầu trang', exact: true })).toBeVisible();
});
