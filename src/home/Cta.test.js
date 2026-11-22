// KAN-12: khối CTA cuối trang — đọc nội dung từ dữ liệu
import { describe, expect, test } from 'vitest';
import { ctaContent } from './Cta.jsx';

describe('KAN-12 ctaContent', () => {
  test('đủ dữ liệu → tiêu đề, nhãn nút, link', () => {
    expect(ctaContent({
      title: 'Maximize Your ROI in the Cloud',
      ctaLabel: "Let's Chat!",
      ctaHref: 'https://cmcglobal.com.vn/contact-us/',
    })).toEqual({
      title: 'Maximize Your ROI in the Cloud',
      label: "Let's Chat!",
      href: 'https://cmcglobal.com.vn/contact-us/',
    });
  });
  test('link không an toàn hoặc thiếu → "#"', () => {
    expect(ctaContent({ title: 'T', ctaLabel: 'L', ctaHref: 'javascript:alert(1)' }).href).toBe('#');
    expect(ctaContent({ title: 'T', ctaLabel: 'L' }).href).toBe('#');
  });
  test('thiếu nhãn nút → không có nút (label rỗng)', () => {
    expect(ctaContent({ title: 'T', ctaHref: '/x' }).label).toBe('');
    expect(ctaContent({ title: 'T', ctaLabel: '   ' }).label).toBe('');
  });
  test('thiếu tiêu đề và nhãn → null (không dựng khối)', () => {
    expect(ctaContent({})).toBeNull();
    expect(ctaContent(undefined)).toBeNull();
    expect(ctaContent({ title: '  ', ctaLabel: '' })).toBeNull();
  });
});
