import React, { useMemo, useState } from 'react';
import './index.scss';

export type AvatarShape = 'circle' | 'square';

export interface AvatarItem {
  src?: string;
  alt?: string;
  text?: string;
}

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: number | string;
  shape?: AvatarShape;
  list?: AvatarItem[];
  overlap?: number;
  className?: string;
  style?: React.CSSProperties;
}

function normalizeSize(size: number | string | undefined, fallback: number) {
  if (typeof size === 'number') return `${size}px`;
  return size || `${fallback}px`;
}

function getTextFallback(text: string | undefined) {
  const value = (text || '').trim();
  if (!value) return '';
  return value.length <= 2 ? value : value.slice(0, 2);
}

export default function Avatar({
  src,
  alt,
  size = 32,
  shape = 'circle',
  list,
  overlap = 8,
  className,
  style,
}: AvatarProps) {
  const displayList = useMemo(() => (list || []).filter(Boolean), [list]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const avatarSize = normalizeSize(size, 32);
  const mergedClassName = [
    'wyx-ui_avatar',
    shape === 'square' ? 'wyx-ui_avatar--square' : 'wyx-ui_avatar--circle',
    className,
  ].filter(Boolean).join(' ');

  if (displayList.length > 0) {
    const safeOverlap = Math.max(0, overlap);
    const expand = safeOverlap + 2;

    return (
      <span
        className={['wyx-ui_avatar-group', className].filter(Boolean).join(' ')}
        style={{
          ...style,
          ['--wyx-avatar-size' as any]: avatarSize,
          ['--wyx-avatar-overlap' as any]: `${safeOverlap}px`,
        }}
        role="list"
      >
        {displayList.map((item, idx) => {
          const itemAlt = typeof item.alt === 'string' ? item.alt : '';
          const isActive = hoveredIndex === idx;
          const shiftX =
            hoveredIndex === null ? 0 : idx < hoveredIndex ? -expand : idx > hoveredIndex ? expand : 0;
          const scaleValue = isActive ? 1.08 : 1;
          const transform = `translate3d(${shiftX}px, 0, 0) scale(${scaleValue})`;
          const zIndex = isActive ? displayList.length + 1 : idx;

          return (
            <span
              key={`${item.src || item.text || 'avatar'}-${idx}`}
              className={[
                'wyx-ui_avatar',
                shape === 'square' ? 'wyx-ui_avatar--square' : 'wyx-ui_avatar--circle',
                idx > 0 ? 'wyx-ui_avatar--overlap' : '',
                isActive ? 'wyx-ui_avatar--active' : '',
              ].filter(Boolean).join(' ')}
              role="listitem"
              aria-label={itemAlt || undefined}
              style={{ transform, zIndex }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {item.src ? (
                <img src={item.src} alt={itemAlt} className="wyx-ui_avatar-img" draggable={false} />
              ) : (
                <span className="wyx-ui_avatar-fallback" aria-hidden>
                  {getTextFallback(item.text)}
                </span>
              )}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span
      className={mergedClassName}
      style={{
        ...style,
        ['--wyx-avatar-size' as any]: avatarSize,
      }}
      aria-label={typeof alt === 'string' ? alt : undefined}
    >
      {src ? (
        <img src={src} alt={typeof alt === 'string' ? alt : ''} className="wyx-ui_avatar-img" draggable={false} />
      ) : (
        <span className="wyx-ui_avatar-fallback" aria-hidden>
          {getTextFallback(typeof alt === 'string' ? alt : undefined)}
        </span>
      )}
    </span>
  );
}
