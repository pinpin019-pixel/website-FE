// KAN-13: banner đồng ý cookie, sự kiện đo lường dataLayer, nạp GTM — TC-052..TC-056 (KAN-48)
// Hai bản frontend: http://localhost:5173 (không có VITE_GTM_ID) và http://localhost:5174 (VITE_GTM_ID=GTM-TEST,
// bật trong playwright.config.js). Request tới googletagmanager bị chặn, không gọi mạng thật.
import { expect, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const GTM_BASE = 'http://localhost:5174';
const PAGE_EVENTS = ['cta_click', 'menu_click', 'solution_click', 'case_study_click', 'scroll_depth', 'language_change', 'chat_open'];

test.beforeEach(async ({ page }) => {
  // Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__kan13_init')) return;
    sessionStorage.setItem('__kan13_init', '1');
    localStorage.clear();
  });
  // Chặn điều hướng khi bấm link, để đọc dataLayer ngay trên trang (sự kiện React vẫn chạy)
  await page.addInitScript(() => {
    document.addEventListener('click', (e) => {
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
      if (a) e.preventDefault();
    }, true);
  });
  await page.route(/googletagmanager\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
});

const banner = (page) => page.locator('section.cookie-consent');
const acceptBtn = (page) => banner(page).locator('.cookie-consent__accept');
const rejectBtn = (page) => banner(page).locator('.cookie-consent__reject');
const gtmScripts = (page) => page.locator('script[src*="googletagmanager"]');

async function openHome(page, base = '') {
  await page.setViewportSize(DESKTOP);
  await page.goto(`${base}/`);
  await expect(page.locator('header.site-header')).toBeVisible();
  await expect(page.locator('section.cta')).toBeVisible();
}

async function pageEvents(page) {
  return page.evaluate((names) => (window.dataLayer || []).filter((e) => e && names.includes(e.event)), PAGE_EVENTS);
}

async function scrollToBottom(page) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2)).toBe(true);
}

async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

// Cuộn từng màn hình tới cuối trang (mỗi bước một sự kiện scroll)
async function scrollDownStepwise(page) {
  for (let i = 0; i < 40; i += 1) {
    const atBottom = await page.evaluate(() => {
      window.scrollBy(0, Math.floor(window.innerHeight * 0.8));
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    });
    await page.waitForTimeout(50);
    if (atBottom) return;
  }
  throw new Error('chưa tới cuối trang');
}

const heroCta = (page) => page.locator('.hero__slide.is-active .hero__cta');

test('KAN-13: TC-052 banner cookie lần đầu, hai nút cùng kích thước, lựa chọn lưu localStorage, tải lại không hiện', async ({ page }) => {
  await openHome(page);
  await expect(banner(page)).toBeVisible();
  await expect(acceptBtn(page)).toHaveText('Accept');
  await expect(rejectBtn(page)).toHaveText('Reject');
  const a = await acceptBtn(page).boundingBox();
  const r = await rejectBtn(page).boundingBox();
  expect(Math.abs(a.width - r.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(a.height - r.height)).toBeLessThanOrEqual(1);

  await rejectBtn(page).click();
  await expect(banner(page)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('cookie_consent'))).toBe('rejected');

  await page.reload();
  await expect(page.locator('section.cta')).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
});

test('KAN-13: TC-052 chọn Accept cũng được lưu, tải lại không hiện banner', async ({ page }) => {
  await openHome(page);
  await acceptBtn(page).click();
  await expect(banner(page)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('cookie_consent'))).toBe('accepted');
  await page.reload();
  await expect(page.locator('section.cta')).toBeVisible();
  await expect(banner(page)).toHaveCount(0);
});

test('KAN-13: TC-052 hai nút cùng kích thước ở màn hình 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  const a = await acceptBtn(page).boundingBox();
  const r = await rejectBtn(page).boundingBox();
  expect(Math.abs(a.width - r.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(a.height - r.height)).toBeLessThanOrEqual(1);
});

test('KAN-13: TC-053 chưa chọn hoặc đã Reject: không có sự kiện trong dataLayer, không có script GTM', async ({ page }) => {
  await openHome(page, GTM_BASE);
  await expect(banner(page)).toBeVisible();

  // Bước 1: chưa chọn
  await heroCta(page).click();
  await page.locator('.nav__lang select').selectOption('vi');
  await expect(page).toHaveURL(/lang=vi/);
  await scrollDownStepwise(page);
  await page.locator('.chat-btn').click();
  expect(await pageEvents(page)).toEqual([]);
  await expect(gtmScripts(page)).toHaveCount(0);

  // Bước 2: Reject rồi lặp lại
  await rejectBtn(page).click();
  await expect(banner(page)).toHaveCount(0);
  await scrollToTop(page);
  await heroCta(page).click();
  await page.locator('.nav__lang select').selectOption('en');
  await expect(page).toHaveURL(/lang=en/);
  await scrollDownStepwise(page);
  await page.locator('.chat-btn').click();
  expect(await pageEvents(page)).toEqual([]);
  await expect(gtmScripts(page)).toHaveCount(0);
});

