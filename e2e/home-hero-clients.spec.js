// KAN-8: Hero slider và dải logo khách hàng — TC-024..TC-029 (KAN-48)
import { expect, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 768 };
const MOBILE = { width: 390, height: 844 };
const FIRST_TITLE = 'Ride the Next Wave of Digital Transformation';
const CONTACT_URL = 'https://cmcglobal.com.vn/contact-us/';

// Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
async function freshStorage(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__kan8_init')) return;
    sessionStorage.setItem('__kan8_init', '1');
    localStorage.clear();
  });
}

test.beforeEach(async ({ page }) => {
  await freshStorage(page);
});

const hero = (page) => page.locator('section.hero');
const slides = (page) => hero(page).locator('.hero__slide');
const activeSlide = (page) => hero(page).locator('.hero__slide.is-active');
const dots = (page) => hero(page).locator('.hero__dots button');
const clients = (page) => page.locator('section.clients');
const logoImgs = (page) => clients(page).locator('.clients__item img');

// Dữ liệu thật của khối từ backend (migration 004)
async function blockContent(page, key) {
  const res = await page.request.get('http://localhost:3001/api/home?lang=en');
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return body.blocks.find((b) => b.key === key)?.content;
}

// Thay danh sách slide hero trong phản hồi /api/home
async function routeSlides(page, makeSlides) {
  await page.route('**/api/home**', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const h = body.blocks.find((b) => b.key === 'hero');
    h.content = { ...h.content, slides: makeSlides(h.content.slides) };
    await route.fulfill({ response: res, json: body });
  });
}

const extraSlides = (base, n) => Array.from({ length: n }, (_, i) => (
  i < base.length ? base[i] : { ...base[0], title: `Slide ${i + 1}`, description: `Description ${i + 1}` }
));

async function openHome(page, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.goto('/');
  await expect(hero(page)).toBeVisible();
  await expect(activeSlide(page).locator('.hero__title')).toHaveText(FIRST_TITLE);
}

// Đồng hồ giả: cài trước khi nạp trang, dừng thời gian ngay sau khi trang hiện hero
async function openHomeWithClock(page, size = DESKTOP) {
  await page.clock.install();
  await openHome(page, size);
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 100);
}

const activeTitle = (page) => activeSlide(page).locator('.hero__title');

// Slide đang hiện nằm đúng trong khung hero (đã trượt xong)
async function expectActiveInFrame(page) {
  await expect.poll(async () => {
    const h = await hero(page).boundingBox();
    const s = await activeSlide(page).boundingBox();
    return Math.abs(s.x - h.x);
  }).toBeLessThanOrEqual(1);
}

test('KAN-8: TC-024 slide đầu: tiêu đề, mô tả, CTA Contact Us, ảnh nền từ dữ liệu; một chấm mỗi slide', async ({ page }) => {
  const data = await blockContent(page, 'hero');
  await openHome(page);
  await expect(slides(page)).toHaveCount(data.slides.length);
  await expect(dots(page)).toHaveCount(data.slides.length);
  const first = slides(page).first();
  await expect(first).toHaveClass(/is-active/);
  await expect(first.locator('.hero__title')).toHaveText(FIRST_TITLE);
  await expect(first.locator('.hero__desc')).toHaveText(data.slides[0].description);
  const cta = first.locator('a.hero__cta');
  await expect(cta).toHaveText('Contact Us');
  await expect(cta).toHaveAttribute('href', CONTACT_URL);
  const bg = await first.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain(data.slides[0].imageUrl);
  for (let i = 1; i < data.slides.length; i++) {
    await expect(slides(page).nth(i).locator('.hero__title')).toHaveText(data.slides[i].title);
  }
});

test('KAN-8: TC-024 dữ liệu 7 slide → chỉ hiện 5 slide đầu, 5 chấm', async ({ page }) => {
  await routeSlides(page, (base) => extraSlides(base, 7));
  await openHome(page);
  await expect(slides(page)).toHaveCount(5);
  await expect(dots(page)).toHaveCount(5);
  await expect(slides(page).nth(4).locator('.hero__title')).toHaveText('Slide 5');
  await expect(hero(page)).not.toContainText('Slide 6');
});

