import React, { useEffect, useId, useMemo, useRef } from 'react';
import './index.scss';

export interface MorphingTextProps {
  texts: string[];
  morphDuration?: number;
  cooldown?: number;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function MorphingText({
  texts,
  morphDuration = 1000,
  cooldown = 500,
  loop = true,
  className,
  style
}: MorphingTextProps) {
  const rawId = useId();
  const filterId = useMemo(() => `wyx-ui_morph-threshold-${rawId.replace(/:/g, '')}`, [rawId]);
  const text1Ref = useRef<HTMLSpanElement | null>(null);
  const text2Ref = useRef<HTMLSpanElement | null>(null);
  const sizerRef = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const safeTexts = useMemo(() => texts.filter((t) => t != null && String(t).length > 0).map(String), [texts]);

  useEffect(() => {
    const text1 = text1Ref.current;
    const text2 = text2Ref.current;
    const sizer = sizerRef.current;
    if (!text1 || !text2 || !sizer) return;
    if (safeTexts.length === 0) {
      text1.textContent = '';
      text2.textContent = '';
      sizer.textContent = '';
      return;
    }

    let widestText = safeTexts[0];
    let maxWidth = -Infinity;
    for (const t of safeTexts) {
      sizer.textContent = t;
      const w = sizer.getBoundingClientRect().width;
      if (w > maxWidth) {
        maxWidth = w;
        widestText = t;
      }
    }
    sizer.textContent = widestText;

    let cancelled = false;
    let textIndex = 0;
    let lastTime = performance.now();
    let morph = 0;
    let cooldownRemaining = cooldown;

    const setTexts = (idx: number) => {
      const curr = safeTexts[idx % safeTexts.length];
      const next = safeTexts[(idx + 1) % safeTexts.length];
      text1.textContent = curr;
      text2.textContent = next;
    };

    const setStyles = (fraction: number) => {
      const f = Math.max(0, Math.min(1, fraction));
      const f2 = f;
      const f1 = 1 - f;

      const blur2 = f2 === 0 ? 100 : Math.min(100, Math.max(0, 8 / f2 - 8));
      const blur1 = f1 === 0 ? 100 : Math.min(100, Math.max(0, 8 / f1 - 8));

      text2.style.filter = `blur(${blur2}px)`;
      text2.style.opacity = `${Math.pow(f2, 0.4)}`;

      text1.style.filter = `blur(${blur1}px)`;
      text1.style.opacity = `${Math.pow(f1, 0.4)}`;
    };

    const doCooldown = () => {
      morph = 0;
      text2.style.filter = '';
      text2.style.opacity = '0';
      text1.style.filter = '';
      text1.style.opacity = '1';
    };

    const animate = () => {
      if (cancelled) return;
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;

      cooldownRemaining -= dt;
      if (cooldownRemaining > 0) {
        doCooldown();
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!loop && textIndex >= safeTexts.length - 1) {
        doCooldown();
        rafRef.current = null;
        return;
      }

      morph += dt;
      let fraction = morph / morphDuration;
      if (fraction >= 1) {
        fraction = 1;
        setStyles(fraction);

        textIndex = (textIndex + 1) % safeTexts.length;
        setTexts(textIndex);
        cooldownRemaining = cooldown;
        doCooldown();

        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      setStyles(fraction);
      rafRef.current = requestAnimationFrame(animate);
    };

    setTexts(textIndex);
    doCooldown();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [safeTexts, morphDuration, cooldown, loop]);

  const mergedStyle: React.CSSProperties = useMemo(() => {
    const baseFilter = typeof style?.filter === 'string' ? style.filter : undefined;
    const filter = baseFilter ? `${baseFilter} url(#${filterId})` : `url(#${filterId}) blur(0.6px)`;
    return { ...style, filter };
  }, [style, filterId]);

  return (
    <span className={`wyx-ui_morphing-text ${className || ''}`} style={mergedStyle}>
      <svg className="wyx-ui_morphing-text__svg" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId}>
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 255 -140
              "
            />
          </filter>
        </defs>
      </svg>
      <span className="wyx-ui_morphing-text__sizer" ref={sizerRef} aria-hidden="true"></span>
      <span className="wyx-ui_morphing-text__text wyx-ui_morphing-text__text--1" ref={text1Ref}></span>
      <span className="wyx-ui_morphing-text__text wyx-ui_morphing-text__text--2" ref={text2Ref}></span>
    </span>
  );
}
