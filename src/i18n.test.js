// KAN-6: ngôn ngữ hiện tại, chuỗi giao diện, formatDate
import { describe, expect, test } from 'vitest';
import { SUPPORTED, formatDate, normalizeLang, resolveLang, t } from './i18n.js';

describe('KAN-6 normalizeLang', () => {
  test('nhận en/vi/ja/ko', () => {
    expect(SUPPORTED).toEqual(['en', 'vi', 'ja', 'ko']);
    for (const l of SUPPORTED) expect(normalizeLang(l)).toBe(l);
  });
  test('giá trị lạ hoặc trống → en', () => {
    for (const x of [undefined, null, '', 'fr', 'VI ', 'xx', 3]) expect(normalizeLang(x)).toBe('en');
  });
});

describe('KAN-6 resolveLang(query, stored)', () => {
  test('query ưu tiên hơn localStorage', () => {
    expect(resolveLang('ja', 'vi')).toBe('ja');
  });
  test('không có query thì lấy localStorage', () => {
    expect(resolveLang(null, 'vi')).toBe('vi');
    expect(resolveLang('', 'ko')).toBe('ko');
  });
  test('không có gì → en', () => {
    expect(resolveLang(null, null)).toBe('en');
  });
  test('giá trị lạ → en (query lạ không rơi về localStorage)', () => {
    expect(resolveLang('xx', 'vi')).toBe('en');
    expect(resolveLang(null, 'zz')).toBe('en');
  });
});

describe('KAN-6 t(lang, key)', () => {
  test('có chuỗi en và vi cho thông báo lỗi trang chủ', () => {
    expect(t('en', 'homeLoadError')).toBeTruthy();
    expect(t('vi', 'homeLoadError')).toBeTruthy();
    expect(t('vi', 'homeLoadError')).not.toBe(t('en', 'homeLoadError'));
  });
  test('ngôn ngữ chưa có chuỗi (ja) → dùng chuỗi en', () => {
    expect(t('ja', 'homeLoadError')).toBe(t('en', 'homeLoadError'));
  });
});

describe('KAN-6 formatDate', () => {
  const d = new Date(2026, 10, 22);
  test('en: "Nov 22, 2026"', () => {
    expect(formatDate(d, 'en')).toBe('Nov 22, 2026');
  });
  test('vi: "22/11/2026"', () => {
    expect(formatDate(d, 'vi')).toBe('22/11/2026');
  });
  test('nhận chuỗi ISO; giá trị không phải ngày → chuỗi rỗng', () => {
    expect(formatDate('2026-01-05T08:00:00', 'vi')).toBe('05/01/2026');
    expect(formatDate('abc', 'en')).toBe('');
  });
});
