// KAN-10: khối Media – Latest news & events. Bài news đầu là tin nổi bật (ảnh lớn, tiêu đề, ngày, trích đoạn),
// 3 bài sau dạng danh sách (ảnh nhỏ, tiêu đề, ngày). API lỗi → thông báo nhỏ trong khối.
import React from 'react';
import { safeHref } from './Hero.jsx';
import { blockLimit, splitMedia, usePosts } from './posts.js';
import { t } from '../i18n.js';

export default function Media({ content, lang }) {
  const c = content || {};
  const { status, posts } = usePosts('news', blockLimit(c), lang);
  const { featured, list } = splitMedia(posts, lang);
  return (
    <section className="media" aria-labelledby="media-title">
      <div className="posts__inner">
        {c.label && <div className="section-label">{c.label}</div>}
        <h2 id="media-title" className="section-title media__title">{c.title}</h2>
        {status === 'error' && <p className="posts__error" role="status">{t(lang, 'postsLoadError')}</p>}
        {featured && (
          <div className="media__grid">
            <article className="media__featured">
              <a className="media__featured-link" href={featured.url}>
                {featured.imageUrl && <img className="media__featured-img" src={featured.imageUrl} alt={featured.title} loading="lazy" />}
                <h3>{featured.title}</h3>
              </a>
              <time dateTime={featured.publishedAt}>{featured.date}</time>
              {featured.excerpt && <p>{featured.excerpt}</p>}
            </article>
            {list.length > 0 && (
              <ul className="media__list">
                {list.map((p) => (
                  <li key={p.id ?? p.title}>
                    <a className="media__item" href={p.url}>
                      {p.imageUrl && <img className="media__item-img" src={p.imageUrl} alt={p.title} loading="lazy" />}
                      <div>
                        <h4>{p.title}</h4>
                        <time dateTime={p.publishedAt}>{p.date}</time>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {c.viewAllLabel && <a className="media__view-all" href={safeHref(c.viewAllHref)}>{c.viewAllLabel}</a>}
      </div>
    </section>
  );
}
