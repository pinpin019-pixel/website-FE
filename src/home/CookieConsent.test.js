// KAN-13: banner đồng ý cookie (FR-13.1) — phần logic không cần DOM
import { describe, expect, test } from 'vitest';
import { bannerVisible } from './CookieConsent.jsx';
import { t } from '../i18n.js';

describe('KAN-13 bannerVisible (FR-13.1)', () => {
  test('chỉ hiện khi chưa chọn', () => {
    expect(bannerVisible(null)).toBe(true);
    expect(bannerVisible('accepted')).toBe(false);
    expect(bannerVisible('rejected')).toBe(false);
  });
});

describe('KAN-13 chuỗi banner cookie', () => {
  test('en: nút "Accept" và "Reject", có lời giải thích và tên vùng', () => {
    expect(t('en', 'cookieAccept')).toBe('Accept');
    expect(t('en', 'cookieReject')).toBe('Reject');
    expect(t('en', 'cookieMessage')).toMatch(/cookie/i);
    expect(t('en', 'cookieRegion')).toMatch(/cookie/i);
  });
  test('vi có bản dịch riêng', () => {
    for (const key of ['cookieAccept', 'cookieReject', 'cookieMessage', 'cookieRegion']) {
      expect(t('vi', key)).not.toBe(key);
      expect(t('vi', key)).not.toBe(t('en', key));
    }
  });
});
