import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
export type PopoverTrigger = 'click' | 'hover';

export interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  trigger?: PopoverTrigger;
  offset?: number;
  className?: string;
  style?: React.CSSProperties;
}

const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = 'top',
  trigger = 'hover',
  offset = 8,
  className,
  style,
}) => {
  const isControlled = typeof openProp === 'boolean';
  const [innerOpen, setInnerOpen] = useState(!!defaultOpen);
  const open = isControlled ? !!openProp : innerOpen;
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const popRef = useRef<HTMLSpanElement | null>(null);

  const setOpen = (v: boolean) => {
    if (!isControlled) setInnerOpen(v);
    onOpenChange?.(v);
  };

  useEffect(() => {
    if (trigger !== 'click' || !open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      const pop = popRef.current;
      const t = e.target as Node | null;
      if (!t) return;
      if ((el && el.contains(t)) || (pop && pop.contains(t))) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  }, [open, trigger]);

  const events = useMemo(() => {
    if (trigger === 'hover') {
      return {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      } as React.HTMLAttributes<HTMLSpanElement>;
    }
    return {
      onClick: () => setOpen(!open),
    } as React.HTMLAttributes<HTMLSpanElement>;
  }, [trigger, open]);

  return (
    <span ref={wrapRef} className={`wyx-ui_popover-wrap ${className || ''}`} style={style} {...events}>
      {children}
      <span
        ref={popRef}
        className={`wyx-ui_popover ${open ? 'wyx-ui_popover--open' : ''} wyx-ui_popover--${placement}`}
        style={{
          ['--popover-offset' as any]: `${offset}px`,
        }}
        role="tooltip"
        aria-hidden={!open}
        onClick={trigger === 'click' ? (e) => { e.stopPropagation(); } : undefined}
      >
        <span className={`wyx-ui_popover-arrow wyx-ui_popover-arrow--${placement}`} />
        <span className="wyx-ui_popover-content">{content}</span>
      </span>
    </span>
  );
};

export default Popover;