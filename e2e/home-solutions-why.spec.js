// KAN-9: khối Solutions và Why Choose Us — TC-031, TC-033..TC-035 (KAN-48)
import { expect, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 768 };
const MOBILE = { width: 390, height: 844 };
const CONTACT_URL = 'https://cmcglobal.com.vn/contact-us/';
const CARD_TITLES = [
  'World-class IT Services', 'Digital Transformation', 'Artificial Intelligence Solutions', 'CMC Solutions', 'Model',
];
const STATS = [
  ['32+', 'Years Of Experience'],
  ['3000+', 'Certified Engineers'],
  ['300+', 'Global Clients'],
  ['35+', 'Business Partners'],
  ['30+', 'Countries'],
];
const CYAN = 'rgb(0, 187, 228)';
const NAVY = 'rgb(10, 37, 64)';

// Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__kan9_init')) return;
    sessionStorage.setItem('__kan9_init', '1');
    localStorage.clear();
  });
});

const solutions = (page) => page.locator('section.solutions');
const intro = (page) => solutions(page).locator('.solutions__intro');
const cards = (page) => solutions(page).locator('.solutions__card');
const why = (page) => page.locator('section.why');
const statNums = (page) => why(page).locator('.why__num');
const statLabels = (page) => why(page).locator('.why__label');

async function blockContent(page, key) {
  const res = await page.request.get('http://localhost:3001/api/home?lang=en');
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return body.blocks.find((b) => b.key === key)?.content;
}

async function openHome(page, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.goto('/');
  await expect(solutions(page)).toBeVisible();
  await expect(why(page)).toBeVisible();
}

test('KAN-9: TC-031 Solutions ở 1440px: cột trái đủ nội dung và dính khi cuộn; 5 thẻ đúng thứ tự, alt, Learn more', async ({ page }) => {
  const data = await blockContent(page, 'solutions');
  await openHome(page);
  await expect(intro(page).locator('.solutions__label')).toHaveText('SOLUTIONS', { useInnerText: true });
  await expect(intro(page).locator('h2')).toHaveText('One-stop IT Solution');
  await expect(intro(page).locator('p')).toHaveText(data.intro);
  const cta = intro(page).getByRole('link', { name: 'Contact us' });
  await expect(cta).toHaveAttribute('href', CONTACT_URL);
  expect(await intro(page).evaluate((el) => getComputedStyle(el).position)).toBe('sticky');

  await expect(cards(page)).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    const card = cards(page).nth(i);
    await expect(card.locator('h3')).toHaveText(CARD_TITLES[i]);
    await expect(card.locator('p')).toHaveText(data.cards[i].description);
    await expect(card.locator('img')).toHaveAttribute('alt', CARD_TITLES[i]);
    await expect(card.locator('img')).toHaveAttribute('src', data.cards[i].imageUrl);
    const more = card.getByRole('link', { name: /Learn more/ });
    await expect(more).toHaveAttribute('href', data.cards[i].href);
  }

  // Cuộn cột phải: cột trái vẫn nằm trong màn hình
  await cards(page).nth(4).scrollIntoViewIfNeeded();
  const box = await intro(page).boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(DESKTOP.height);
  const firstCard = await cards(page).nth(0).boundingBox();
  expect(firstCard.y).toBeLessThan(box.y); // thẻ đầu đã cuộn lên trên cột trái
});

test('KAN-9: TC-031 Solutions ở 1024px vẫn hai cột, cột trái sticky', async ({ page }) => {
  await openHome(page, TABLET);
  expect(await intro(page).evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
  const a = await intro(page).boundingBox();
  const c = await cards(page).nth(0).boundingBox();
  expect(c.x).toBeGreaterThan(a.x + a.width - 1);
});

for (const size of [{ width: 991, height: 900 }, MOBILE]) {
  test(`KAN-9: TC-031 Solutions ở ${size.width}px: thẻ xếp dọc dưới đoạn giới thiệu, không sticky`, async ({ page }) => {
    await openHome(page, size);
    expect(await intro(page).evaluate((el) => getComputedStyle(el).position)).not.toBe('sticky');
    const a = await intro(page).boundingBox();
    const boxes = [];
    for (let i = 0; i < 5; i++) boxes.push(await cards(page).nth(i).boundingBox());
    expect(boxes[0].y).toBeGreaterThanOrEqual(a.y + a.height - 1);
    for (let i = 1; i < 5; i++) {
      expect(Math.abs(boxes[i].x - boxes[0].x)).toBeLessThanOrEqual(1);
      expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y);
    }
  });
}