test('KAN-13: TC-054 đã Accept: tương tác đẩy đúng sự kiện và tham số vào dataLayer', async ({ page }) => {
  await openHome(page);
  await acceptBtn(page).click();
  await expect(banner(page)).toHaveCount(0);
  await expect(page.locator('.case-studies__more').first()).toBeVisible();

  await heroCta(page).click();
  await page.locator('.nav__menu').getByRole('link', { name: 'Careers', exact: true }).click();
  await page.locator('.solutions__more').first().click();
  await page.locator('.case-studies__more').first().click();
  await page.locator('section.solutions .solutions__intro a.btn').click();
  await page.locator('section.why a.btn').click();
  await page.locator('section.cta a.cta__btn').click();
  await page.locator('.nav__lang select').selectOption('vi');
  await expect(page).toHaveURL(/lang=vi/);
  await page.locator('.chat-btn').click();

  const events = (await pageEvents(page)).filter((e) => e.event !== 'scroll_depth');
  expect(events).toEqual([
    { event: 'cta_click', label: 'Contact Us', location: 'hero' },
    { event: 'menu_click', label: 'Careers' },
    { event: 'solution_click' },
    { event: 'case_study_click' },
    { event: 'cta_click', label: 'Contact us', location: 'solutions' },
    { event: 'cta_click', label: 'Contact Us', location: 'why' },
    { event: 'cta_click', label: "Let's Chat!", location: 'cta' },
    { event: 'language_change', from: 'en', to: 'vi' },
    { event: 'chat_open' },
  ]);
});

test('KAN-13: TC-054 menu_click cho mục menu có menu con (bấm mở và bấm link con)', async ({ page }) => {
  await openHome(page);
  await acceptBtn(page).click();
  await page.locator('.nav__menu').getByRole('button', { name: 'Services' }).click();
  const sub = page.locator('.nav__item.is-open .nav__panel a').first();
  const subLabel = (await sub.textContent()).trim();
  await sub.click();
  const events = (await pageEvents(page)).filter((e) => e.event === 'menu_click');
  expect(events).toEqual([
    { event: 'menu_click', label: 'Services' },
    { event: 'menu_click', label: subLabel },
  ]);
});

test('KAN-13: TC-055 scroll_depth mỗi mốc đúng một lần (cuối trang → đầu → cuối)', async ({ page }) => {
  await openHome(page);
  await acceptBtn(page).click();
  await expect(page.locator('.case-studies__more').first()).toBeVisible();

  await scrollDownStepwise(page);
  await scrollToTop(page);
  await scrollToBottom(page);
  await page.waitForTimeout(200);

  const depth = (await pageEvents(page)).filter((e) => e.event === 'scroll_depth');
  expect(depth).toEqual([
    { event: 'scroll_depth', percent: 25 },
    { event: 'scroll_depth', percent: 50 },
    { event: 'scroll_depth', percent: 75 },
    { event: 'scroll_depth', percent: 100 },
  ]);
});

test('KAN-13: TC-056a có VITE_GTM_ID: chưa chọn không có script, Accept thì chèn script GTM với id đó; vào lại vẫn nạp', async ({ page }) => {
  await openHome(page, GTM_BASE);
  await expect(banner(page)).toBeVisible();
  await expect(gtmScripts(page)).toHaveCount(0);

  await acceptBtn(page).click();
  await expect(gtmScripts(page)).toHaveCount(1);
  expect(await gtmScripts(page).getAttribute('src')).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST');

  await page.reload();
  await expect(page.locator('section.cta')).toBeVisible();
  await expect(gtmScripts(page)).toHaveCount(1);
});

test('KAN-13: TC-056a có VITE_GTM_ID nhưng Reject: không chèn script GTM', async ({ page }) => {
  await openHome(page, GTM_BASE);
  await rejectBtn(page).click();
  await page.waitForTimeout(300);
  await expect(gtmScripts(page)).toHaveCount(0);
  await page.reload();
  await expect(page.locator('section.cta')).toBeVisible();
  await expect(gtmScripts(page)).toHaveCount(0);
});

test('KAN-13: TC-056b không có VITE_GTM_ID: Accept không chèn script GTM, sự kiện vẫn vào dataLayer', async ({ page }) => {
  await openHome(page);
  await acceptBtn(page).click();
  await page.locator('.chat-btn').click();
  await page.waitForTimeout(300);
  await expect(gtmScripts(page)).toHaveCount(0);
  expect(await pageEvents(page)).toEqual([{ event: 'chat_open' }]);
});
