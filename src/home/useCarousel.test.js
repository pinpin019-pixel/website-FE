// KAN-8: TC-030 — logic carousel dùng chung (hero, dải logo): tới/lùi, quay vòng, tự chuyển, dừng/chạy
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import useCarousel, { createCarousel, wrapIndex } from './useCarousel.js';

describe('KAN-8 wrapIndex', () => {
  test('giữ nguyên chỉ số trong khoảng, quay vòng khi vượt hai đầu', () => {
    expect(wrapIndex(2, 5)).toBe(2);
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(11, 5)).toBe(1);
  });
  test('count 0 hoặc 1 → luôn 0', () => {
    expect(wrapIndex(3, 0)).toBe(0);
    expect(wrapIndex(-2, 1)).toBe(0);
  });
});

describe('KAN-8 createCarousel', () => {
  let c;
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { c?.stop(); vi.useRealTimers(); });

  test('next/prev ở giữa, ở đầu, ở cuối quay vòng', () => {
    c = createCarousel({ count: 3, intervalMs: 6000 });
    expect(c.index).toBe(0);
    c.next(); expect(c.index).toBe(1);
    c.next(); expect(c.index).toBe(2);
    c.next(); expect(c.index).toBe(0);
    c.prev(); expect(c.index).toBe(2);
    c.prev(); expect(c.index).toBe(1);
    c.goTo(0); c.prev(); expect(c.index).toBe(2);
  });

  test('goTo chuyển tới chỉ số chỉ định', () => {
    c = createCarousel({ count: 5, intervalMs: 6000 });
    c.goTo(3);
    expect(c.index).toBe(3);
  });

  test('tự chuyển đúng sau mỗi intervalMs khi đã start, quay vòng về đầu', () => {
    c = createCarousel({ count: 3, intervalMs: 6000 });
    c.start();
    expect(c.playing).toBe(true);
    vi.advanceTimersByTime(5999); expect(c.index).toBe(0);
    vi.advanceTimersByTime(1); expect(c.index).toBe(1);
    vi.advanceTimersByTime(6000); expect(c.index).toBe(2);
    vi.advanceTimersByTime(6000); expect(c.index).toBe(0);
  });

  test('chưa start thì không tự chuyển', () => {
    c = createCarousel({ count: 3, intervalMs: 3000 });
    vi.advanceTimersByTime(10000);
    expect(c.index).toBe(0);
    expect(c.playing).toBe(false);
  });

  test('pause dừng tự chuyển, resume chạy lại sau đủ một intervalMs', () => {
    c = createCarousel({ count: 4, intervalMs: 6000 });
    c.start();
    vi.advanceTimersByTime(3000);
    c.pause();
    expect(c.paused).toBe(true);
    expect(c.playing).toBe(false);
    vi.advanceTimersByTime(30000);
    expect(c.index).toBe(0);
    c.resume();
    expect(c.paused).toBe(false);
    expect(c.playing).toBe(true);
    vi.advanceTimersByTime(5999); expect(c.index).toBe(0);
    vi.advanceTimersByTime(1); expect(c.index).toBe(1);
  });

  test('dừng do rê chuột và dừng do người dùng độc lập nhau', () => {
    c = createCarousel({ count: 3, intervalMs: 6000 });
    c.start();
    c.pause('hover');
    expect(c.paused).toBe(false); // nút Tạm dừng vẫn ở trạng thái "đang chạy"
    expect(c.playing).toBe(false);
    c.pause('user');
    c.resume('hover');
    expect(c.paused).toBe(true);
    vi.advanceTimersByTime(20000);
    expect(c.index).toBe(0);
    c.resume('user');
    vi.advanceTimersByTime(6000);
    expect(c.index).toBe(1);
  });

  test('chuyển tay (next/prev/goTo) đặt lại bộ đếm tự chuyển', () => {
    c = createCarousel({ count: 5, intervalMs: 6000 });
    c.start();
    vi.advanceTimersByTime(4000);
    c.next();
    expect(c.index).toBe(1);
    vi.advanceTimersByTime(4000); expect(c.index).toBe(1);
    vi.advanceTimersByTime(2000); expect(c.index).toBe(2);
  });

  test('chỉ 1 vị trí → không tự chuyển, next/prev giữ 0', () => {
    c = createCarousel({ count: 1, intervalMs: 3000 });
    c.start();
    expect(c.playing).toBe(false);
    vi.advanceTimersByTime(10000);
    c.next(); c.prev();
    expect(c.index).toBe(0);
  });

  test('setCount nhỏ hơn kẹp chỉ số về vị trí cuối mới', () => {
    c = createCarousel({ count: 9, intervalMs: 3000 });
    c.goTo(8);
    c.setCount(3);
    expect(c.index).toBe(2);
    c.next();
    expect(c.index).toBe(0);
  });

  test('subscribe được báo mỗi khi đổi chỉ số hoặc trạng thái; stop dừng hẳn', () => {
    c = createCarousel({ count: 3, intervalMs: 1000 });
    const fn = vi.fn();
    const off = c.subscribe(fn);
    c.start();
    c.next();
    c.pause();
    expect(fn).toHaveBeenCalled();
    const calls = fn.mock.calls.length;
    off();
    c.next();
    expect(fn.mock.calls.length).toBe(calls);
    c.resume();
    c.stop();
    vi.advanceTimersByTime(5000);
    expect(c.index).toBe(2);
  });
});

describe('KAN-8 useCarousel', () => {
  test('là hook (hàm) được export mặc định', () => {
    expect(typeof useCarousel).toBe('function');
  });
});