test('KAN-8: TC-025 tự chuyển sau 6 giây; nút Trước/Sau có aria-label; chấm đánh dấu slide hiện tại', async ({ page }) => {
  await routeSlides(page, (base) => extraSlides(base, 4));
  await openHomeWithClock(page);
  const prev = hero(page).getByRole('button', { name: 'Previous slide' });
  const next = hero(page).getByRole('button', { name: 'Next slide' });
  await expect(prev).toHaveAttribute('aria-label', 'Previous slide');
  await expect(next).toHaveAttribute('aria-label', 'Next slide');
  await expect(dots(page).nth(0)).toHaveAttribute('aria-current', 'true');

  await page.clock.runFor(5000);
  await expect(activeTitle(page)).toHaveText(FIRST_TITLE);
  await page.clock.runFor(1000);
  await expect(slides(page).nth(1)).toHaveClass(/is-active/);
  await expect(dots(page).nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(dots(page).nth(0)).not.toHaveAttribute('aria-current', 'true');

  await next.click();
  await expect(slides(page).nth(2)).toHaveClass(/is-active/);
  await prev.click();
  await prev.click();
  await expect(slides(page).nth(0)).toHaveClass(/is-active/);
  await prev.click(); // quay vòng về slide cuối
  await expect(slides(page).nth(3)).toHaveClass(/is-active/);

  await dots(page).nth(2).click();
  await expect(dots(page).nth(2)).toHaveAttribute('aria-current', 'true');
  await expect(activeTitle(page)).toHaveText('Slide 3');
  await expectActiveInFrame(page);
  await expect(dots(page)).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(dots(page).nth(i)).toHaveAttribute('aria-label', /.+/);
});

test('KAN-8: TC-026 toàn trang đúng một h1, là tiêu đề slide hiện tại', async ({ page }) => {
  const data = await blockContent(page, 'hero');
  await openHome(page);
  await expect(page.locator('footer.site-footer')).toBeVisible(); // các khối đã có đều đã hiện
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(FIRST_TITLE);
  await expect(activeSlide(page).locator('h1')).toHaveCount(1);
  await hero(page).getByRole('button', { name: 'Next slide' }).click();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(data.slides[1].title);
  await expect(activeSlide(page).locator('h1')).toHaveCount(1);
});

test('KAN-8: TC-027 rê chuột dừng tự chuyển, rời chuột chạy lại; nút Tạm dừng đổi tên', async ({ page }) => {
  await routeSlides(page, (base) => extraSlides(base, 4));
  await openHomeWithClock(page);

  await hero(page).hover();
  await page.clock.runFor(7000);
  await expect(activeTitle(page)).toHaveText(FIRST_TITLE);
  await page.mouse.move(5, 5); // ra khỏi hero (vùng header)
  await page.clock.runFor(6000);
  await expect(activeTitle(page)).toHaveText('One-stop IT Solution for Your Digital Business');

  const pause = hero(page).getByRole('button', { name: 'Pause' });
  await expect(pause).toBeVisible();
  await pause.click();
  await page.mouse.move(5, 5);
  const play = hero(page).getByRole('button', { name: 'Play' });
  await expect(play).toBeVisible();
  await expect(hero(page).getByRole('button', { name: 'Pause' })).toHaveCount(0);
  await page.clock.runFor(7000);
  await expect(slides(page).nth(1)).toHaveClass(/is-active/);

  await play.click();
  await page.mouse.move(5, 5);
  await expect(hero(page).getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.clock.runFor(6000);
  await expect(slides(page).nth(2)).toHaveClass(/is-active/);
});

test.describe('cảm ứng', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: MOBILE });

  async function swipe(page, fromX, toX) {
    const box = await hero(page).boundingBox();
    const y = Math.round(box.y + box.height / 2);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: fromX, y }] });
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const x = Math.round(fromX + ((toX - fromX) * i) / steps);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  test('KAN-8: TC-027 vuốt trái sang slide kế, vuốt phải về slide trước', async ({ page }) => {
    await routeSlides(page, (base) => extraSlides(base, 3));
    await page.goto('/');
    await expect(activeTitle(page)).toHaveText(FIRST_TITLE);
    await swipe(page, 320, 60);
    await expect(slides(page).nth(1)).toHaveClass(/is-active/);
    await swipe(page, 60, 320);
    await expect(slides(page).nth(0)).toHaveClass(/is-active/);
  });
});

