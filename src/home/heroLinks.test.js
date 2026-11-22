// KAN-8 (sau review vòng 1): link CTA lấy từ dữ liệu chỉ nhận scheme an toàn
import { describe, expect, test } from 'vitest';
import { safeHref } from './Hero.jsx';

describe('KAN-8 safeHref', () => {
  test('giữ http(s), mailto, tel, đường dẫn tương đối, #', () => {
    for (const h of ['https://cmcglobal.com.vn/contact-us/', 'http://x.y', 'mailto:a@b.c', 'tel:+84', '/contact', '#contact', 'contact']) {
      expect(safeHref(h)).toBe(h);
    }
  });
  test('scheme nguy hiểm, rỗng hoặc không phải chuỗi → #', () => {
    for (const h of ['javascript:alert(1)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,x', 'vbscript:x', '', undefined, null, 5]) {
      expect(safeHref(h)).toBe('#');
    }
  });
});
