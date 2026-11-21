import { describe, expect, test } from 'vitest';
import { formatPrice } from './format.js';

describe('formatPrice', () => {
  test('thêm dấu chấm phân cách hàng nghìn và ký hiệu ₫', () => {
    expect(formatPrice(150000)).toBe('150.000 ₫');
    expect(formatPrice(1234567)).toBe('1.234.567 ₫');
  });
  test('số nhỏ không có dấu chấm', () => {
    expect(formatPrice(0)).toBe('0 ₫');
    expect(formatPrice(999)).toBe('999 ₫');
  });
  test('nhận chuỗi số, bỏ qua giá trị không phải số', () => {
    expect(formatPrice('45000')).toBe('45.000 ₫');
    expect(formatPrice('abc')).toBe('');
  });
});
