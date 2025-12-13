import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';

export interface SwiperProps {
  children: React.ReactNode[] | React.ReactNode;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  interval?: number;
  loop?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  draggable?: boolean;
  mode?: 'slide' | 'card' | 'gradient';
  duration?: number;
  feather?: number;
  cardPeek?: number;
  cardGap?: number;
  cardScale?: number;
  className?: string;
  style?: React.CSSProperties;
  onIndexChange?: (index: number) => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function Swiper({
  children,
  width,
  height = 200,
  autoplay = false,
  interval = 3000,
  loop = true,
  showDots = true,
  showArrows = true,
  draggable = true,
  mode = 'slide',
  duration = 360,
  feather = 16,
  cardPeek = 24,
  cardGap = 12,
  cardScale = 0.92,
  className,
  style,
  onIndexChange,
}: SwiperProps) {
  const list = useMemo(() => React.Children.toArray(children), [children]);
  const count = list.length;
  const isCard = mode === 'card';
  const isGrad = mode === 'gradient';
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [vw, setVw] = useState<number>(0);
  const [dragX, setDragX] = useState<number>(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const [hover, setHover] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(isCard || isGrad ? 0 : (loop && count > 1 ? 1 : 0));
  const [anim, setAnim] = useState<boolean>(true);
  const [fading, setFading] = useState<boolean>(false);
  const [fadeFrom, setFadeFrom] = useState<number>(0);
  const [fadeTo, setFadeTo] = useState<number>(0);
  const [fadeDir, setFadeDir] = useState<'left' | 'right'>('right');
  const [gradProg, setGradProg] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const autoIdRef = useRef<number | null>(null);
  const lockRef = useRef<boolean>(false);

  const slides = useMemo(() => {
    if (!isCard && !isGrad && loop && count > 1) return [list[count - 1], ...list, list[0]];
    return list;
  }, [list, count, loop, isCard, isGrad]);

  useEffect(() => {
    const el = viewportRef.current; if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const w = Math.max(0, Math.floor(entry.contentRect.width));
      setVw(w);
    });
    ro.observe(el);
    setVw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { onIndexChange?.(current()); }, [index]);

  useEffect(() => {
    if (autoIdRef.current) { clearInterval(autoIdRef.current); autoIdRef.current = null; }
    if (!autoplay || count <= 1) return;
    if (hover || dragging) return;
    autoIdRef.current = window.setInterval(() => next(), interval);
    return () => { if (autoIdRef.current) { clearInterval(autoIdRef.current); autoIdRef.current = null; } };
  }, [autoplay, hover, dragging, interval, count, index]);

  const current = () => ((isCard || isGrad) ? index : (loop && count > 1 ? clamp(index - 1, 0, count - 1) : index));
  const go = (i: number) => {
    if (lockRef.current) return;
    if (isGrad) {
      const target = loop ? (((i % count) + count) % count) : clamp(i, 0, count - 1);
      if (target === index) return;
      const dRaw = target - index;
      const dOpt = [dRaw, dRaw - count, dRaw + count].sort((a, b) => Math.abs(a) - Math.abs(b))[0];
      setFadeDir(dOpt > 0 ? 'right' : 'left');
      setFadeFrom(index);
      setFadeTo(target);
      setFading(true);
      lockRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setGradProg(0);
      const s = performance.now();
      const tick = (n: number) => {
        const p = Math.min(1, (n - s) / duration);
        setGradProg(p);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setIndex(target);
          setFading(false);
          setGradProg(0);
          lockRef.current = false;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (isCard) {
      lockRef.current = true;
      setTimeout(() => { lockRef.current = false; }, duration);
      if (loop) setIndex(((i % count) + count) % count);
      else setIndex(clamp(i, 0, count - 1));
    } else {
      if (!loop) {
        lockRef.current = true;
        setTimeout(() => { lockRef.current = false; }, duration);
        setIndex(clamp(i, 0, count - 1));
      } else {
        lockRef.current = true;
        // Only unlock automatically if we are not going to a boundary that triggers reset
        if (i !== 0 && i !== count + 1) {
          setTimeout(() => { lockRef.current = false; }, duration);
        }
        setIndex(i);
      }
    }
  };
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  useEffect(() => {
    if (isCard || isGrad || !loop || count <= 1) return;
    if (index === 0) {
      setTimeout(() => {
        setAnim(false);
        setIndex(count);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnim(true);
            lockRef.current = false;
          });
        });
      }, duration);
    } else if (index === count + 1) {
      setTimeout(() => {
        setAnim(false);
        setIndex(1);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnim(true);
            lockRef.current = false;
          });
        });
      }, duration);
    }
  }, [index, loop, count, isCard, isGrad]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable) return;
    if (lockRef.current) return;
    if (e.button !== 0) return;
    e.preventDefault();
    const t = e.target as HTMLElement | null;
    if (t && (t.closest('.wyx-ui_swiper-arrow') || t.closest('.wyx-ui_swiper-dot') || t.closest('button') || t.closest('a'))) return;
    if (autoIdRef.current) { clearInterval(autoIdRef.current); autoIdRef.current = null; }
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
    (e.currentTarget as HTMLElement).addEventListener('pointermove', onPointerMove as any);
    (e.currentTarget as HTMLElement).addEventListener('pointerup', onPointerUp as any, { once: true });
    (e.currentTarget as HTMLElement).addEventListener('pointercancel', onPointerUp as any, { once: true });
    (e.currentTarget as any).__sx = e.clientX;
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const sx = (e.currentTarget as any).__sx || e.clientX;
    const dx = e.clientX - sx;
    setDragX(dx);
    setAnim(false);
  };
  const onPointerUp = (e: PointerEvent) => {
    setDragging(false);
    setAnim(true);
    (e.currentTarget as HTMLElement).style.cursor = '';
    (e.currentTarget as HTMLElement).removeEventListener('pointermove', onPointerMove as any);
    const sx = (e.currentTarget as any).__sx || e.clientX;
    const dx = e.clientX - sx;
    setDragX(0);
    const cardW = Math.max(0, vw - 2 * cardPeek);
    const thr = isCard
      ? Math.max(40, Math.min(vw || 0, cardW)) * 0.25
      : Math.max(30, (vw || 0) * 0.2);
    if (Math.abs(dx) > thr) { dx < 0 ? next() : prev(); }
  };

  const trackStyle = (isCard || isGrad) ? ({ position: 'relative' } as React.CSSProperties) : ({
    transform: `translate3d(${-(index) * vw + dragX}px,0,0)`,
    transition: anim ? `transform ${duration}ms cubic-bezier(.22, 1, .36, 1)` : 'none',
  } as React.CSSProperties);

  const cardW = Math.max(0, vw - 2 * cardPeek);
  const rel = (i: number) => {
    if (!loop) return i - index;
    const d1 = i - index;
    const d2 = d1 - count;
    const d3 = d1 + count;
    return [d1, d2, d3].sort((a, b) => Math.abs(a) - Math.abs(b))[0];
  };

  return (
    <div className={`wyx-ui_swiper ${isCard ? 'wyx-ui_swiper--card' : ''} ${isGrad ? 'wyx-ui_swiper--gradient' : ''} ${className || ''}`} style={{ width, height, ...style }}>
      <div
        ref={viewportRef}
        className="wyx-ui_swiper-viewport"
        onDragStart={(e) => { e.preventDefault(); }}
        onPointerDown={onPointerDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="wyx-ui_swiper-track" style={trackStyle}>
          {slides.map((node, i) => {
            if (!isCard && !isGrad) {
              return (
                <div key={i} className="wyx-ui_swiper-slide" style={{ width: vw || '100%' }}>
                  {node}
                </div>
              );
            }
            if (isCard) {
              const d = rel(i);
              const x = d * (cardW + cardGap) + dragX;
              const s = d === 0 ? 1 : cardScale;
              const z = 100 - Math.abs(d);
              const styleSlide = {
                width: cardW || '100%',
                transform: `translateX(calc(-50% + ${x}px)) scale(${s})`,
                transition: anim ? `transform ${duration}ms cubic-bezier(.22, 1, .36, 1)` : 'none',
                zIndex: z,
              } as React.CSSProperties;
              return (
                <div key={i} className="wyx-ui_swiper-slide" style={styleSlide}>
                  {node}
                </div>
              );
            }
            const isTop = i === index;
            const isUnder = fading && i === fadeTo;
            const z = isTop ? 3 : (isUnder ? 2 : 1);
            const edgePct = fadeDir === 'right' ? 100 - gradProg * 100 : gradProg * 100;
            const featherPct = Math.max(0, Math.min(100, (feather / Math.max(1, vw)) * 100));
            const clipFrom = fadeDir === 'right' ? `inset(0 ${gradProg * 100}% 0 0)` : `inset(0 0 0 ${gradProg * 100}%)`;
            const maskGrad = fadeDir === 'right'
              ? `linear-gradient(to right, black 0%, black calc(${edgePct}% - ${featherPct}%), transparent ${edgePct}%)`
              : `linear-gradient(to right, transparent ${edgePct}%, black calc(${edgePct}% + ${featherPct}%), black 100%)`;
            const styleSlide = {
              width: '100%',
              height: '100%',
              clipPath: fading && i === fadeFrom ? clipFrom as any : ('inset(0 0 0 0)' as any),
              transition: 'none',
              zIndex: z,
              pointerEvents: isTop ? 'auto' : 'none',
              WebkitMaskImage: fading && i === fadeFrom ? maskGrad : undefined,
              maskImage: fading && i === fadeFrom ? maskGrad : undefined,
            } as React.CSSProperties;
            return (
              <div key={i} className="wyx-ui_swiper-slide" style={styleSlide}>
                {node}
              </div>
            );
          })}
        </div>
        {showArrows && count > 1 && (
          <>
            <button className="wyx-ui_swiper-arrow wyx-ui_swiper-arrow--prev" onClick={prev} aria-label="prev">‹</button>
            <button className="wyx-ui_swiper-arrow wyx-ui_swiper-arrow--next" onClick={next} aria-label="next">›</button>
          </>
        )}
        {showDots && count > 1 && (
          <div className="wyx-ui_swiper-dots">
            {list.map((_, i) => (
              <button key={i} className={`wyx-ui_swiper-dot ${current() === i ? 'is-active' : ''}`} onClick={() => go((isCard || isGrad) ? i : (loop ? i + 1 : i))} aria-label={`Go to ${i+1}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}