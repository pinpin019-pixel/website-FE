// KAN-10: khối Case Studies — thẻ bài case_study từ GET /api/posts (ghim trước, mới nhất trước).
// Lưới 4 cột ≥ 1200px, 2 cột 768–1199px, 1 cột < 768px. API lỗi → thông báo nhỏ trong khối.
import React from 'react';
import { safeHref } from './Hero.jsx';
import { blockLimit, postCards, usePosts } from './posts.js';
import { t } from '../i18n.js';
import { track } from './tracking.js';

export default function CaseStudies({ content, lang }) {
  const c = content || {};
  const { status, posts } = usePosts('case_study', blockLimit(c), lang);
  const cards = postCards(posts);
  return (
    <section className="case-studies" aria-labelledby="case-studies-title">
      <div className="posts__inner">
        <div className="case-studies__head">
          <div>
            {c.label && <div className="section-label">{c.label}</div>}
            <h2 id="case-studies-title" className="section-title">{c.title}</h2>
          </div>
          {c.viewAllLabel && (
            <a className="btn btn--navy" href={safeHref(c.viewAllHref)}>
              {c.viewAllLabel} <span aria-hidden="true">›</span>
            </a>
          )}
        </div>
        {status === 'error' && <p className="posts__error" role="status">{t(lang, 'postsLoadError')}</p>}
        {cards.length > 0 && (
          <div className="case-studies__grid">
            {cards.map((p) => (
              <article className="case-studies__card" key={p.id ?? p.title}>
                {p.imageUrl && <img className="case-studies__img" src={p.imageUrl} alt={p.title} loading="lazy" />}
                <div className="case-studies__body">
                  <h3 className="case-studies__title">{p.title}</h3>
                  {p.excerpt && <p className="case-studies__excerpt">{p.excerpt}</p>}
                  <a className="case-studies__more" href={p.url} onClick={() => track('case_study_click')}>
                    {t(lang, 'learnMore')} <span aria-hidden="true">›</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
