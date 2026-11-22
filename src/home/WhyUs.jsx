// KAN-9: khối Why Choose Us — nền navy có ảnh quả địa cầu, nút Contact Us, 5 chỉ số từ dữ liệu.
// Số đếm tăng từ 0 tới giá trị trong 1,5 giây khi khối vào màn hình; giảm chuyển động → hiện ngay giá trị cuối.
import React, { useEffect, useRef, useState } from 'react';
import { safeHref } from './Hero.jsx';

export const COUNT_DURATION_MS = 1500;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function whyStats(content) {
  const list = Array.isArray(content?.stats) ? content.stats : [];
  return list
    .filter((s) => s && typeof s.value === 'number' && Number.isFinite(s.value) && s.value >= 0
      && typeof s.label === 'string' && s.label.trim())
    .map((s) => ({ value: s.value, suffix: typeof s.suffix === 'string' ? s.suffix : '', label: s.label }));
}

// Giá trị hiển thị sau `elapsed` ms (tuyến tính, làm tròn, không vượt đích)
export function countValue(target, elapsed, duration = COUNT_DURATION_MS) {
  if (!(elapsed > 0)) return 0;
  const p = Math.min(1, elapsed / duration);
  return Math.round(target * p);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(REDUCED_MOTION).matches;
}

// idle (chưa thấy khối) → running (đang đếm) → done (giá trị cuối)
// hasTarget: khối có phần tử chỉ số để quan sát (có thể chỉ xuất hiện sau khi đổi dữ liệu)
function useCountUp(ref, hasTarget) {
  const [state, setState] = useState(() => (
    prefersReducedMotion() || typeof IntersectionObserver === 'undefined' ? 'done' : 'idle'
  ));
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== 'idle' || !ref.current) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        setState(prefersReducedMotion() ? 'done' : 'running');
      }
    }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [state, ref, hasTarget]);

  useEffect(() => {
    if (state !== 'running') return undefined;
    let start = null;
    let frame = requestAnimationFrame(function step(now) {
      if (start === null) start = now;
      const ms = now - start;
      if (ms >= COUNT_DURATION_MS) {
        setState('done');
        return;
      }
      setElapsed(ms);
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [state]);

  return { state, elapsed };
}

export default function WhyUs({ content }) {
  const c = content || {};
  const stats = whyStats(c);
  const statsRef = useRef(null);
  const { state, elapsed } = useCountUp(statsRef, stats.length > 0);
  const shown = (v) => (state === 'done' ? v : state === 'running' ? countValue(v, elapsed) : 0);

  return (
    <section className="why" aria-labelledby="why-title" data-count-state={state}>
      {c.backgroundUrl && <img className="why__bg" src={c.backgroundUrl} alt="" loading="lazy" />}
      <div className="why__inner">
        {c.label && <div className="section-label why__label">{c.label}</div>}
        <h2 id="why-title" className="section-title why__title">{c.title}</h2>
        {c.lead && <p className="why__lead">{c.lead}</p>}
        {c.ctaLabel && <a className="btn btn--cyan" href={safeHref(c.ctaHref)}>{c.ctaLabel}</a>}
        {stats.length > 0 && (
          <ul className="why__stats" ref={statsRef}>
            {stats.map((s, i) => (
              <li className="why__stat" key={`${i}-${s.label}`}>
                <span className="why__num">{shown(s.value)}{s.suffix}</span>
                <span className="why__stat-label">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
