// KAN-13: đồng ý cookie và sự kiện đo lường dataLayer — TC-053, TC-055, TC-056, TC-057 (KAN-48)
import { beforeEach, describe, expect, test } from 'vitest';
import {
  CONSENT_ACCEPTED, CONSENT_KEY, CONSENT_REJECTED, GTM_SCRIPT_ID, SCROLL_MARKS,
  createScrollDepthTracker, gtmSrc, loadGtm, readConsent, saveConsent, scrollPercent, track,
} from './tracking.js';

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
  };
}

// Document tối thiểu cho loadGtm: tạo thẻ, gắn vào head, tìm theo id
function fakeDocument() {
  const byId = new Map();
  const head = {
    children: [],
    appendChild(el) { this.children.push(el); if (el.id) byId.set(el.id, el); return el; },
  };
  return {
    head,
    createElement: (tagName) => ({ tagName: tagName.toUpperCase() }),
    getElementById: (id) => byId.get(id) ?? null,
  };
}

const PAGE_EVENTS = ['cta_click', 'menu_click', 'solution_click', 'case_study_click', 'scroll_depth', 'language_change', 'chat_open'];

describe('KAN-13 lựa chọn cookie (FR-13.1)', () => {
  test('lưu ở localStorage khóa cookie_consent, đọc lại đúng', () => {
    const storage = fakeStorage();
    expect(CONSENT_KEY).toBe('cookie_consent');
    expect(readConsent(storage)).toBe(null);
    saveConsent(CONSENT_ACCEPTED, storage);
    expect(storage.getItem('cookie_consent')).toBe('accepted');
    expect(readConsent(storage)).toBe('accepted');
    saveConsent(CONSENT_REJECTED, storage);
    expect(readConsent(storage)).toBe('rejected');
  });
  test('giá trị lạ trong storage → coi như chưa chọn', () => {
    expect(readConsent(fakeStorage({ cookie_consent: 'yes' }))).toBe(null);
    expect(readConsent(fakeStorage({ cookie_consent: '' }))).toBe(null);
  });
  test('storage bị chặn (ném lỗi) → chưa chọn, ghi không ném lỗi', () => {
    const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(readConsent(broken)).toBe(null);
    expect(() => saveConsent(CONSENT_ACCEPTED, broken)).not.toThrow();
  });
});

describe('KAN-13 track() (FR-13.2, TC-057)', () => {
  let win;
  beforeEach(() => { win = {}; });

  test('chưa chọn: không đẩy sự kiện nào, không tạo dataLayer có sự kiện', () => {
    const storage = fakeStorage();
    for (const e of PAGE_EVENTS) expect(track(e, { label: 'x' }, { win, storage })).toBe(false);
    expect(win.dataLayer ?? []).toEqual([]);
  });

  test('đã Reject: không đẩy sự kiện nào', () => {
    const storage = fakeStorage({ cookie_consent: 'rejected' });
    for (const e of PAGE_EVENTS) expect(track(e, {}, { win, storage })).toBe(false);
    expect(win.dataLayer ?? []).toEqual([]);
  });

  test('đã Accept: đẩy đúng tên sự kiện và tham số, theo thứ tự', () => {
    const storage = fakeStorage({ cookie_consent: 'accepted' });
    expect(track('cta_click', { label: 'Contact Us', location: 'hero' }, { win, storage })).toBe(true);
    track('menu_click', { label: 'Careers' }, { win, storage });
    track('solution_click', undefined, { win, storage });
    track('language_change', { from: 'en', to: 'vi' }, { win, storage });
    track('chat_open', {}, { win, storage });
    expect(win.dataLayer).toEqual([
      { event: 'cta_click', label: 'Contact Us', location: 'hero' },
      { event: 'menu_click', label: 'Careers' },
      { event: 'solution_click' },
      { event: 'language_change', from: 'en', to: 'vi' },
      { event: 'chat_open' },
    ]);
  });

  test('giữ dataLayer đã có (GTM có thể đã tạo trước), chỉ nối thêm', () => {
    const storage = fakeStorage({ cookie_consent: 'accepted' });
    const existing = [{ 'gtm.start': 1 }];
    win.dataLayer = existing;
    track('chat_open', {}, { win, storage });
    expect(win.dataLayer).toBe(existing);
    expect(existing).toEqual([{ 'gtm.start': 1 }, { event: 'chat_open' }]);
  });

  test('tham số không ghi đè được tên sự kiện', () => {
    const storage = fakeStorage({ cookie_consent: 'accepted' });
    track('cta_click', { event: 'other', label: 'A' }, { win, storage });
    expect(win.dataLayer).toEqual([{ event: 'cta_click', label: 'A' }]);
  });
});

