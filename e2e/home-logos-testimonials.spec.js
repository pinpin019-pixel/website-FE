// KAN-11: dải Awards / Certificates / Partners và slider Testimonials — TC-044..TC-047 (KAN-48)
import { expect, test } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
const TABLET = { width: 1024, height: 768 };
const MOBILE = { width: 390, height: 844 };
const BANDS = [['awards', 'Awards', 13], ['certificates', 'Certificates', 13], ['partners', 'Partners', 9]];
const GENERIC_ALT = /^(award|certificate|partner|logo)\s*\d*$/i;

// Xóa localStorage trước khi trang chạy (chỉ lần nạp đầu của mỗi test)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__kan11_init')) return;
    sessionStorage.setItem('__kan11_init', '1');
    localStorage.clear();
  });
});

const band = (page, label) => page.getByRole('region', { name: label, exact: true });
const bandImgs = (page, label) => band(page, label).locator('li img');
const testi = (page) => page.getByRole('region', { name: 'Voice of our customers' });
const panels = (page) => testi(page).getByRole('tabpanel');
const tabs = (page) => testi(page).getByRole('tab');

// Dữ liệu thật của khối từ backend (migration 007)
async function blockContent(page, key) {
  const res = await page.request.get('http://localhost:3001/api/home?lang=en');
  expect(res.ok()).toBe(true);
  const body = await res.json();
  return body.blocks.find((b) => b.key === key)?.content;
}

async function openHome(page, size = DESKTOP) {
  await page.setViewportSize(size);
  await page.goto('/');
  await expect(band(page, 'Awards')).toBeVisible();
  await expect(testi(page)).toBeVisible();
}

// Đồng hồ giả: cài trước khi nạp trang, dừng thời gian ngay khi các khối đã hiện
async function openHomeWithClock(page, size = DESKTOP) {
  await page.clock.install();
  await openHome(page, size);
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 100);
}

