import React from 'react';
import './index.scss';

export interface TimeLineItem {
  label?: React.ReactNode;
  title?: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  [key: string]: any;
}

export interface TimeLineProps {
  items: TimeLineItem[];
  direction?: 'vertical' | 'horizontal';
  layout?: 'linear' | 'cross';
  alternating?: boolean;
  lineColor?: string;
  axisGap?: number | string;
  enableActive?: boolean;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  onDotClick?: (index: number, item: TimeLineItem) => void;
  activeClassName?: string;
  activeDotClassName?: string;
  axisColor?: string;
  className?: string;
  style?: React.CSSProperties;
  renderItem?: (item: TimeLineItem, index: number) => React.ReactNode;
}

export default function TimeLine({
  items,
  direction = 'vertical',
  layout,
  alternating = true,
  lineColor,
  axisGap,
  enableActive = false,
  activeIndex,
  onActiveChange,
  onDotClick,
  activeClassName = 'wyx-active',
  activeDotClassName = 'wyx-active-dot',
  axisColor,
  className,
  style,
  renderItem,
}: TimeLineProps) {
  const isVert = direction === 'vertical';
  const isCross = layout ? layout === 'cross' : (isVert ? alternating : false);
  const cls = `wyx-ui_timeline ${isVert ? 'wyx-ui_timeline--vertical' : 'wyx-ui_timeline--horizontal'} ${isCross ? 'wyx-ui_timeline--cross' : 'wyx-ui_timeline--linear'} ${isCross && isVert ? 'wyx-ui_timeline--alt' : ''} ${className || ''}`;
  const [innerActive, setInnerActive] = React.useState<number | null>(null);
  const currentActive = activeIndex != null ? activeIndex : innerActive;
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const dots = Array.from(el.querySelectorAll('.wyx-ui_timeline-dot')) as HTMLElement[];
      if (!dots.length) return;
      const first = dots[0].getBoundingClientRect();
      const last = dots[dots.length - 1].getBoundingClientRect();
      if (isVert) {
        const rect = el.getBoundingClientRect();
        const cutTop = Math.max(0, (first.top + first.height / 2) - rect.top);
        const cutBottom = Math.max(0, rect.bottom - (last.top + last.height / 2));
        el.style.setProperty('--axis-cut-top', `${Math.round(cutTop)}px`);
        el.style.setProperty('--axis-cut-bottom', `${Math.round(cutBottom)}px`);
      } else {
        const itemsEl = el.querySelector('.wyx-ui_timeline-items') as HTMLElement | null;
        const rect = (itemsEl || el).getBoundingClientRect();
        const cutLeft = Math.max(0, (first.left + first.width / 2) - rect.left);
        const cutRight = Math.max(0, rect.right - (last.left + last.width / 2));
        el.style.setProperty('--axis-cut-left', `${Math.round(cutLeft)}px`);
        el.style.setProperty('--axis-cut-right', `${Math.round(cutRight)}px`);
        const topCards = Array.from(el.querySelectorAll('.wyx-ui_timeline-item--top .wyx-ui_timeline-card')) as HTMLElement[];
        const bottomCards = Array.from(el.querySelectorAll('.wyx-ui_timeline-item--bottom .wyx-ui_timeline-card')) as HTMLElement[];
        const topMax = topCards.length ? Math.max(...topCards.map(c => c.getBoundingClientRect().height)) : 0;
        const bottomMax = bottomCards.length ? Math.max(...bottomCards.map(c => c.getBoundingClientRect().height)) : 0;
        const gapVal = typeof axisGap === 'number' ? axisGap : (axisGap ? parseFloat(String(axisGap)) : 18);
        const totalH = Math.round(topMax + bottomMax + gapVal);
        el.style.setProperty('--h-items-height', `${totalH}px`);
      }
    };
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [items, isVert, axisGap, layout]);

  return (
    <div ref={rootRef} className={cls} style={{ ...(style || {}), ['--line-color' as any]: axisColor ?? lineColor, ['--axis-gap' as any]: axisGap }}>
      <div className="wyx-ui_timeline-items">
        <div className="wyx-ui_timeline-axis" />
        {items.map((it, i) => {
          const side = isCross ? (i % 2 === 0 ? 'left' : 'right') : 'right';
          const vertSideCls = isVert ? `wyx-ui_timeline-item--${side}` : '';
          const horizPos = isCross && !isVert ? (i % 2 === 0 ? 'top' : 'bottom') : 'bottom';
          const horizPosCls = !isVert ? `wyx-ui_timeline-item--${horizPos}` : '';
          const isActive = !!enableActive && currentActive === i;
          const itemCls = `wyx-ui_timeline-item ${vertSideCls} ${horizPosCls} ${isActive ? 'is-active' : ''} ${isActive && activeClassName ? activeClassName : ''}`;
          const dotCls = [
            'wyx-ui_timeline-dot',
            it.icon ? 'is-custom' : '',
            isActive ? 'is-active-dot' : '',
            isActive && activeDotClassName ? activeDotClassName : ''
          ].filter(Boolean).join(' ');
          const dotStyle = it.color ? ({ ['--dot-color' as any]: it.color } as React.CSSProperties) : undefined;
          const handleDotClick = () => {
            onDotClick?.(i, it);
            if (!enableActive) return;
            if (activeIndex != null) {
              onActiveChange?.(i);
            } else {
              setInnerActive(i);
              onActiveChange?.(i);
            }
          };
          const body = renderItem
            ? renderItem(it, i)
            : (
              <div className="wyx-ui_timeline-card">
                {it.label && <div className="wyx-ui_timeline-label">{it.label}</div>}
                {it.title && (
                  <div className="wyx-ui_timeline-head">
                    <div className="wyx-ui_timeline-title">{it.title}</div>
                  </div>
                )}
                {it.content && <div className="wyx-ui_timeline-content">{it.content}</div>}
              </div>
            );
          return (
            <div key={i} className={itemCls}>
              <div className={dotCls} style={dotStyle} onClick={handleDotClick}>{it.icon}</div>
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}