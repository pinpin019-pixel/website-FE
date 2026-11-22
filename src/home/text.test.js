// KAN-9: TC-032 — cắt mô tả thẻ Solutions còn 50 từ (FR-04.3)
import { describe, expect, test } from 'vitest';
import { truncateWords } from './text.js';

const words = (n) => Array.from({ length: n }, (_, i) => `w${i + 1}`).join(' ');

describe('KAN-9 truncateWords', () => {
  test('49 và 50 từ giữ nguyên', () => {
    expect(truncateWords(words(49))).toBe(words(49));
    expect(truncateWords(words(50))).toBe(words(50));
  });
  test('51 từ → 50 từ đầu + "…"', () => {
    expect(truncateWords(words(51))).toBe(`${words(50)}…`);
  });
  test('nhiều khoảng trắng, xuống dòng giữa các từ: đếm theo từ, không theo ký tự trắng', () => {
    const spaced = Array.from({ length: 50 }, (_, i) => `w${i + 1}`).join('  \n\t ');
    expect(truncateWords(spaced)).toBe(spaced);
    const long = `  ${Array.from({ length: 52 }, (_, i) => `w${i + 1}`).join('   ')}  `;
    expect(truncateWords(long)).toBe(`${words(50)}…`);
  });
  test('giới hạn khác 50 khi truyền vào', () => {
    expect(truncateWords('a b c d', 3)).toBe('a b c…');
    expect(truncateWords('a b c', 3)).toBe('a b c');
  });
  test('giá trị rỗng hoặc không phải chuỗi → chuỗi rỗng', () => {
    expect(truncateWords('')).toBe('');
    expect(truncateWords(undefined)).toBe('');
    expect(truncateWords(null)).toBe('');
  });
});
