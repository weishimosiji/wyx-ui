import React from 'react';
import './index.scss';

export type BadgeStatus = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface BadgeProps {
  count?: number;
  dot?: boolean;
  status?: BadgeStatus;
  position?: BadgePosition;
  maxCount?: number;
  offset?: [number, number];
  showZero?: boolean;
  children?: React.ReactNode;
  content?: React.ReactNode;
  show?: boolean;
  color?: string;
  textColor?: string;
  badgeStyle?: React.CSSProperties;
  className?: string;
  style?: React.CSSProperties;
}

function formatCount(count: number, maxCount: number) {
  if (Number.isNaN(count)) return '';
  if (count > maxCount) return `${maxCount}+`;
  return String(count);
}

const Badge: React.FC<BadgeProps> = ({
  count,
  dot = false,
  status = 'danger',
  position = 'top-right',
  maxCount = 99,
  offset,
  showZero = false,
  children,
  content,
  show,
  color,
  textColor,
  badgeStyle,
  className,
  style,
}) => {
  const hasCount = typeof count === 'number';
  const hasCustomContent = typeof content !== 'undefined';
  const shouldShowByValue = (() => {
    if (typeof show === 'boolean') return show;
    if (dot) return true;
    if (hasCustomContent) return content !== null && content !== false;
    if (hasCount) return showZero ? true : count !== 0;
    if (status) return true;
    return false;
  })();

  const displayAsDot = dot || (!hasCustomContent && !hasCount);
  const displayText = !displayAsDot
    ? (hasCustomContent ? content : formatCount(count as number, maxCount))
    : null;

  const wrapStyle: React.CSSProperties = {
    ...style,
  };

  const nodeStyle: React.CSSProperties = {
    ...(badgeStyle || {}),
  };

  if (offset) {
    (nodeStyle as any)['--wyx-badge-offset-x'] = `${offset[0]}px`;
    (nodeStyle as any)['--wyx-badge-offset-y'] = `${offset[1]}px`;
  }
  if (color) (nodeStyle as any)['--wyx-badge-bg'] = color;
  if (textColor) (nodeStyle as any)['--wyx-badge-color'] = textColor;

  return (
    <span className={`wyx-ui_badge ${className || ''}`} style={wrapStyle}>
      {children}
      {shouldShowByValue && (
        <sup
          className={[
            'wyx-ui_badge-node',
            `wyx-ui_badge-node--${position}`,
            `wyx-ui_badge-node--${status}`,
            displayAsDot ? 'wyx-ui_badge-node--dot' : '',
            children ? 'wyx-ui_badge-node--with-children' : 'wyx-ui_badge-node--standalone',
          ].filter(Boolean).join(' ')}
          style={nodeStyle}
          aria-hidden
        >
          {!displayAsDot && <span className="wyx-ui_badge-text">{displayText}</span>}
        </sup>
      )}
    </span>
  );
};

export default Badge;

