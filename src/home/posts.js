// KAN-10: dữ liệu bài viết cho khối Case Studies và Media; hook gọi GET /api/posts
import { useEffect, useState } from 'react';
import { listPosts } from '../api.js';
import { formatDate } from '../i18n.js';
import { safeHref } from './Hero.jsx';

// Giữ thứ tự API, bỏ bài không có tiêu đề; link chi tiết đi qua safeHref
export function postCards(posts) {
  if (!Array.isArray(posts)) return [];
  return posts
    .filter((p) => p && typeof p.title === 'string' && p.title.trim())
    .map((p) => ({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt || '',
      imageUrl: p.imageUrl || '',
      url: safeHref(p.url),
      publishedAt: p.publishedAt,
    }));
}

// Bài đầu là tin nổi bật, tối đa 3 bài sau là danh sách; kèm ngày định dạng theo ngôn ngữ
export function splitMedia(posts, lang) {
  const cards = postCards(posts).map((p) => ({ ...p, date: formatDate(p.publishedAt, lang) }));
  return { featured: cards[0] ?? null, list: cards.slice(1, 4) };
}

// Số bài của khối lấy từ content.limit; thiếu hoặc lạ → 4 (backend vẫn kẹp 1–12)
export function blockLimit(content) {
  const n = content?.limit;
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : 4;
}

// { status: 'loading' | 'ok' | 'error', posts }
export function usePosts(type, limit, lang) {
  const [state, setState] = useState({ status: 'loading', posts: [] });
  useEffect(() => {
    let alive = true;
    setState((s) => ({ status: 'loading', posts: s.posts }));
    listPosts({ type, limit, lang })
      .then((posts) => { if (alive) setState({ status: 'ok', posts }); })
      .catch(() => { if (alive) setState({ status: 'error', posts: [] }); });
    return () => { alive = false; };
  }, [type, limit, lang]);
  return state;
}
