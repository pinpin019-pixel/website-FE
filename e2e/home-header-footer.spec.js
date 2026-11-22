// KAN-7: Header (logo, menu, mega menu, chọn ngôn ngữ, hamburger) và Footer — TC-012..TC-023 (KAN-48)
import { expect, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 768 };
const MOBILE = { width: 390, height: 844 };

const TOP_MENU = ['Services', 'Case Studies', 'About Us', 'Resources', 'Careers', 'Contact Us'];
const SERVICES_GROUPS = [
  ['World-class IT Services', 5],
  ['Digital Transformation', 4],
  ['Artificial Intelligence', 5],
  ['Enterprise Solutions', 2],
  ['CMC Solutions', 6],
  ['How to Work With Us', 4],
];
const FOOTER_COLUMNS = [
  'World-class IT Outsourcing', 'Digital Transformation', 'CMC Solutions', 'Model',
  'About Us', 'Case Studies', 'Resources', 'Careers',
];

// Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
async function freshStorage(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__kan7_init')) return;
    sessionStorage.setItem('__kan7_init', '1');
    localStorage.clear();
  });
}

const header = (page) => page.locator('header.site-header');
const footer = (page) => page.locator('footer.site-footer');
const topItem = (page, label) => header(page).locator('.nav__item').filter({ has: page.locator('.nav__top', { hasText: label }) });
const panel = (page, label) => topItem(page, label).locator('.nav__panel');

async function openHome(page, url = '/', size = DESKTOP) {
  await page.setViewportSize(size);
  await page.goto(url);
  await expect(header(page)).toBeVisible();
  await expect(footer(page)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await freshStorage(page);
});

test('KAN-7: TC-012 logo alt "CMC Global" về /, menu cấp 1 đúng thứ tự', async ({ page }) => {
  await openHome(page, '/?lang=en#x');
  const logo = header(page).locator('a.site-header__logo');
  await expect(logo).toHaveAttribute('href', '/');
  await expect(logo.locator('img')).toHaveAttribute('alt', 'CMC Global');
  await expect(header(page).locator('.nav__menu > .nav__item > .nav__top')).toHaveText(TOP_MENU);
  await logo.click();
  await expect(page).toHaveURL('http://localhost:5173/');
  await expect(header(page)).toBeVisible();
});

test('KAN-7: TC-013 nội dung mega menu Services, Case Studies, About Us, Resources', async ({ page }) => {
  await openHome(page);
  await topItem(page, 'Services').hover();
  const groups = panel(page, 'Services').locator('.nav__group');
  await expect(groups).toHaveCount(6);
  await expect(groups.locator('.nav__group-title')).toHaveText(SERVICES_GROUPS.map(([t]) => t));
  for (let i = 0; i < SERVICES_GROUPS.length; i++) {
    await expect(groups.nth(i).locator('a')).toHaveCount(SERVICES_GROUPS[i][1]);
  }
  await expect(groups.first()).toBeVisible();

  await topItem(page, 'Case Studies').hover();
  const cs = panel(page, 'Case Studies');
  await expect(cs).toBeVisible();
  await expect(cs.locator('.nav__group-title')).toHaveText(['Industry', 'Business Size']);
  await expect(cs.locator('.nav__group').nth(0).locator('a')).toHaveText(['Customer Stories']);
  await expect(cs.locator('.nav__group').nth(1).locator('a')).toHaveCount(7);
  await expect(cs.locator('.nav__group').nth(2).locator('a')).toHaveText(['Startup', 'SME', 'Enterprise']);
  await expect(cs.locator('.nav__group').nth(3).locator('a')).toHaveText(['Digital Transformation']);

  await topItem(page, 'About Us').hover();
  await expect(panel(page, 'About Us').locator('a')).toHaveText(['CMC Global', 'CMC Corporation', 'Company Profile']);
  await topItem(page, 'Resources').hover();
  await expect(panel(page, 'Resources').locator('a')).toHaveText(['Blog', 'E-books & Whitepapers', 'News & Events']);
  await expect(topItem(page, 'Careers').locator('.nav__panel')).toHaveCount(0);
  await expect(topItem(page, 'Contact Us').locator('.nav__panel')).toHaveCount(0);
});

