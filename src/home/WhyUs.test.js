// KAN-9: Why Choose Us — chỉ số từ dữ liệu, giá trị số đếm theo thời gian (FR-05.2, FR-05.3)
import { describe, expect, test } from 'vitest';
import { COUNT_DURATION_MS, countValue, whyStats } from './WhyUs.jsx';

describe('KAN-9 whyStats', () => {
  test('giữ chỉ số có value số ≥ 0 và label, đúng thứ tự; suffix mặc định rỗng', () => {
    const stats = [
      { value: 32, suffix: '+', label: 'Years' },
      { value: 'x', suffix: '+', label: 'Bad' },
      { value: 5, label: '' },
      null,
      { value: 30, label: 'Countries' },
    ];
    expect(whyStats({ stats })).toEqual([
      { value: 32, suffix: '+', label: 'Years' },
      { value: 30, suffix: '', label: 'Countries' },
    ]);
  });
  test('thiếu dữ liệu → mảng rỗng', () => {
    expect(whyStats(undefined)).toEqual([]);
    expect(whyStats({ stats: {} })).toEqual([]);
  });
});

describe('KAN-9 countValue', () => {
  test('đếm trong 1,5 giây', () => {
    expect(COUNT_DURATION_MS).toBe(1500);
  });
  test('bắt đầu 0, kết thúc đúng giá trị, giữa chừng 0 < x < đích, không giảm', () => {
    expect(countValue(3000, 0)).toBe(0);
    expect(countValue(3000, 1500)).toBe(3000);
    expect(countValue(3000, 5000)).toBe(3000);
    const mid = countValue(3000, 500);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(3000);
    let prev = 0;
    for (let t = 0; t <= 1500; t += 50) {
      const v = countValue(32, t);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
  test('thời gian âm → 0', () => {
    expect(countValue(30, -10)).toBe(0);
  });
});
