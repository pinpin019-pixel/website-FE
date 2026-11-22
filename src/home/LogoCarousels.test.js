// KAN-11: dải Awards / Certificates / Partners — số logo/khung theo bề rộng, lọc logo, nhãn mũi tên
import { describe, expect, test } from 'vitest';
import { arrowLabels, bandLogos, perViewForWidth } from './LogoCarousels.jsx';

describe('KAN-11 perViewForWidth (FR-07.1)', () => {
  test('5 logo ở 1440px, 4 ở 1024px, 2 ở 390px', () => {
    expect(perViewForWidth(1440)).toBe(5);
    expect(perViewForWidth(1024)).toBe(4);
    expect(perViewForWidth(390)).toBe(2);
  });
  test('mốc responsive của kiến trúc: ≥ 1200 desktop, 768–1199 tablet, < 768 mobile', () => {
    expect(perViewForWidth(1200)).toBe(5);
    expect(perViewForWidth(1199)).toBe(4);
    expect(perViewForWidth(768)).toBe(4);
    expect(perViewForWidth(767)).toBe(2);
  });
});

describe('KAN-11 bandLogos (FR-07.3)', () => {
  test('giữ logo có tên và ảnh, đúng thứ tự; bỏ logo thiếu tên (không hiện alt rỗng)', () => {
    const logos = [
      { name: 'ISO 27001', imageUrl: 'https://x/a.png' },
      { name: '', imageUrl: 'https://x/b.png' },
      { name: 'CMMI Level 5' },
      { name: 'PCI DSS', imageUrl: 'https://x/c.png' },
    ];
    expect(bandLogos({ logos }).map((l) => l.name)).toEqual(['ISO 27001', 'PCI DSS']);
    expect(bandLogos(undefined)).toEqual([]);
  });
});

describe('KAN-11 arrowLabels', () => {
  test('mũi tên có tên truy cập riêng cho từng dải', () => {
    expect(arrowLabels('en', 'Awards')).toEqual({ prev: 'Previous Awards', next: 'Next Awards' });
    expect(arrowLabels('vi', 'Partners')).toEqual({ prev: 'Partners trước', next: 'Partners sau' });
  });
});
