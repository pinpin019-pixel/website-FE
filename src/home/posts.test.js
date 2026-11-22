// KAN-10: dữ liệu thẻ Case Studies, chia tin Media, gọi API listPosts
import { afterEach, describe, expect, test, vi } from 'vitest';
import { postCards, splitMedia } from './posts.js';
import { listPosts } from '../api.js';

const post = (i, extra = {}) => ({
  id: i, type: 'news', lang: 'en', title: `T${i}`, excerpt: `E${i}`,
  imageUrl: `https://x/${i}.webp`, url: `https://x/p/${i}`, pinned: false,
  publishedAt: '2026-11-18T12:00:00.000Z', ...extra,
});

describe('KAN-10 postCards', () => {
  test('giữ thứ tự API, bỏ bài không có tiêu đề, đủ trường hiển thị', () => {
    const out = postCards([post(1), { ...post(2), title: '' }, null, post(3)]);
    expect(out.map((p) => p.title)).toEqual(['T1', 'T3']);
    expect(out[0]).toMatchObject({ id: 1, title: 'T1', excerpt: 'E1', imageUrl: 'https://x/1.webp', url: 'https://x/p/1' });
  });
  test('url không an toàn hoặc thiếu → "#"', () => {
    const out = postCards([post(1, { url: 'javascript:alert(1)' }), post(2, { url: null }), post(3, { url: '#' })]);
    expect(out.map((p) => p.url)).toEqual(['#', '#', '#']);
  });
  test('không phải mảng → []', () => {
    expect(postCards(undefined)).toEqual([]);
    expect(postCards({})).toEqual([]);
  });
});

describe('KAN-10 splitMedia (FR-08.2)', () => {
  test('bài đầu là tin nổi bật, 3 bài sau là danh sách; ngày định dạng theo ngôn ngữ', () => {
    const { featured, list } = splitMedia([post(1), post(2), post(3), post(4), post(5)], 'vi');
    expect(featured.title).toBe('T1');
    expect(featured.date).toBe('18/11/2026');
    expect(list.map((p) => p.title)).toEqual(['T2', 'T3', 'T4']);
    expect(list[0].date).toBe('18/11/2026');
  });
  test('en dùng "November 18, 2026"', () => {
    expect(splitMedia([post(1)], 'en').featured.date).toBe('November 18, 2026');
  });
  test('ít bài hoặc không có bài', () => {
    expect(splitMedia([post(1)], 'en').list).toEqual([]);
    expect(splitMedia([], 'en')).toEqual({ featured: null, list: [] });
    expect(splitMedia(undefined, 'en')).toEqual({ featured: null, list: [] });
  });
});

describe('KAN-10 listPosts', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  test('gọi GET /api/posts với type, limit, lang và trả mảng', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([post(1)]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const data = await listPosts({ type: 'case_study', limit: 4, lang: 'ja' });
    expect(fetchMock).toHaveBeenCalledWith('/api/posts?type=case_study&limit=4&lang=ja');
    expect(data).toEqual([post(1)]);
  });
  test('API lỗi → ném lỗi', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'x' }), { status: 500 })));
    await expect(listPosts({ type: 'news', limit: 4, lang: 'en' })).rejects.toThrow();
  });
});