test('KAN-7: TC-014 desktop: rê chuột mở/đóng menu con; Tab mở menu con và vào được link', async ({ page }) => {
  await openHome(page);
  const services = panel(page, 'Services');
  await expect(services).toBeHidden();
  await topItem(page, 'Services').hover();
  await expect(services).toBeVisible();
  await page.mouse.move(700, 850);
  await expect(services).toBeHidden();

  // Tab từ logo tới Services
  await header(page).locator('a.site-header__logo').focus();
  await page.keyboard.press('Tab');
  await expect(topItem(page, 'Services').locator('.nav__top')).toBeFocused();
  await expect(services).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(services.locator('a').first()).toBeFocused();

  // focus bàn phím vào Case Studies mở đúng menu con của nó, Tab vào link bên trong
  await topItem(page, 'Case Studies').locator('.nav__top').focus();
  const cs = panel(page, 'Case Studies');
  await expect(cs).toBeVisible();
  await expect(services).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(cs.getByRole('link', { name: 'Customer Stories' })).toBeFocused();
  await expect(cs).toBeVisible();
});

test('KAN-7: TC-015 chọn Tiếng Việt → ?lang=vi cùng đường dẫn, tải lại nội dung, nhớ ở localStorage', async ({ page }) => {
  await openHome(page);
  const select = header(page).getByRole('combobox', { name: 'Language' });
  await expect(select.locator('option')).toHaveText(['English', 'Tiếng Việt', 'Japanese', 'Korean']);
  const req = page.waitForRequest((r) => r.url().includes('/api/home?lang=vi'));
  await select.selectOption({ label: 'Tiếng Việt' });
  await req;
  await expect(page).toHaveURL(/\/\?lang=vi$/);
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(header(page).locator('select')).toHaveValue('vi');
  expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('vi');

  await page.goto('/');
  await expect(header(page)).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  await expect(header(page).locator('select')).toHaveValue('vi');
});

test('KAN-7: TC-016 chọn Japanese (chưa có bản dịch) → html lang ja, menu tiếng Anh, không lỗi', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page);
  await header(page).getByRole('combobox', { name: 'Language' }).selectOption({ label: 'Japanese' });
  await expect(page).toHaveURL(/\?lang=ja$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(header(page).locator('.nav__menu > .nav__item > .nav__top')).toHaveText(TOP_MENU);
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('KAN-7: TC-017 header dính đầu trang khi cuộn, nền trắng', async ({ page }) => {
  await openHome(page);
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '4000px';
    document.querySelector('header.site-header').after(spacer);
  });
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(1400);
  const box = await header(page).boundingBox();
  expect(Math.abs(box.y)).toBeLessThanOrEqual(1);
  const style = await header(page).evaluate((el) => {
    const s = getComputedStyle(el);
    return { position: s.position, background: s.backgroundColor };
  });
  expect(['sticky', 'fixed']).toContain(style.position);
  expect(style.background).toBe('rgb(255, 255, 255)');
});

