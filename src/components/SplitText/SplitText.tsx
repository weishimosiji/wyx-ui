import React, { useEffect } from 'react';
import './index.scss';

export interface SplitTextProps {
  text: string;
  className?: string;
  stagger?: number;
  duration?: number;
  offsetY?: number | string;
  ease?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

export default function SplitText({ text, className, stagger = 50, duration = 400, offsetY = '0.75em', ease = 'cubic-bezier(.2,.8,.2,1)', style, onComplete }: SplitTextProps) {
  const chars = React.useMemo(() => Array.from(text || ''), [text]);
  const rootStyle: React.CSSProperties = {
    ...(style || {}),
    ['--wyx-split-duration' as any]: `${duration}ms`,
    ['--wyx-split-ease' as any]: ease,
    ['--wyx-split-offset-y' as any]: typeof offsetY === 'number' ? `${offsetY}px` : offsetY,
  };

  useEffect(() => {
    if (!onComplete) return;
    const lastCharIndex = chars.length - 1;
    if (lastCharIndex < 0) {
      onComplete();
      return;
    }
    const totalTime = lastCharIndex * stagger + duration;
    const timer = setTimeout(onComplete, totalTime);
    return () => clearTimeout(timer);
  }, [chars.length, stagger, duration, onComplete]);

  return (
    <span className={`wyx-ui_split-text ${className || ''}`} style={rootStyle}>
      {chars.map((ch, i) => (
        <span key={i} className="wyx-ui_split-char" style={{ animationDelay: `${i * stagger}ms` }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  );
}