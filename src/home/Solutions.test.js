// KAN-9: Solutions — chọn thẻ từ dữ liệu, mô tả cắt 50 từ, link an toàn
import { describe, expect, test } from 'vitest';
import { solutionCards } from './Solutions.jsx';

const long = Array.from({ length: 60 }, (_, i) => `w${i + 1}`).join(' ');

describe('KAN-9 solutionCards', () => {
  test('giữ đúng thứ tự, bỏ thẻ không có tiêu đề', () => {
    const cards = [
      { title: 'A', description: 'a', imageUrl: 'https://x/a.png', href: '#' },
      { title: '', description: 'b' },
      null,
      { title: 'C', description: 'c', imageUrl: 'https://x/c.png', href: '#' },
    ];
    expect(solutionCards({ cards }).map((c) => c.title)).toEqual(['A', 'C']);
  });
  test('mô tả > 50 từ bị cắt, ≤ 50 từ giữ nguyên (FR-04.3)', () => {
    const [a, b] = solutionCards({ cards: [{ title: 'A', description: long }, { title: 'B', description: 'short text' }] });
    expect(a.description.split(' ')).toHaveLength(50);
    expect(a.description.endsWith('w50…')).toBe(true);
    expect(b.description).toBe('short text');
  });
  test('href chỉ nhận http(s)/đường dẫn; javascript: → #; thiếu → #', () => {
    const out = solutionCards({ cards: [
      { title: 'A', href: 'javascript:alert(1)' },
      { title: 'B', href: 'https://cmcglobal.com.vn/x/' },
      { title: 'C' },
    ] });
    expect(out.map((c) => c.href)).toEqual(['#', 'https://cmcglobal.com.vn/x/', '#']);
  });
  test('thiếu dữ liệu → mảng rỗng', () => {
    expect(solutionCards(undefined)).toEqual([]);
    expect(solutionCards({ cards: 'x' })).toEqual([]);
  });
});
