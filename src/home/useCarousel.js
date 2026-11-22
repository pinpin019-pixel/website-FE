// KAN-8: carousel dùng chung (hero, dải logo, testimonial sau này) — không dùng thư viện slider.
// Logic nằm trong createCarousel (JS thuần, test bằng fake timers); hook chỉ nối vào vòng đời React.
import { useEffect, useRef, useSyncExternalStore } from 'react';

// Chỉ số quay vòng trong [0, count); count ≤ 1 → 0
export function wrapIndex(i, count) {
  if (!(count > 1)) return 0;
  return ((i % count) + count) % count;
}

// Bộ điều khiển: vị trí hiện tại + tự chuyển sau intervalMs. Tự chuyển tạm dừng khi có ít nhất
// một lý do dừng ('user' = nút Tạm dừng, 'hover' = rê chuột). Mỗi lần đổi vị trí bộ đếm chạy lại từ đầu.
// autoplay: false (KAN-11, dải Awards/Certificates/Partners) → chỉ chuyển bằng next/prev/goTo.
export function createCarousel({ count = 0, intervalMs = 6000, autoplay = true } = {}) {
  let index = 0;
  let total = count;
  let started = false;
  let timer = null;
  const pauses = new Set();
  const listeners = new Set();
  let snapshot = null;

  const canPlay = () => autoplay && started && total > 1 && pauses.size === 0;
  const emit = () => { snapshot = null; listeners.forEach((fn) => fn()); };

  function clear() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    clear();
    if (canPlay()) timer = setTimeout(() => { timer = null; move(index + 1); }, intervalMs);
  }

  function move(i) {
    index = wrapIndex(i, total);
    schedule();
    emit();
  }

  return {
    get index() { return index; },
    get paused() { return pauses.has('user'); },
    get playing() { return canPlay(); },
    next() { move(index + 1); },
    prev() { move(index - 1); },
    goTo(i) { move(i); },
    pause(reason = 'user') { pauses.add(reason); schedule(); emit(); },
    resume(reason = 'user') { pauses.delete(reason); schedule(); emit(); },
    setCount(n) {
      if (n === total) return;
      total = n;
      index = Math.min(index, Math.max(0, n - 1));
      schedule();
      emit();
    },
    start() { started = true; schedule(); emit(); },
    stop() { started = false; clear(); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    getSnapshot() {
      if (!snapshot) snapshot = { index, paused: pauses.has('user'), playing: canPlay() };
      return snapshot;
    },
  };
}

// Hook: { index, paused, playing, next, prev, goTo, togglePause, pause, resume }
export default function useCarousel(count, { intervalMs = 6000, autoplay = true } = {}) {
  const ref = useRef(null);
  if (ref.current === null) ref.current = createCarousel({ count, intervalMs, autoplay });
  const c = ref.current;

  useEffect(() => {
    c.start();
    return () => c.stop();
  }, [c]);

  useEffect(() => { c.setCount(count); }, [c, count]);

  const state = useSyncExternalStore(c.subscribe, c.getSnapshot, c.getSnapshot);
  return {
    ...state,
    next: c.next,
    prev: c.prev,
    goTo: c.goTo,
    pause: c.pause,
    resume: c.resume,
    togglePause: () => (c.paused ? c.resume('user') : c.pause('user')),
  };
}