// alt của các logo nằm trọn trong khung nhìn của dải, theo thứ tự trái → phải
async function logosInView(page, label) {
  return band(page, label).evaluate((root) => {
    const imgs = [...root.querySelectorAll('li img')];
    const view = imgs[0].closest('ul').parentElement.getBoundingClientRect();
    return imgs
      .map((img) => ({ img, r: img.closest('li').getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.left >= view.left - 1 && r.right <= view.right + 1)
      .map(({ img }) => img.getAttribute('alt'));
  });
}

test('KAN-11: TC-044 ba dải có nhãn Awards, Certificates, Partners với 13, 13, 9 logo; mũi tên có aria-label', async ({ page }) => {
  await openHome(page);
  for (const [, label, count] of BANDS) {
    const b = band(page, label);
    await expect(b).toBeVisible();
    await expect(b.getByText(label, { exact: true })).toBeVisible();
    await expect(bandImgs(page, label)).toHaveCount(count);
    const prev = b.getByRole('button', { name: `Previous ${label}` });
    const next = b.getByRole('button', { name: `Next ${label}` });
    await expect(prev).toHaveAttribute('aria-label', `Previous ${label}`);
    await expect(next).toHaveAttribute('aria-label', `Next ${label}`);
  }
});

for (const [size, perView] of [[DESKTOP, 5], [TABLET, 4], [MOBILE, 2]]) {
  test(`KAN-11: TC-044 ${perView} logo/khung ở ${size.width}px ở cả ba dải`, async ({ page }) => {
    await openHome(page, size);
    for (const [, label] of BANDS) {
      await band(page, label).scrollIntoViewIfNeeded();
      await expect.poll(async () => (await logosInView(page, label)).length, { message: label }).toBe(perView);
    }
  });
}

test('KAN-11: TC-044 bấm Sau/Trước dịch dải Awards một logo, quay vòng ở hai đầu', async ({ page }) => {
  const names = (await blockContent(page, 'awards')).logos.map((l) => l.name);
  await openHome(page);
  const b = band(page, 'Awards');
  await b.scrollIntoViewIfNeeded();
  await expect.poll(() => logosInView(page, 'Awards')).toEqual(names.slice(0, 5));
  await b.getByRole('button', { name: 'Next Awards' }).click();
  await expect.poll(() => logosInView(page, 'Awards')).toEqual(names.slice(1, 6));
  await b.getByRole('button', { name: 'Previous Awards' }).click();
  await b.getByRole('button', { name: 'Previous Awards' }).click();
  await expect.poll(() => logosInView(page, 'Awards')).toEqual(names.slice(-5));
  // dải khác không bị dịch theo
  const certNames = (await blockContent(page, 'certificates')).logos.map((l) => l.name);
  await expect.poll(() => logosInView(page, 'Certificates')).toEqual(certNames.slice(0, 5));
});

test('KAN-11: TC-044 dải logo không tự chuyển', async ({ page }) => {
  const names = (await blockContent(page, 'partners')).logos.map((l) => l.name);
  await openHomeWithClock(page);
  await band(page, 'Partners').scrollIntoViewIfNeeded();
  await page.clock.runFor(20000);
  await expect.poll(() => logosInView(page, 'Partners')).toEqual(names.slice(0, 5));
});

test('KAN-11: TC-045 alt mọi logo bằng đúng name trong /api/home, không rỗng, không chung chung; ảnh lazy', async ({ page }) => {
  await openHome(page);
  for (const [key, label] of BANDS) {
    const logos = (await blockContent(page, key)).logos;
    const imgs = bandImgs(page, label);
    await expect(imgs).toHaveCount(logos.length);
    for (let i = 0; i < logos.length; i++) {
      const img = imgs.nth(i);
      await expect(img).toHaveAttribute('alt', logos[i].name);
      await expect(img).toHaveAttribute('src', logos[i].imageUrl);
      await expect(img).toHaveAttribute('loading', 'lazy');
      const alt = (await img.getAttribute('alt')).trim();
      expect(alt.length, `${label} #${i + 1}`).toBeGreaterThan(0);
      expect(alt, `${label} #${i + 1}`).not.toMatch(GENERIC_ALT);
    }
  }
});

test('KAN-11: TC-046 mỗi lúc 1 slide đủ trích dẫn, tên, chức danh, ảnh; tự chuyển sau 8 giây; tab logo chọn slide', async ({ page }) => {
  const data = await blockContent(page, 'testimonials');
  expect(data.items.length).toBeGreaterThanOrEqual(3);
  await openHomeWithClock(page);
  await testi(page).scrollIntoViewIfNeeded();

  await expect(testi(page).getByText('Testimonials', { exact: true })).toBeVisible();
  await expect(panels(page)).toHaveCount(1); // slide ẩn không thuộc cây truy cập
  const first = panels(page).first();
  await expect(first).toContainText(data.items[0].quote);
  await expect(first).toContainText(data.items[0].name);
  await expect(first).toContainText(data.items[0].role);
  const media = first.locator('img').first();
  await expect(media).toBeVisible();
  await expect(media).toHaveAttribute('src', data.items[0].photoUrl);
  await expect(media).toHaveAttribute('loading', 'lazy');

  await expect(tabs(page)).toHaveCount(data.items.length);
  await expect(tabs(page).nth(0)).toHaveAttribute('aria-selected', 'true');
  for (let i = 0; i < data.items.length; i++) {
    await expect(tabs(page).nth(i).locator('img')).toHaveAttribute('src', data.items[i].logoUrl);
    await expect(tabs(page).nth(i).locator('img')).toHaveAttribute('loading', 'lazy');
  }

  await page.clock.runFor(7900);
  await expect(panels(page).first()).toContainText(data.items[0].name);
  await page.clock.runFor(100);
  await expect(panels(page)).toHaveCount(1);
  await expect(panels(page).first()).toContainText(data.items[1].quote);
  await expect(tabs(page).nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs(page).nth(0)).toHaveAttribute('aria-selected', 'false');

  await tabs(page).nth(2).click();
  await expect(panels(page)).toHaveCount(1);
  await expect(panels(page).first()).toContainText(data.items[2].quote);
  await expect(panels(page).first()).toBeVisible();
  for (let i = 0; i < data.items.length; i++) {
    await expect(tabs(page).nth(i)).toHaveAttribute('aria-selected', i === 2 ? 'true' : 'false');
  }
});

// Thêm videoUrl cho testimonial thứ 2 trong phản hồi /api/home; trang video giả để không gọi mạng ngoài
async function routeVideo(page, videoUrl) {
  await page.route('https://video.example.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>video</body></html>' }));
  await page.route('**/api/home**', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const b = body.blocks.find((x) => x.key === 'testimonials');
    b.content.items[1] = { ...b.content.items[1], videoUrl };
    await route.fulfill({ response: res, json: body });
  });
}

for (const [kind, url] of [['iframe', 'https://video.example.com/embed/kan11'], ['video', 'https://video.example.com/kan11.mp4']]) {
  test(`KAN-11: TC-047 slide có videoUrl chỉ có ảnh bìa + nút phát; bấm phát mới chèn ${kind}`, async ({ page }) => {
    const data = await blockContent(page, 'testimonials');
    await routeVideo(page, url);
    await openHomeWithClock(page);
    await testi(page).scrollIntoViewIfNeeded();
    await tabs(page).nth(1).click();
    const slide = panels(page).first();
    await expect(slide).toContainText(data.items[1].quote);

    const cover = slide.locator('img').first();
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute('src', data.items[1].photoUrl);
    const play = slide.getByRole('button', { name: /play video/i });
    await expect(play).toBeVisible();
    await expect(page.locator('iframe, video')).toHaveCount(0);

    await play.click();
    const player = slide.locator(kind);
    await expect(player).toHaveCount(1);
    await expect(player).toHaveAttribute('src', url);
    await expect(page.locator('iframe, video')).toHaveCount(1);
    // đang xem video thì slider không tự chuyển đi
    await page.clock.runFor(20000);
    await expect(panels(page).first()).toContainText(data.items[1].quote);
    await expect(slide.locator(kind)).toHaveCount(1);
  });
}

for (const size of [DESKTOP, TABLET, MOBILE]) {
  test(`KAN-11: TC-023 có ba dải logo và Testimonials, không cuộn ngang ở ${size.width}px`, async ({ page }) => {
    await openHome(page, size);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const { sw, cw } = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    }));
    expect(sw).toBeLessThanOrEqual(cw);
  });
}
