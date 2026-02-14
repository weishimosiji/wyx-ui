import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';

export interface LensProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  scale?: number;
  lensSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function Lens({
  src,
  alt,
  width,
  height,
  scale = 2,
  lensSize = 150,
  className,
  style,
}: LensProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    if (typeof ResizeObserver === 'undefined') {
      if (typeof window === 'undefined') return;
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition(null);
  };

  const lensStyle = useMemo(() => {
    if (!position) return {};

    const { width: w, height: h } = containerSize;
    if (!w || !h) return {};

    const half = lensSize / 2;

    const left = position.x - half;
    const top = position.y - half;

    const relativeX = position.x - left;
    const relativeY = position.y - top;

    const bgW = w * scale;
    const bgH = h * scale;

    const rawBgLeft = relativeX - position.x * scale;
    const rawBgTop = relativeY - position.y * scale;

    const bgLeft = bgW <= lensSize ? (lensSize - bgW) / 2 : clamp(rawBgLeft, lensSize - bgW, 0);
    const bgTop = bgH <= lensSize ? (lensSize - bgH) / 2 : clamp(rawBgTop, lensSize - bgH, 0);

    return {
      left,
      top,
      width: lensSize,
      height: lensSize,
      backgroundImage: `url(${src})`,
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `${bgLeft}px ${bgTop}px`,
    };
  }, [position, scale, lensSize, src, containerSize]);

  return (
    <div
      className={['wyx-ui_lens', className].filter(Boolean).join(' ')}
      style={{ ...style, width, height }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img src={src} alt={alt} className="wyx-ui_lens-img" />
      {position && (
        <div className="wyx-ui_lens-glass" style={lensStyle} />
      )}
    </div>
  );
}