test('KAN-9: TC-032 mô tả thẻ dài hơn 50 từ hiển thị 50 từ + "…"', async ({ page }) => {
  const long = Array.from({ length: 60 }, (_, i) => `word${i + 1}`).join(' ');
  await page.route('**/api/home**', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const s = body.blocks.find((b) => b.key === 'solutions');
    s.content = { ...s.content, cards: s.content.cards.map((c, i) => (i === 0 ? { ...c, description: long } : c)) };
    await route.fulfill({ response: res, json: body });
  });
  const data = await blockContent(page, 'solutions');
  await openHome(page);
  const expected = `${long.split(' ').slice(0, 50).join(' ')}…`;
  await expect(cards(page).nth(0).locator('p')).toHaveText(expected);
  await expect(cards(page).nth(1).locator('p')).toHaveText(data.cards[1].description);
});

test.describe('giảm chuyển động', () => {
  test.use({ reducedMotion: 'reduce' });

  test('KAN-9: TC-033 Why Choose Us: nền navy + ảnh nền, nhãn, tiêu đề, mô tả, nút; 5 chỉ số đúng', async ({ page }) => {
    const data = await blockContent(page, 'why');
    await openHome(page);
    await why(page).scrollIntoViewIfNeeded();
    expect(await why(page).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(NAVY);
    const bg = why(page).locator('img.why__bg');
    await expect(bg).toHaveAttribute('src', data.backgroundUrl);
    await expect(bg).toHaveAttribute('alt', '');
    await expect(why(page).locator('.why__label')).toHaveText(data.label);
    await expect(why(page).locator('h2')).toHaveText('CMC Global – A Part of Your Strategic Move');
    await expect(why(page).locator('.why__lead')).toHaveText(data.lead);
    await expect(why(page).getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', CONTACT_URL);
    await expect(statNums(page)).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      await expect(statNums(page).nth(i)).toHaveText(STATS[i][0]);
      await expect(statLabels(page).nth(i)).toHaveText(STATS[i][1]);
    }
  });

  test('KAN-9: TC-034 bật giảm chuyển động → hiện ngay giá trị cuối, không cần cuộn tới', async ({ page }) => {
    await page.clock.install();
    await openHome(page);
    const now = await page.evaluate(() => Date.now());
    await page.clock.pauseAt(now + 100);
    for (let i = 0; i < 5; i++) await expect(statNums(page).nth(i)).toHaveText(STATS[i][0]);
  });
});

test('KAN-9: TC-034 số đếm tăng từ 0 khi khối xuất hiện, tới giá trị cuối trong 1,5 giây', async ({ page }) => {
  await page.clock.install();
  await openHome(page);
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 100);
  // Chưa cuộn tới khối: số là 0
  await page.clock.runFor(2000);
  for (let i = 0; i < 5; i++) await expect(statNums(page).nth(i)).toHaveText('0+');
  await expect(why(page)).toHaveAttribute('data-count-state', 'idle');

  await statNums(page).first().scrollIntoViewIfNeeded();
  await expect(why(page)).toHaveAttribute('data-count-state', 'running');
  await page.clock.runFor(500);
  const mid = Number((await statNums(page).nth(1).textContent()).replace('+', ''));
  expect(mid).toBeGreaterThan(0);
  expect(mid).toBeLessThan(3000);
  await page.clock.runFor(1200);
  for (let i = 0; i < 5; i++) await expect(statNums(page).nth(i)).toHaveText(STATS[i][0]);
  await expect(why(page)).toHaveAttribute('data-count-state', 'done');
});

test('KAN-9: TC-035 nút CTA Solutions, Why: màu cyan/navy, bo 6px, Montserrat; ảnh hai khối loading=lazy', async ({ page }) => {
  await openHome(page);
  const ctas = [intro(page).getByRole('link', { name: 'Contact us' }), why(page).getByRole('link', { name: 'Contact Us' })];
  for (const cta of ctas) {
    const s = await cta.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, radius: cs.borderRadius, font: cs.fontFamily };
    });
    expect([CYAN, NAVY]).toContain(s.bg);
    expect(s.radius).toBe('6px');
    expect(s.font).toContain('Montserrat');
  }
  const imgs = page.locator('section.solutions img, section.why img');
  const n = await imgs.count();
  expect(n).toBe(6);
  for (let i = 0; i < n; i++) await expect(imgs.nth(i)).toHaveAttribute('loading', 'lazy');
});

for (const size of [DESKTOP, TABLET, MOBILE]) {
  test(`KAN-9: TC-023 có Solutions và Why, không cuộn ngang ở ${size.width}px`, async ({ page }) => {
    await openHome(page, size);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
}
