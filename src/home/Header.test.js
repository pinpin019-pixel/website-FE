// KAN-7: Header — đổi ngôn ngữ giữ nguyên các tham số khác; mục có menu con
import { describe, expect, test } from 'vitest';
import { hasSubmenu, withLang } from './Header.jsx';
import { t } from '../i18n.js';

describe('KAN-7 withLang', () => {
  test('thêm lang khi chưa có', () => {
    expect(withLang('', 'vi').toString()).toBe('lang=vi');
  });
  test('thay lang cũ, giữ tham số khác', () => {
    expect(withLang('?a=1&lang=en&b=2', 'ko').toString()).toBe('a=1&lang=ko&b=2');
  });
  test('nhận URLSearchParams, không sửa đối tượng gốc', () => {
    const p = new URLSearchParams('lang=en');
    expect(withLang(p, 'ja').get('lang')).toBe('ja');
    expect(p.get('lang')).toBe('en');
  });
});

describe('KAN-7 hasSubmenu', () => {
  test('có columns chứa link → true', () => {
    expect(hasSubmenu({ label: 'Services', columns: [{ links: [{ label: 'a', href: '#' }] }] })).toBe(true);
  });
  test('không có columns hoặc columns rỗng → false', () => {
    expect(hasSubmenu({ label: 'Careers', href: '#' })).toBe(false);
    expect(hasSubmenu({ label: 'X', columns: [] })).toBe(false);
    expect(hasSubmenu({ label: 'Y', columns: [{ links: [] }] })).toBe(false);
  });
});

describe('KAN-7 chuỗi giao diện header/footer', () => {
  test('en có nhãn nút menu, bộ chọn ngôn ngữ, nhãn liên hệ', () => {
    expect(t('en', 'menu')).toBe('Menu');
    expect(t('en', 'language')).toBe('Language');
    expect(t('en', 'address')).toBe('Address');
    expect(t('en', 'email')).toBe('Email');
    expect(t('en', 'phone')).toBe('Phone');
  });
  test('vi có bản dịch riêng; ja dùng chuỗi en', () => {
    expect(t('vi', 'language')).toBe('Ngôn ngữ');
    expect(t('vi', 'phone')).toBe('Điện thoại');
    expect(t('ja', 'menu')).toBe('Menu');
  });
});
