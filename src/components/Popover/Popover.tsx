import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [actualPlacement, setActualPlacement] = useState<PopoverPlacement>(placement);

  const setOpen = (v: boolean) => {
    if (!isControlled) setInnerOpen(v);
    onOpenChange?.(v);
  };

  const updatePosition = () => {
    const wrap = wrapRef.current;
    const pop = popRef.current;
    if (!wrap || !pop) return;

    const wrapRect = wrap.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    const pad = 8;

    const outOfView =
      wrapRect.bottom < -pad || wrapRect.top > vh + pad || wrapRect.right < -pad || wrapRect.left > vw + pad;
    if (outOfView) {
      setOpen(false);
      return;
    }

    let left = 0;
    let top = 0;
    let nextPlacement: PopoverPlacement = placement;

    if (placement === 'bottom') {
      const spaceBottom = vh - wrapRect.bottom - offset;
      const spaceTop = wrapRect.top - offset;
      if (spaceBottom < popRect.height + pad && spaceTop >= popRect.height + pad) nextPlacement = 'top';
    } else if (placement === 'top') {
      const spaceTop = wrapRect.top - offset;
      const spaceBottom = vh - wrapRect.bottom - offset;
      if (spaceTop < popRect.height + pad && spaceBottom >= popRect.height + pad) nextPlacement = 'bottom';
    } else if (placement === 'left') {
      const spaceLeft = wrapRect.left - offset;
      const spaceRight = vw - wrapRect.right - offset;
      if (spaceLeft < popRect.width + pad && spaceRight >= popRect.width + pad) nextPlacement = 'right';
    } else if (placement === 'right') {
      const spaceRight = vw - wrapRect.right - offset;
      const spaceLeft = wrapRect.left - offset;
      if (spaceRight < popRect.width + pad && spaceLeft >= popRect.width + pad) nextPlacement = 'left';
    }

    if (nextPlacement === 'bottom') {
      left = wrapRect.left + wrapRect.width / 2 - popRect.width / 2;
      top = wrapRect.bottom + offset;
    } else if (nextPlacement === 'top') {
      left = wrapRect.left + wrapRect.width / 2 - popRect.width / 2;
      top = wrapRect.top - offset - popRect.height;
    } else if (nextPlacement === 'left') {
      left = wrapRect.left - offset - popRect.width;
      top = wrapRect.top + wrapRect.height / 2 - popRect.height / 2;
    } else {
      left = wrapRect.right + offset;
      top = wrapRect.top + wrapRect.height / 2 - popRect.height / 2;
    }

    left = Math.min(Math.max(left, pad), Math.max(pad, vw - popRect.width - pad));
    top = Math.min(Math.max(top, pad), Math.max(pad, vh - popRect.height - pad));

    setPos({ left, top });
    setActualPlacement(nextPlacement);
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

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, placement, offset]);

  useEffect(() => {
    if (!open) return;
    const onAnyScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onAnyScroll, true);
    window.addEventListener('resize', onResize);

    const ro =
      typeof window !== 'undefined' && 'ResizeObserver' in window ? new ResizeObserver(() => updatePosition()) : null;
    if (ro) {
      if (wrapRef.current) ro.observe(wrapRef.current);
      if (popRef.current) ro.observe(popRef.current);
    }
    return () => {
      window.removeEventListener('scroll', onAnyScroll, true);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [open, placement, offset]);

  const events = useMemo(() => {
    if (trigger === 'hover') {
      return {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: (e: React.MouseEvent<HTMLSpanElement>) => {
          const next = e.relatedTarget as Node | null;
          const pop = popRef.current;
          if (next && pop && pop.contains(next)) return;
          setOpen(false);
        },
      } as React.HTMLAttributes<HTMLSpanElement>;
    }
    return {
      onClick: () => setOpen(!open),
    } as React.HTMLAttributes<HTMLSpanElement>;
  }, [trigger, open]);

  const popoverNode = (
    <span
      ref={popRef}
      className={`wyx-ui_popover ${open ? 'wyx-ui_popover--open' : ''} wyx-ui_popover--${actualPlacement}`}
      style={{
        left: `${pos.left}px`,
        top: `${pos.top}px`,
      }}
      role="tooltip"
      onClick={
        trigger === 'click'
          ? (e) => {
              e.stopPropagation();
            }
          : undefined
      }
      onMouseEnter={trigger === 'hover' ? () => setOpen(true) : undefined}
      onMouseLeave={
        trigger === 'hover'
          ? (e) => {
              const next = e.relatedTarget as Node | null;
              const wrap = wrapRef.current;
              if (next && wrap && wrap.contains(next)) return;
              setOpen(false);
            }
          : undefined
      }
    >
      <span className={`wyx-ui_popover-arrow wyx-ui_popover-arrow--${actualPlacement}`} />
      <span className="wyx-ui_popover-content">{content}</span>
    </span>
  );

  return (
    <span ref={wrapRef} className={`wyx-ui_popover-wrap ${className || ''}`} style={style} {...events}>
      {children}
      {open && typeof document !== 'undefined' ? createPortal(popoverNode, document.body) : null}
    </span>
  );
};

export default Popover;
