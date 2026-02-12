import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';

export type RateSize = 'sm' | 'md' | 'lg';

export type RateItemState = {
  index: number;
  value: number;
  displayValue: number;
  active: boolean;
  fillPercent: number;
};

export type RateItemIcon = React.ReactNode | ((state: RateItemState) => React.ReactNode);

export type RateItemConfig = {
  icon?: RateItemIcon;
  baseColor?: string;
  fillColor?: string;
  glowColor?: string;
};

export interface RateProps {
  value?: number;
  defaultValue?: number;
  count?: number;
  allowHalf?: boolean;
  allowClear?: boolean;
  size?: RateSize;
  disabled?: boolean;
  readOnly?: boolean;
  tooltips?: string[];
  items?: RateItemConfig[];
  onChange?: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function roundToStep(v: number, step: number) {
  const n = Math.round(v / step) * step;
  return Number(n.toFixed(step === 0.5 ? 1 : 0));
}

function getFillPercent(value: number, index: number) {
  if (value >= index + 1) return 100;
  if (value >= index + 0.5) return 50;
  return 0;
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2.2l2.96 6.27 6.93.98-5.04 4.91 1.2 6.9L12 18.9l-6.05 3.36 1.2-6.9-5.04-4.91 6.93-.98L12 2.2z" />
    </svg>
  );
}

function renderIcon(icon: RateItemIcon | undefined, state: RateItemState, className: string) {
  const node = typeof icon === 'function' ? icon(state) : icon;
  if (!node) return <StarIcon className={className} />;
  if (React.isValidElement(node)) {
    const prev = (node.props as { className?: string }).className;
    const merged = [prev, className].filter(Boolean).join(' ');
    return React.cloneElement(node, { className: merged });
  }
  return node;
}

export default function Rate(props: RateProps) {
  const {
    value: valueProp,
    defaultValue,
    allowHalf = true,
    allowClear = true,
    size = 'md',
    disabled = false,
    readOnly = false,
    tooltips,
    items,
    onChange,
    className,
    style,
  } = props;

  const count = props.count ?? items?.length ?? 5;
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');
  const step = allowHalf ? 0.5 : 1;
  const [inner, setInner] = useState<number>(defaultValue ?? 0);
  const [hover, setHover] = useState<number | null>(null);
  const [burstIndex, setBurstIndex] = useState<number | null>(null);
  const burstTimerRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const value = isControlled ? (valueProp ?? 0) : inner;
  const displayValue = hover ?? value;

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    };
  }, []);

  const setValue = (next: number, sourceIndex?: number) => {
    if (disabled || readOnly) return;
    const normalized = clamp(roundToStep(next, step), 0, count);
    const finalValue = allowClear && normalized === value ? 0 : normalized;
    if (!isControlled) setInner(finalValue);
    setHover((prev) => (prev === null ? prev : finalValue));
    onChange?.(finalValue);
    if (typeof sourceIndex === 'number') {
      setBurstIndex(sourceIndex);
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
      burstTimerRef.current = window.setTimeout(() => setBurstIndex(null), 420);
    }
  };

  const ariaValueText = useMemo(() => {
    if (!tooltips?.length) return undefined;
    const idx = Math.ceil(displayValue) - 1;
    if (idx < 0 || idx >= tooltips.length) return undefined;
    return tooltips[idx];
  }, [displayValue, tooltips]);

  const rootClassName = [
    'wyx-ui_rate',
    `is-${size}`,
    disabled ? 'is-disabled' : '',
    readOnly ? 'is-readonly' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || readOnly) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setValue(value + step);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setValue(value - step);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setValue(0);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      setValue(count);
      return;
    }
    if (e.key === 'Escape') {
      setHover(null);
    }
  };

  return (
    <div
      ref={rootRef}
      className={rootClassName}
      style={style}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={count}
      aria-valuenow={value}
      aria-valuetext={ariaValueText}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: count }).map((_, index) => {
        const fill = getFillPercent(displayValue, index);
        const nextFull = index + 1;
        const nextHalf = index + 0.5;
        const active = displayValue >= nextHalf;
        const isBurst = burstIndex === index;
        const tooltip = tooltips?.[index];
        const config = items?.[index];
        const starStyle = {
          ...(config?.baseColor ? { ['--wyx-rate-item-base' as string]: config.baseColor } : null),
          ...(config?.fillColor ? { ['--wyx-rate-item-fill' as string]: config.fillColor } : null),
          ...(config?.glowColor ? { ['--wyx-rate-item-glow' as string]: config.glowColor } : null),
        } as React.CSSProperties;
        const state: RateItemState = { index, value, displayValue, active, fillPercent: fill };

        return (
          <button
            key={index}
            type="button"
            className={[
              'wyx-ui_rate__item',
              active ? 'is-active' : '',
              isBurst ? 'is-burst' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={tooltip ? `${nextFull} ${tooltip}` : `${nextFull}`}
            aria-pressed={value >= nextHalf}
            disabled={disabled}
            onMouseDown={(e) => {
              if (disabled || readOnly) return;
              e.preventDefault();
              rootRef.current?.focus();
            }}
            onMouseMove={(e) => {
              if (disabled || readOnly) return;
              if (!allowHalf) {
                setHover(nextFull);
                return;
              }
              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
              const ratio = rect.width ? (e.clientX - rect.left) / rect.width : 1;
              const next = ratio <= 0.5 ? nextHalf : nextFull;
              setHover(next);
            }}
            onFocus={() => {
              if (disabled || readOnly) return;
              setHover((prev) => (prev === null ? value || 0 : prev));
            }}
            onBlur={() => setHover(null)}
            onClick={(e) => {
              if (disabled || readOnly) return;
              if (!allowHalf) {
                setValue(nextFull, index);
                return;
              }
              const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
              const ratio = rect.width ? (e.clientX - rect.left) / rect.width : 1;
              const next = ratio <= 0.5 ? nextHalf : nextFull;
              setValue(next, index);
            }}
          >
            <span className="wyx-ui_rate__star" data-fill={fill} style={starStyle}>
              {renderIcon(config?.icon, state, 'wyx-ui_rate__svg wyx-ui_rate__svg--base')}
              <span className="wyx-ui_rate__fill" style={{ width: `${fill}%` }}>
                {renderIcon(config?.icon, state, 'wyx-ui_rate__svg wyx-ui_rate__svg--fill')}
              </span>
            </span>
            {tooltip ? <span className="wyx-ui_rate__tooltip">{tooltip}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
