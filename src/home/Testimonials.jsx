// KAN-11: slider Testimonials — mỗi lúc 1 slide (trích dẫn, tên, chức danh, ảnh/logo), tự chuyển 8 giây.
// Dải logo công ty bên dưới là tablist: bấm logo chuyển tới slide đó. Slide có videoUrl chỉ hiện ảnh bìa + nút phát;
// bấm phát mới chèn video/iframe, và slider dừng tự chuyển khi đang xem video.
import React, { useEffect, useRef, useState } from 'react';
import useCarousel from './useCarousel.js';
import { t } from '../i18n.js';

export const TESTIMONIAL_INTERVAL_MS = 8000;
const VIDEO_FILE = /\.(mp4|webm|ogg)(?:[?#].*)?$/i;

const filled = (s) => typeof s === 'string' && s.trim().length > 0;

export function testimonialItems(content) {
  const list = Array.isArray(content?.items) ? content.items : [];
  return list.filter((it) => it && filled(it.quote) && filled(it.name));
}

export function testimonialInterval(content) {
  const ms = content?.intervalMs;
  return typeof ms === 'number' && ms > 0 ? ms : TESTIMONIAL_INTERVAL_MS;
}

// Chỉ nhận URL http(s) tuyệt đối; file video → thẻ video, còn lại (URL nhúng) → iframe
export function videoSource(url) {
  if (!filled(url)) return null;
  let parsed;
  try { parsed = new URL(url.trim()); } catch { return null; }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  const src = url.trim();
  return { kind: VIDEO_FILE.test(parsed.pathname) ? 'video' : 'iframe', src };
}

function Player({ source, title }) {
  if (source.kind === 'video') {
    return <video className="testimonial__player" src={source.src} title={title} controls autoPlay playsInline />;
  }
  return (
    <iframe
      className="testimonial__player"
      src={source.src}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}

export default function Testimonials({ content, lang }) {
  const items = testimonialItems(content);
  const c = useCarousel(items.length, { intervalMs: testimonialInterval(content) });
  const [playing, setPlaying] = useState(null);
  const tabRefs = useRef([]);

  // Rời slide đang phát video → gỡ video, cho slider chạy lại
  useEffect(() => {
    if (playing !== null && playing !== c.index) {
      setPlaying(null);
      c.resume('video');
    }
  }, [c.index, playing, c.resume]);

  if (items.length === 0) return null;
  const c_ = content || {};

  const play = (i) => { setPlaying(i); c.pause('video'); };
  const select = (i, focus = false) => {
    c.goTo(i);
    if (focus) tabRefs.current[i]?.focus();
  };
  const onTabKey = (e) => {
    const last = items.length - 1;
    const to = { ArrowRight: c.index + 1, ArrowLeft: c.index - 1, Home: 0, End: last }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    select(((to % items.length) + items.length) % items.length, true);
  };

  return (
    <section className="testimonials" aria-labelledby="testimonials-title">
      <div className="testimonials__inner">
        {filled(c_.label) && <div className="section-label testimonials__label">{c_.label}</div>}
        <h2 id="testimonials-title" className="section-title testimonials__title">{c_.title || c_.label}</h2>
        <div className="testimonials__slides">
          {items.map((it, i) => {
            const active = i === c.index;
            const video = videoSource(it.videoUrl);
            const media = it.photoUrl || it.logoUrl;
            const videoTitle = `${t(lang, 'playVideo')}: ${it.name}`;
            return (
              <div
                key={i}
                id={`testimonial-panel-${i}`}
                className="testimonial"
                role="tabpanel"
                aria-labelledby={`testimonial-tab-${i}`}
                hidden={!active}
              >
                <div className="testimonial__media">
                  {video && playing === i ? (
                    <Player source={video} title={videoTitle} />
                  ) : (
                    <>
                      {media && <img className="testimonial__photo" src={media} alt={it.name} loading="lazy" />}
                      {video && (
                        <button type="button" className="testimonial__play" aria-label={videoTitle} onClick={() => play(i)}>
                          <span aria-hidden="true">▶</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="testimonial__body">
                  <blockquote className="testimonial__quote">{it.quote}</blockquote>
                  <p className="testimonial__name">{it.name}</p>
                  {filled(it.role) && <p className="testimonial__role">{it.role}</p>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="testimonials__tabs" role="tablist" aria-label={t(lang, 'testimonialTabs')}>
          {items.map((it, i) => {
            const active = i === c.index;
            const logo = it.logoUrl || it.photoUrl;
            const name = filled(it.company) ? it.company : it.name;
            return (
              <button
                key={i}
                ref={(el) => { tabRefs.current[i] = el; }}
                type="button"
                role="tab"
                id={`testimonial-tab-${i}`}
                className={active ? 'testimonials__tab is-active' : 'testimonials__tab'}
                aria-selected={active ? 'true' : 'false'}
                aria-controls={`testimonial-panel-${i}`}
                tabIndex={active ? 0 : -1}
                aria-label={logo ? undefined : name}
                onClick={() => select(i)}
                onKeyDown={onTabKey}
              >
                {logo && <img src={logo} alt={name} loading="lazy" />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
