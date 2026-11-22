// KAN-12: nút chat + lời chào, nút Back to top — phần logic không cần DOM
import { describe, expect, test } from 'vitest';
import {
  GREETING_AUTOHIDE_MS, chatGreeting, greetingAutoHides, showBackToTop,
} from './Floating.jsx';
import { t } from '../i18n.js';

describe('KAN-12 chatGreeting', () => {
  test('lấy lời chào từ floating.chatGreeting, bỏ khoảng trắng hai đầu', () => {
    expect(chatGreeting({ chatGreeting: ' Thank you for checking out our services. ' }))
      .toBe('Thank you for checking out our services.');
  });
  test('thiếu, rỗng hoặc không phải chuỗi → ""', () => {
    expect(chatGreeting(undefined)).toBe('');
    expect(chatGreeting(null)).toBe('');
    expect(chatGreeting({})).toBe('');
    expect(chatGreeting({ chatGreeting: '   ' })).toBe('');
    expect(chatGreeting({ chatGreeting: 42 })).toBe('');
  });
});

describe('KAN-12 greetingAutoHides (FR-12.1)', () => {
  test('tự ẩn sau 5 giây', () => {
    expect(GREETING_AUTOHIDE_MS).toBe(5000);
  });
  test('< 768px tự ẩn; ≥ 768px không tự ẩn', () => {
    expect(greetingAutoHides(390)).toBe(true);
    expect(greetingAutoHides(767)).toBe(true);
    expect(greetingAutoHides(768)).toBe(false);
    expect(greetingAutoHides(1440)).toBe(false);
  });
});

describe('KAN-12 showBackToTop (FR-12.2)', () => {
  test('chỉ hiện khi đã cuộn quá 1 chiều cao màn hình', () => {
    expect(showBackToTop(0, 900)).toBe(false);
    expect(showBackToTop(899, 900)).toBe(false);
    expect(showBackToTop(900, 900)).toBe(false);
    expect(showBackToTop(901, 900)).toBe(true);
    expect(showBackToTop(5000, 900)).toBe(true);
  });
});

describe('KAN-12 chuỗi giao diện', () => {
  test('có tên truy cập cho nút chat, nút đóng lời chào, Back to top (en, vi)', () => {
    expect(t('en', 'backToTop')).toBe('Back to top');
    expect(t('en', 'chat')).toBe('Chat');
    expect(t('en', 'closeGreeting')).toBe('Close greeting');
    for (const key of ['backToTop', 'chat', 'closeGreeting']) {
      expect(t('vi', key)).not.toBe(key);
      expect(t('vi', key)).not.toBe(t('en', key));
    }
  });
});
