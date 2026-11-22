// KAN-8: dải logo khách hàng — chỉ logo có trong dữ liệu, số logo/khung, số vị trí cuộn
import { describe, expect, test } from 'vitest';
import { CLIENT_STEP_MS, perViewFor, positionsFor, visibleLogos } from './ClientStrip.jsx';

describe('KAN-8 visibleLogos', () => {
  test('giữ logo có name và imageUrl, đúng thứ tự', () => {
    const logos = [
      { name: 'A', imageUrl: 'https://x/a.png' },
      { name: '', imageUrl: 'https://x/b.png' },
      { name: 'C' },
      null,
      { name: '  ', imageUrl: 'https://x/d.png' },
      { name: 'E', imageUrl: 'https://x/e.png' },
    ];
    expect(visibleLogos({ logos }).map((l) => l.name)).toEqual(['A', 'E']);
  });
  test('thiếu dữ liệu → mảng rỗng', () => {
    expect(visibleLogos(undefined)).toEqual([]);
    expect(visibleLogos({ logos: {} })).toEqual([]);
  });
});

describe('KAN-8 perViewFor, positionsFor', () => {
  test('6 logo/khung ở ≥ 768px, 3 ở < 768px (FR-03.1)', () => {
    expect(perViewFor(true)).toBe(6);
    expect(perViewFor(false)).toBe(3);
  });
  test('số vị trí cuộn = số logo − số logo/khung + 1, tối thiểu 1', () => {
    expect(positionsFor(14, 6)).toBe(9);
    expect(positionsFor(14, 3)).toBe(12);
    expect(positionsFor(6, 6)).toBe(1);
    expect(positionsFor(2, 6)).toBe(1);
    expect(positionsFor(0, 3)).toBe(1);
  });
  test('tự cuộn 3 giây/bước (FR-03.2)', () => {
    expect(CLIENT_STEP_MS).toBe(3000);
  });
});
