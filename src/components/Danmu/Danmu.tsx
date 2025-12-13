import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import './index.scss';

export interface DanmuProps<T = React.ReactNode> {
  width?: number | string;
  height?: number | string;
  rows?: number;
  speed?: number;
  gap?: number;
  pauseOnHover?: boolean;
  className?: string;
  style?: React.CSSProperties;
  renderItem?: (content: T, index: number) => React.ReactNode;
  initial?: Array<T>;
  maxQueue?: number;
  dropStrategy?: 'drop_old' | 'drop_new';
  maxActive?: number;
  initialGap?: number;
  interactive?: boolean;
  paused?: boolean;
  channel?: DanmuChannel<T>;
}

export interface DanmuRef<T = React.ReactNode> {
  push: (content: T, opts?: { row?: number }) => void;
  clear: () => void;
}

type Bullet<T> = { id: string; content: T; row: number; delay: number };

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function DanmuInner<T = React.ReactNode>({
  width = '100%',
  height = 160,
  rows = 4,
  speed = 120,
  gap = 80,
  pauseOnHover = true,
  className,
  style,
  renderItem,
  initial,
  maxQueue = 200,
  dropStrategy = 'drop_old',
  maxActive = 200,
  initialGap = 500,
  interactive = true,
  paused = false,
  channel,
}: DanmuProps<T>, ref: React.ForwardedRef<DanmuRef<T>>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState<number>(0);
  const [vh, setVh] = useState<number>(0);
  const [bullets, setBullets] = useState<Bullet<T>[]>([]);
  const rowAvailRef = useRef<number[]>(Array(rows).fill(0));
  const idCounter = useRef<number>(0);
  const didInitRef = useRef<boolean>(false);
  const initTimersRef = useRef<number[]>([]);
  const queueRef = useRef<{ id: string; content: T; row: number; when: number }[]>([]);
  const pendingTimerMapRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const m = () => {
      const el = viewportRef.current; if (!el) return;
      setVw(el.clientWidth);
      setVh(el.clientHeight);
    };
    m();
    window.addEventListener('resize', m);
    return () => window.removeEventListener('resize', m);
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const arr = initial || [];
    if (arr.length === 0) return;
    push(arr[0]);
    for (let i = 1; i < arr.length; i++) {
      const tid = window.setTimeout(() => push(arr[i]), i * initialGap);
      initTimersRef.current.push(tid);
    }
  }, []);

  

  const gapTime = useMemo(() => gap / Math.max(1, speed), [gap, speed]);

  const pickRow = () => {
    const now = performance.now();
    let best = 0; let bestAt = Number.POSITIVE_INFINITY;
    for (let r = 0; r < rows; r++) {
      const at = rowAvailRef.current[r] || 0;
      if (at < bestAt) { bestAt = at; best = r; }
    }
    const delayMs = Math.max(0, (rowAvailRef.current[best] || 0) - now);
    rowAvailRef.current[best] = now + delayMs + gapTime * 1000;
    return { row: best, delay: delayMs / 1000 };
  };

  const push = (content: T, opts?: { row?: number }) => {
    const now = performance.now();
    const picked = pickRow();
    let row = clamp((opts?.row ?? picked.row), 0, rows - 1);
    const delaySec = opts?.row != null
      ? Math.max(0, ((rowAvailRef.current[row] || 0) - now) / 1000)
      : picked.delay;
    if (opts?.row != null) rowAvailRef.current[row] = now + delaySec * 1000 + gapTime * 1000;
    const id = `danmu-${Date.now()}-${idCounter.current++}`;
    const when = performance.now() + delaySec * 1000;
    const pending = { id, content, row, when };
    // enqueue with cap
    queueRef.current.push(pending);
    if (queueRef.current.length > maxQueue) {
      if (dropStrategy === 'drop_old') queueRef.current.shift();
      else queueRef.current.pop();
    }
    const timeoutMs = Math.max(0, when - performance.now());
    const tid = window.setTimeout(() => {
      delete pendingTimerMapRef.current[id];
      queueRef.current = queueRef.current.filter((x) => x.id !== id);
      setBullets((prev) => {
        const next = prev.length >= maxActive ? prev.slice(1) : prev;
        return [...next, { id, content, row, delay: 0 }];
      });
    }, timeoutMs);
    pendingTimerMapRef.current[id] = tid;
  };

  useEffect(() => {
    if (!channel) return;
    const unsub = channel.subscribe((content, opts) => push(content, opts));
    return () => unsub();
  }, [channel, push]);

  const clear = () => {
    setBullets([]);
    // clear scheduled
    Object.values(pendingTimerMapRef.current).forEach((tid) => clearTimeout(tid));
    pendingTimerMapRef.current = {};
    queueRef.current = [];
    initTimersRef.current.forEach((t) => clearTimeout(t));
    initTimersRef.current = [];
  };

  useImperativeHandle(ref, () => ({ push, clear }), [push]);

  

  const trackH = Math.max(1, vh || (typeof height === 'number' ? height : 0)) / Math.max(1, rows);

  const initBullet = (el: HTMLDivElement | null, b: Bullet<T>) => {
    if (!el || !viewportRef.current) return;
    const w = el.offsetWidth;
    const start = vw;
    const end = -w;
    const dur = (start + w) / Math.max(1, speed);
    const top = Math.round(b.row * trackH + Math.max(0, (trackH - el.offsetHeight) / 2));
    el.style.top = `${top}px`;
    el.style.setProperty('--start', `${start}px`);
    el.style.setProperty('--end', `${end}px`);
    el.style.setProperty('--wyx-dur', `${dur}s`);
    el.style.setProperty('--wyx-delay', `${b.delay || 0}s`);
    const onEnd = () => setBullets((prev) => prev.filter((x) => x.id !== b.id));
    el.addEventListener('animationend', onEnd, { once: true });
  };

  return (
    <div className={`wyx-ui_danmu ${pauseOnHover ? 'pause-on-hover' : ''} ${paused ? 'is-paused' : ''} ${interactive ? 'is-interactive' : ''} ${className || ''}`} style={{ width, height, ...style }}>
      <div ref={viewportRef} className="wyx-ui_danmu-viewport">
        {bullets.map((b, i) => (
          <div key={b.id} ref={(el) => initBullet(el, b)} className="wyx-ui_danmu-item">
            {renderItem ? renderItem(b.content, i) : (b.content as React.ReactNode)}
          </div>
        ))}
      </div>
    </div>
  );
}

const Danmu = forwardRef(DanmuInner) as <T = React.ReactNode>(
  props: DanmuProps<T> & { ref?: React.Ref<DanmuRef<T>> }
) => React.ReactElement;

export default Danmu;

export type DanmuPushOpts = { row?: number };
export interface DanmuChannel<T = React.ReactNode> {
  subscribe: (fn: (content: T, opts?: DanmuPushOpts) => void) => () => void;
  push: (content: T, opts?: DanmuPushOpts) => void;
}

export function useDanmuChannel<T = React.ReactNode>(): DanmuChannel<T> {
  const subsRef = useRef<Set<(content: T, opts?: DanmuPushOpts) => void>>(new Set());
  const ch = useMemo<DanmuChannel<T>>(() => ({
    subscribe(fn) { subsRef.current.add(fn); return () => subsRef.current.delete(fn); },
    push(content, opts) { subsRef.current.forEach((f) => f(content, opts)); },
  }), []);
  return ch;
}