describe('KAN-13 scroll_depth (FR-13.3, TC-055, TC-057)', () => {
  test('mốc 25/50/75/100', () => {
    expect(SCROLL_MARKS).toEqual([25, 50, 75, 100]);
  });

  test('chuỗi 10, 30, 30, 60, 100, 100 → 25, 50, 75, 100, mỗi mốc một lần', () => {
    const sent = [];
    const onScroll = createScrollDepthTracker((event, params) => { sent.push({ event, ...params }); return true; });
    for (const p of [10, 30, 30, 60, 100, 100]) onScroll(p);
    expect(sent).toEqual([
      { event: 'scroll_depth', percent: 25 },
      { event: 'scroll_depth', percent: 50 },
      { event: 'scroll_depth', percent: 75 },
      { event: 'scroll_depth', percent: 100 },
    ]);
  });

  test('cuộn lên rồi cuộn xuống lại không lặp mốc', () => {
    const sent = [];
    const onScroll = createScrollDepthTracker((event, params) => { sent.push(params.percent); return true; });
    for (const p of [100, 0, 30, 100]) onScroll(p);
    expect(sent).toEqual([25, 50, 75, 100]);
  });

  test('chưa đồng ý (send trả false) thì mốc chưa tính; đồng ý rồi cuộn tiếp mới đẩy', () => {
    let consent = false;
    const sent = [];
    const onScroll = createScrollDepthTracker((event, params) => {
      if (!consent) return false;
      sent.push(params.percent);
      return true;
    });
    onScroll(60);
    expect(sent).toEqual([]);
    consent = true;
    onScroll(60);
    onScroll(60);
    expect(sent).toEqual([25, 50]);
  });

  test('dùng track thật với storage: chưa đồng ý không đẩy, đồng ý thì đẩy', () => {
    const win = {};
    const storage = fakeStorage();
    const onScroll = createScrollDepthTracker((e, p) => track(e, p, { win, storage }));
    onScroll(100);
    expect(win.dataLayer ?? []).toEqual([]);
    saveConsent(CONSENT_ACCEPTED, storage);
    onScroll(30);
    onScroll(30);
    expect(win.dataLayer).toEqual([{ event: 'scroll_depth', percent: 25 }]);
  });

  test('scrollPercent: phần trang đã thấy (đáy màn hình / chiều cao trang), cuối trang = 100', () => {
    expect(scrollPercent(0, 900, 9000)).toBe(10);
    expect(scrollPercent(1350, 900, 9000)).toBe(25);
    expect(scrollPercent(8100, 900, 9000)).toBe(100);
    // trình duyệt có thể dừng thiếu 1–2px ở cuối trang
    expect(scrollPercent(8098, 900, 9000)).toBe(100);
    expect(scrollPercent(0, 900, 600)).toBe(100);
    expect(scrollPercent(0, 900, 0)).toBe(100);
  });
});

describe('KAN-13 GTM (FR-13.4, TC-056)', () => {
  test('src theo id', () => {
    expect(gtmSrc('GTM-TEST')).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST');
    expect(gtmSrc('GTM A&B')).toBe('https://www.googletagmanager.com/gtm.js?id=GTM%20A%26B');
  });

  test('không có id → không chèn script', () => {
    const doc = fakeDocument();
    const win = {};
    expect(loadGtm('', { doc, win })).toBe(false);
    expect(loadGtm(undefined, { doc, win })).toBe(false);
    expect(loadGtm('   ', { doc, win })).toBe(false);
    expect(doc.head.children).toEqual([]);
    expect(win.dataLayer ?? []).toEqual([]);
  });

  test('có id → chèn một script async với id đó, khởi tạo dataLayer cho GTM; gọi lại không chèn thêm', () => {
    const doc = fakeDocument();
    const win = {};
    expect(loadGtm('GTM-TEST', { doc, win })).toBe(true);
    expect(doc.head.children).toHaveLength(1);
    const s = doc.head.children[0];
    expect(s.tagName).toBe('SCRIPT');
    expect(s.async).toBe(true);
    expect(s.id).toBe(GTM_SCRIPT_ID);
    expect(s.src).toBe('https://www.googletagmanager.com/gtm.js?id=GTM-TEST');
    expect(win.dataLayer).toHaveLength(1);
    expect(win.dataLayer[0].event).toBe('gtm.js');
    expect(typeof win.dataLayer[0]['gtm.start']).toBe('number');

    expect(loadGtm('GTM-TEST', { doc, win })).toBe(false);
    expect(doc.head.children).toHaveLength(1);
    expect(win.dataLayer).toHaveLength(1);
  });
});