test('KAN-7: TC-018 dưới 992px: hamburger có aria, danh sách dọc, menu con kiểu accordion', async ({ page }) => {
  await openHome(page, '/', MOBILE);
  const burger = header(page).locator('button.site-header__burger');
  const menu = header(page).locator('.nav__menu');
  await expect(burger).toBeVisible();
  await expect(burger).toHaveAttribute('aria-label', /.+/);
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();

  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  const tops = menu.locator('.nav__item > .nav__top');
  const boxes = [];
  for (let i = 0; i < TOP_MENU.length; i++) boxes.push(await tops.nth(i).boundingBox());
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y);
    expect(Math.abs(boxes[i].x - boxes[0].x)).toBeLessThanOrEqual(1);
  }

  const services = panel(page, 'Services');
  const servicesTop = topItem(page, 'Services').locator('.nav__top');
  await expect(services).toBeHidden();
  await servicesTop.click();
  await expect(services).toBeVisible();
  await expect(servicesTop).toHaveAttribute('aria-expanded', 'true');
  await servicesTop.click();
  await expect(services).toBeHidden();
  await expect(servicesTop).toHaveAttribute('aria-expanded', 'false');

  await burger.click();
  await expect(burger).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();

  await page.setViewportSize({ width: 991, height: 800 });
  await expect(burger).toBeVisible();
  await page.setViewportSize(DESKTOP);
  await expect(burger).toBeHidden();
  await expect(menu).toBeVisible();
});

test('KAN-7: TC-019 trong header không có thẻ h1–h6', async ({ page }) => {
  await openHome(page);
  await expect(header(page).locator('.nav__group-title').first()).toBeAttached();
  await expect(header(page).locator('h1, h2, h3, h4, h5, h6')).toHaveCount(0);
});

async function columnsInFirstRow(page) {
  const cols = footer(page).locator('.site-footer__col');
  const ys = [];
  for (let i = 0; i < await cols.count(); i++) ys.push(Math.round((await cols.nth(i).boundingBox()).y));
  return ys.filter((y) => y === ys[0]).length;
}

test('KAN-7: TC-020 footer 8 cột đúng thứ tự; desktop 4 cột/hàng, mobile 2 cột/hàng', async ({ page }) => {
  await openHome(page);
  await expect(footer(page).locator('.site-footer__col .site-footer__title')).toHaveText(FOOTER_COLUMNS);
  expect(await columnsInFirstRow(page)).toBe(4);
  await page.setViewportSize(MOBILE);
  await expect.poll(() => columnsInFirstRow(page)).toBe(2);
});

test('KAN-7: TC-021 mạng xã hội có aria-label, mở tab mới, rel noopener; liên hệ trống không hiện nhãn', async ({ page }) => {
  await openHome(page);
  const social = footer(page).locator('.site-footer__social a');
  await expect(social).toHaveCount(3);
  for (const name of ['Facebook', 'YouTube', 'LinkedIn']) {
    const a = footer(page).locator(`.site-footer__social a[aria-label="${name}"]`);
    await expect(a).toHaveCount(1);
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAttribute('rel', /(^|\s)noopener(\s|$)/);
  }
  await expect(footer(page).locator('.site-footer__contact')).toHaveCount(0);
  await expect(footer(page)).not.toContainText('Email:');
  await expect(footer(page)).not.toContainText('Phone:');
  await expect(footer(page)).not.toContainText('Address:');
});

test('KAN-7: TC-021 có email trong dữ liệu → hiển thị email', async ({ page }) => {
  await page.route('**/api/home**', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const f = body.blocks.find((b) => b.key === 'footer');
    f.content = { ...f.content, email: 'info@example.com' };
    await route.fulfill({ response: res, json: body });
  });
  await openHome(page);
  const contact = footer(page).locator('.site-footer__contact');
  await expect(contact).toContainText('info@example.com');
  await expect(contact).toContainText('Email');
  await expect(contact).not.toContainText('Phone');
  await expect(contact).not.toContainText('Address');
});

test('KAN-7: TC-022 năm bản quyền lấy từ đồng hồ trình duyệt', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-05T10:00:00'));
  await openHome(page);
  await expect(footer(page).locator('.site-footer__copyright')).toHaveText('Copyright ©2027 CMC Global. All rights reserved.');
});

for (const size of [DESKTOP, TABLET, MOBILE]) {
  test(`KAN-7: TC-023 không cuộn ngang ở ${size.width}px`, async ({ page }) => {
    await openHome(page, '/', size);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
}