// Các logo nằm trọn trong khung nhìn của dải, theo thứ tự trái → phải
async function logosInView(page) {
  return clients(page).evaluate((root) => {
    const view = root.querySelector('.clients__view').getBoundingClientRect();
    return [...root.querySelectorAll('.clients__item')]
      .filter((li) => {
        const r = li.getBoundingClientRect();
        return r.left >= view.left - 1 && r.right <= view.right + 1;
      })
      .map((li) => li.querySelector('img').getAttribute('alt'));
  });
}

test('KAN-8: TC-028 6 logo/khung ở 1440px, 3 ở 390px; alt là tên khách hàng trong dữ liệu', async ({ page }) => {
  const data = await blockContent(page, 'clients');
  const names = data.logos.map((l) => l.name);
  await openHome(page);
  await expect(clients(page)).toBeVisible();
  await expect(logoImgs(page)).toHaveCount(names.length);
  for (let i = 0; i < names.length; i++) {
    await expect(logoImgs(page).nth(i)).toHaveAttribute('alt', names[i]);
    await expect(logoImgs(page).nth(i)).toHaveAttribute('src', data.logos[i].imageUrl);
  }
  await expect.poll(async () => (await logosInView(page)).length).toBe(6);
  await page.setViewportSize({ width: 768, height: 900 });
  await expect.poll(async () => (await logosInView(page)).length).toBe(6);
  await page.setViewportSize({ width: 767, height: 900 });
  await expect.poll(async () => (await logosInView(page)).length).toBe(3);
  await page.setViewportSize(MOBILE);
  await expect.poll(async () => (await logosInView(page)).length).toBe(3);
});

test('KAN-8: TC-028 chỉ hiện logo có trong dữ liệu (logo thiếu tên bị bỏ)', async ({ page }) => {
  await page.route('**/api/home**', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const c = body.blocks.find((b) => b.key === 'clients');
    c.content = { logos: [
      { name: 'Alpha', imageUrl: 'https://example.com/a.png' },
      { name: '', imageUrl: 'https://example.com/b.png' },
      { name: 'Gamma', imageUrl: 'https://example.com/c.png' },
    ] };
    await route.fulfill({ response: res, json: body });
  });
  await openHome(page);
  await expect(logoImgs(page)).toHaveCount(2);
  await expect(logoImgs(page).nth(0)).toHaveAttribute('alt', 'Alpha');
  await expect(logoImgs(page).nth(1)).toHaveAttribute('alt', 'Gamma');
});

test('KAN-8: TC-029 dải logo tự cuộn 1 logo mỗi 3 giây; mũi tên có aria-label; cuối dải quay về đầu', async ({ page }) => {
  const data = await blockContent(page, 'clients');
  const names = data.logos.map((l) => l.name);
  expect(names.length).toBeGreaterThan(6);
  await openHomeWithClock(page);
  const prev = clients(page).getByRole('button', { name: 'Previous logos' });
  const next = clients(page).getByRole('button', { name: 'Next logos' });
  await expect(prev).toHaveAttribute('aria-label', 'Previous logos');
  await expect(next).toHaveAttribute('aria-label', 'Next logos');
  await expect.poll(async () => (await logosInView(page))[0]).toBe(names[0]);

  await page.clock.runFor(2500);
  await expect.poll(async () => (await logosInView(page))[0]).toBe(names[0]);
  await page.clock.runFor(500);
  await expect.poll(async () => (await logosInView(page))).toEqual(names.slice(1, 7));
  await page.clock.runFor(3000);
  await expect.poll(async () => (await logosInView(page))[0]).toBe(names[2]);

  const lastStart = names.length - 6;
  for (let i = 2; i < lastStart; i++) await next.click();
  await expect.poll(async () => (await logosInView(page))).toEqual(names.slice(lastStart));
  await next.click();
  await expect.poll(async () => (await logosInView(page))).toEqual(names.slice(0, 6));
  await prev.click();
  await expect.poll(async () => (await logosInView(page))).toEqual(names.slice(lastStart));
});

for (const size of [DESKTOP, TABLET, MOBILE]) {
  test(`KAN-8: TC-023 có hero và dải logo, không cuộn ngang ở ${size.width}px`, async ({ page }) => {
    await openHome(page, size);
    await expect(clients(page)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
}
