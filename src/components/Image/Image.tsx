import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';
import { FilterSpec, toFilterString, getPreset } from './filter';
import { openImagePreview } from './preview';

export interface ImageProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  radius?: number;
  lazy?: boolean;
  placeholder?: React.ReactNode;
  fallbackSrc?: string;
  fallback?: React.ReactNode;
  preview?: boolean;
  thumbSrc?: string;
  preset?: string;
  filters?: FilterSpec[] | string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export default function Image({
  src,
  alt,
  width,
  height,
  fit = 'cover',
  radius,
  lazy = true,
  placeholder,
  fallbackSrc,
  fallback,
  preview,
  thumbSrc,
  preset,
  filters,
  className,
  style,
  onLoad,
  onError,
}: ImageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [canLoad, setCanLoad] = useState(!lazy);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!lazy) return;
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setCanLoad(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e && e.isIntersecting) {
        setCanLoad(true);
        io.disconnect();
      }
    }, { rootMargin: '80px' });
    io.observe(el);
    return () => io.disconnect();
  }, [lazy]);


  useEffect(() => {
    if (!canLoad) return;
    setLoaded(false);
    setErrored(false);
  }, [src, canLoad]);

  const borderRadius = useMemo(() => {
    if (typeof radius === 'number') return `${radius}px`;
    return undefined;
  }, [radius]);

  const filterStr = useMemo(() => {
    const parts: string[] = [];
    if (typeof preset === 'string') {
      const p = getPreset(preset);
      if (p) parts.push(toFilterString(p));
    }
    if (filters) parts.push(typeof filters === 'string' ? filters : toFilterString(filters));
    return parts.length ? parts.join(' ') : undefined;
  }, [preset, filters]);

  const imgStyle: React.CSSProperties = useMemo(() => ({ objectFit: fit, filter: filterStr }), [fit, filterStr]);

  const handleLoad = () => { setLoaded(true); onLoad?.(); };
  const handleError = () => { setErrored(true); onError?.(); };

  const showImg = canLoad && !errored;
  const showFallback = errored;

  return (
    <div
      ref={wrapRef}
      className={`wyx-ui_image ${className || ''} ${loaded ? 'wyx-ui_image--loaded' : ''} ${errored ? 'wyx-ui_image--error' : ''}`}
      style={{ width, height, borderRadius, ...style }}
      onClick={preview && loaded && !errored ? () => openImagePreview({ src, alt, originRect: imgRef.current?.getBoundingClientRect() || undefined }) : undefined}
    >
      <div className="wyx-ui_image-inner" style={{ borderRadius }}>
        {!loaded && !errored && (
          placeholder ?? (thumbSrc ? (
            <img 
              src={thumbSrc} 
              alt={alt} 
              style={{...imgStyle, filter: 'blur(10px)'}} 
              className="wyx-ui_image-thumb" 
              draggable={false} 
            />
          ) : (
            <div className="wyx-ui_image-placeholder" />
          ))
        )}
        {showImg && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            style={imgStyle}
            onLoad={handleLoad}
            onError={handleError}
            draggable={false}
          />
        )}
        {showFallback && (
          fallback ? (
            <div className="wyx-ui_image-fallback">{fallback}</div>
          ) : fallbackSrc ? (
            <img src={fallbackSrc} alt={alt} style={imgStyle} draggable={false} />
          ) : (
            <div className="wyx-ui_image-fallback">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--disabled-text, #999)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
            </div>
          )
        )}
      </div>

    </div>
  );
}
