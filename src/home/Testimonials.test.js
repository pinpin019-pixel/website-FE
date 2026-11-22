// KAN-11: slider Testimonials — lọc item, chu kỳ 8 giây, nguồn video chỉ nhận http(s)
import { describe, expect, test } from 'vitest';
import { TESTIMONIAL_INTERVAL_MS, slideMedia, testimonialInterval, testimonialItems, videoSource } from './Testimonials.jsx';

describe('KAN-11 slideMedia (sau review: alt đúng nghĩa ảnh)', () => {
  test('ảnh chân dung riêng → alt là tên người', () => {
    expect(slideMedia({ name: 'Mr. A', company: 'Acme', photoUrl: 'https://x/p.jpg', logoUrl: 'https://x/l.png' }))
      .toEqual({ src: 'https://x/p.jpg', alt: 'Mr. A' });
  });
  test('ảnh chính là logo (trùng logoUrl hoặc không có photoUrl) → alt là tên công ty', () => {
    expect(slideMedia({ name: 'Mr. B', company: 'Envato', photoUrl: 'https://x/l.png', logoUrl: 'https://x/l.png' }))
      .toEqual({ src: 'https://x/l.png', alt: 'Envato' });
    expect(slideMedia({ name: 'Mr. C', company: 'Kaon', logoUrl: 'https://x/k.png' }))
      .toEqual({ src: 'https://x/k.png', alt: 'Kaon' });
  });
  test('logo không có tên công ty → alt là tên người; không có ảnh → null', () => {
    expect(slideMedia({ name: 'Mr. D', logoUrl: 'https://x/d.png' })).toEqual({ src: 'https://x/d.png', alt: 'Mr. D' });
    expect(slideMedia({ name: 'Mr. E' })).toBeNull();
  });
});

describe('KAN-11 testimonialItems (FR-09.1)', () => {
  test('giữ item có trích dẫn và tên, đúng thứ tự', () => {
    const items = [
      { quote: 'Q1', name: 'A', role: 'CTO' },
      { quote: '', name: 'B' },
      { quote: 'Q3', name: '  ' },
      null,
      { quote: 'Q5', name: 'E' },
    ];
    expect(testimonialItems({ items }).map((i) => i.name)).toEqual(['A', 'E']);
  });
  test('thiếu dữ liệu → mảng rỗng', () => {
    expect(testimonialItems(undefined)).toEqual([]);
    expect(testimonialItems({ items: 'x' })).toEqual([]);
  });
});

describe('KAN-11 testimonialInterval (FR-09.1)', () => {
  test('mặc định 8 giây; dùng intervalMs dương của dữ liệu', () => {
    expect(TESTIMONIAL_INTERVAL_MS).toBe(8000);
    expect(testimonialInterval({})).toBe(8000);
    expect(testimonialInterval({ intervalMs: 0 })).toBe(8000);
    expect(testimonialInterval({ intervalMs: '5000' })).toBe(8000);
    expect(testimonialInterval({ intervalMs: 5000 })).toBe(5000);
  });
});

describe('KAN-11 videoSource (FR-09.3)', () => {
  test('file video → thẻ video; URL khác → iframe', () => {
    expect(videoSource('https://cdn.example.com/a.mp4')).toEqual({ kind: 'video', src: 'https://cdn.example.com/a.mp4' });
    expect(videoSource('https://cdn.example.com/a.WEBM?x=1')).toEqual({ kind: 'video', src: 'https://cdn.example.com/a.WEBM?x=1' });
    expect(videoSource('https://www.youtube.com/embed/abc')).toEqual({ kind: 'iframe', src: 'https://www.youtube.com/embed/abc' });
  });
  test('không có hoặc không phải http(s) → null (không có nút phát)', () => {
    for (const x of [undefined, null, '', '   ', 'javascript:alert(1)', 'data:text/html,x', '/local.mp4', 5]) {
      expect(videoSource(x)).toBeNull();
    }
  });
});
