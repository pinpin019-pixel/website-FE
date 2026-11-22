// KAN-8: dải logo khách hàng — 6 logo/khung ở ≥ 768px, 3 ở < 768px; tự cuộn 1 logo mỗi 3 giây, quay vòng.
import React, { useEffect, useState } from 'react';
import useCarousel from './useCarousel.js';
import { t } from '../i18n.js';

export const CLIENT_STEP_MS = 3000;
const WIDE_QUERY = '(min-width: 768px)';

// Chỉ logo có trong dữ liệu và đủ tên (alt) + ảnh
export function visibleLogos(content) {
  const list = Array.isArray(content?.logos) ? content.logos : [];
  return list.filter((l) => l && typeof l.name === 'string' && l.name.trim() && l.imageUrl);
}

export function perViewFor(isWide) {
  return isWide ? 6 : 3;
}

// Số vị trí cuộn: vị trí cuối là khi logo cuối nằm sát mép phải khung
export function positionsFor(count, perView) {
  return Math.max(1, count - perView + 1);
}

function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : true);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export default function ClientStrip({ content, lang }) {
  const logos = visibleLogos(content);
  const perView = perViewFor(useMediaQuery(WIDE_QUERY));
  const c = useCarousel(positionsFor(logos.length, perView), { intervalMs: CLIENT_STEP_MS });
  if (logos.length === 0) return null;

  return (
    <section className="clients" aria-label={t(lang, 'clientsRegion')} style={{ '--per-view': perView }}>
      <div className="clients__inner">
        <button type="button" className="clients__nav" aria-label={t(lang, 'prevLogos')} onClick={c.prev}>
          <span aria-hidden="true">←</span>
        </button>
        <div className="clients__view">
          <ul className="clients__track" style={{ transform: `translateX(-${(c.index * 100) / perView}%)` }}>
            {logos.map((l, i) => (
              <li className="clients__item" key={`${i}-${l.imageUrl}`}>
                <img src={l.imageUrl} alt={l.name} loading="lazy" />
              </li>
            ))}
          </ul>
        </div>
        <button type="button" className="clients__nav" aria-label={t(lang, 'nextLogos')} onClick={c.next}>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
