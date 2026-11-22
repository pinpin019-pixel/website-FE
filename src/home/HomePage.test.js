// KAN-6: chọn khối dựng theo BLOCK_COMPONENTS, lấy nội dung seo
import { describe, expect, test } from 'vitest';
import { BLOCK_COMPONENTS, renderableBlocks, seoOf } from './HomePage.jsx';

const Fake = () => null;

describe('KAN-6 renderableBlocks', () => {
  test('chỉ giữ khối có component, giữ nguyên thứ tự', () => {
    const blocks = [
      { key: 'b', lang: 'en', content: {} },
      { key: 'unknown', lang: 'en', content: {} },
      { key: 'a', lang: 'en', content: {} },
    ];
    expect(renderableBlocks(blocks, { a: Fake, b: Fake }).map((x) => x.key)).toEqual(['b', 'a']);
  });
  test('khối seo không có component nên không dựng; danh sách rỗng/thiếu không lỗi', () => {
    expect(BLOCK_COMPONENTS.seo).toBeUndefined();
    expect(renderableBlocks([{ key: 'seo', lang: 'en', content: {} }])).toEqual([]);
    expect(renderableBlocks(undefined)).toEqual([]);
  });
});

describe('KAN-6 seoOf', () => {
  test('trả content của khối seo', () => {
    const content = { title: 'T', description: 'D' };
    expect(seoOf([{ key: 'hero', content: {} }, { key: 'seo', lang: 'en', content }])).toEqual(content);
  });
  test('không có khối seo → null', () => {
    expect(seoOf([{ key: 'hero', content: {} }])).toBeNull();
    expect(seoOf(undefined)).toBeNull();
  });
});
