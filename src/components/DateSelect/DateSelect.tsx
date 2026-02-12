import React, { useEffect, useMemo, useState } from 'react';
import Popover from '../Popover/Popover';
import './index.scss';

export type DateSelectSize = 'sm' | 'md' | 'lg';

type DateInput = Date | string | null | undefined;
type DateRangeInput = [DateInput, DateInput] | null | undefined;

interface DateSelectCommonProps {
  placeholder?: string;
  format?: (date: Date) => string;
  disabled?: boolean;
  readOnly?: boolean;
  allowClear?: boolean;
  min?: Date | string;
  max?: Date | string;
  disabledDate?: (date: Date) => boolean;
  size?: DateSelectSize;
  weekLabels?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export interface DateSelectSingleProps extends DateSelectCommonProps {
  range?: false;
  value?: Date | string | null;
  defaultValue?: Date | string | null;
  onChange?: (date: Date | null) => void;
}

export interface DateSelectRangeProps extends DateSelectCommonProps {
  range: true;
  value?: DateRangeInput;
  defaultValue?: DateRangeInput;
  onChange?: (range: [Date | null, Date | null]) => void;
  rangeSeparator?: string;
}

export type DateSelectProps = DateSelectSingleProps | DateSelectRangeProps;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return y * 10000 + m * 100 + day;
}

function toLocalDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateInput(input: Date | string | null | undefined) {
  if (!input) return null;
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return toLocalDateOnly(input);
  }
  const s = String(input).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  if (mo < 1 || mo > 12) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

function parseRangeInput(input: DateRangeInput): [Date | null, Date | null] {
  if (!input) return [null, null];
  if (!Array.isArray(input)) return [null, null];
  const start = parseDateInput(input[0]);
  const end = parseDateInput(input[1]);
  if (start && end) {
    const a = toDateKey(start);
    const b = toDateKey(end);
    return a <= b ? [start, end] : [end, start];
  }
  return [start, end];
}

function formatDefault(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  const rotate = dir === 'left' ? 180 : 0;
  return (
    <svg
      className="wyx-ui_date-select__chev"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Close() {
  return (
    <svg className="wyx-ui_date-select__close" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function DateSelect(props: DateSelectProps) {
  const {
    value: valueProp,
    defaultValue,
    placeholder = 'Select date',
    format = formatDefault,
    disabled = false,
    readOnly = false,
    allowClear = true,
    min,
    max,
    disabledDate,
    size = 'md',
    weekLabels,
    className,
    style,
  } = props;

  const isRange = (props as DateSelectRangeProps).range === true;
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');
  const [inner, setInner] = useState<Date | null>(() => (isRange ? null : parseDateInput(defaultValue as DateInput)));
  const [innerRange, setInnerRange] = useState<[Date | null, Date | null]>(() =>
    isRange ? parseRangeInput(defaultValue as DateRangeInput) : [null, null]
  );
  const [open, setOpen] = useState(false);
  const [panelMonth, setPanelMonth] = useState<Date>(() => {
    if (isRange) {
      const [s] = parseRangeInput(valueProp as DateRangeInput);
      return startOfMonth(s || innerRange[0] || new Date());
    }
    return startOfMonth(parseDateInput(valueProp as DateInput) || inner || new Date());
  });

  const value = useMemo(
    () => (isControlled && !isRange ? parseDateInput(valueProp as DateInput) : inner),
    [isControlled, isRange, valueProp, inner]
  );
  const rangeValue = useMemo<[Date | null, Date | null]>(() => {
    if (!isRange) return [null, null];
    return isControlled ? parseRangeInput(valueProp as DateRangeInput) : innerRange;
  }, [isControlled, isRange, valueProp, innerRange]);
  const minDate = useMemo(() => parseDateInput(min), [min]);
  const maxDate = useMemo(() => parseDateInput(max), [max]);
  const minKey = minDate ? toDateKey(minDate) : null;
  const maxKey = maxDate ? toDateKey(maxDate) : null;

  useEffect(() => {
    if (!open) return;
    if (isRange) {
      const [s] = rangeValue;
      setPanelMonth(startOfMonth(s || new Date()));
    } else {
      setPanelMonth(startOfMonth(value || new Date()));
    }
  }, [open, isRange, rangeValue, value]);

  const setValue = (next: Date | null) => {
    if (disabled || readOnly) return;
    if (!isControlled) setInner(next);
    (props as DateSelectSingleProps).onChange?.(next);
  };

  const setRange = (next: [Date | null, Date | null]) => {
    if (disabled || readOnly) return;
    if (!isControlled) setInnerRange(next);
    (props as DateSelectRangeProps).onChange?.(next);
  };

  const canClear = useMemo(() => {
    if (!allowClear || disabled || readOnly) return false;
    if (isRange) return !!rangeValue[0] || !!rangeValue[1];
    return !!value;
  }, [allowClear, disabled, readOnly, isRange, rangeValue, value]);

  const rootClassName = [
    'wyx-ui_date-select',
    `is-${size}`,
    disabled ? 'is-disabled' : '',
    readOnly ? 'is-readonly' : '',
    isRange ? 'is-range' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  const monthLabel = useMemo(() => {
    const y = panelMonth.getFullYear();
    const m = panelMonth.getMonth() + 1;
    return `${y}-${pad2(m)}`;
  }, [panelMonth]);

  const days = useMemo(() => {
    const first = startOfMonth(panelMonth);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [panelMonth]);

  const isDateDisabled = (d: Date) => {
    const k = toDateKey(d);
    if (minKey !== null && k < minKey) return true;
    if (maxKey !== null && k > maxKey) return true;
    if (disabledDate?.(d)) return true;
    return false;
  };

  const commit = (d: Date) => {
    if (disabled || readOnly) return;
    if (isDateDisabled(d)) return;
    if (!isRange) {
      setValue(d);
      setOpen(false);
      return;
    }

    const [s, e] = rangeValue;
    if (!s || (s && e)) {
      setRange([d, null]);
      return;
    }

    const a = toDateKey(s);
    const b = toDateKey(d);
    const next: [Date | null, Date | null] = a <= b ? [s, d] : [d, s];
    setRange(next);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || readOnly) return;
    if (isRange) setRange([null, null]);
    else setValue(null);
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (disabled || readOnly) return;
    setOpen(next);
  };

  const labels = useMemo(() => {
    if (weekLabels && weekLabels.length === 7) return weekLabels;
    const isZh =
      (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')) ||
      (typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('zh'));
    return isZh ? ['日', '一', '二', '三', '四', '五', '六'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  }, [weekLabels]);

  const rangeSeparator = (props as DateSelectRangeProps).rangeSeparator || ' ~ ';
  const displayText = useMemo(() => {
    if (!isRange) return value ? format(value) : placeholder;
    const [s, e] = rangeValue;
    if (!s && !e) return placeholder;
    if (s && e) return `${format(s)}${rangeSeparator}${format(e)}`;
    if (s) return `${format(s)}${rangeSeparator}`;
    return placeholder;
  }, [format, isRange, placeholder, rangeSeparator, rangeValue, value]);

  const isPlaceholder = useMemo(() => {
    if (!isRange) return !value;
    return !rangeValue[0] && !rangeValue[1];
  }, [isRange, rangeValue, value]);

  const startKey = isRange && rangeValue[0] ? toDateKey(rangeValue[0]) : null;
  const endKey = isRange && rangeValue[1] ? toDateKey(rangeValue[1]) : null;
  const rangeMinKey = isRange && startKey !== null && endKey !== null ? Math.min(startKey, endKey) : null;
  const rangeMaxKey = isRange && startKey !== null && endKey !== null ? Math.max(startKey, endKey) : null;

  const weeks = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  const content = (
    <div className={['wyx-ui_date-select__panel', isRange ? 'is-range' : ''].filter(Boolean).join(' ')} onMouseDown={(e) => e.stopPropagation()}>
      <div className="wyx-ui_date-select__panel-head">
        <button
          type="button"
          className="wyx-ui_date-select__nav"
          onClick={() => setPanelMonth((m) => addMonths(m, -1))}
          aria-label="Previous month"
        >
          <Chevron dir="left" />
        </button>
        <div className="wyx-ui_date-select__month">{monthLabel}</div>
        <button
          type="button"
          className="wyx-ui_date-select__nav"
          onClick={() => setPanelMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <Chevron dir="right" />
        </button>
      </div>
      <div className="wyx-ui_date-select__week">
        {labels.map((w) => (
          <div key={w} className="wyx-ui_date-select__week-cell">
            {w}
          </div>
        ))}
      </div>
      <div className="wyx-ui_date-select__grid" role="grid">
        {weeks.map((week, rowIdx) => {
          let bgStart: number | null = null;
          let bgEnd: number | null = null;
          let roundLeft = false;
          let roundRight = false;

          if (rangeMinKey !== null && rangeMaxKey !== null) {
            for (let i = 0; i < week.length; i++) {
              const k = toDateKey(week[i]);
              if (k >= rangeMinKey && k <= rangeMaxKey) {
                if (bgStart === null) bgStart = i;
                bgEnd = i;
              }
            }
            if (bgStart !== null && bgEnd !== null) {
              roundLeft = toDateKey(week[bgStart]) === rangeMinKey;
              roundRight = toDateKey(week[bgEnd]) === rangeMaxKey;
            }
          }

          return (
            <div key={rowIdx} className="wyx-ui_date-select__row" role="row">
              {bgStart !== null && bgEnd !== null ? (
                <span
                  aria-hidden="true"
                  className={[
                    'wyx-ui_date-select__range-bg',
                    roundLeft ? 'is-round-left' : '',
                    roundRight ? 'is-round-right' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    ['--wyx-date-select-bg-start' as any]: bgStart,
                    ['--wyx-date-select-bg-right' as any]: 6 - bgEnd,
                  }}
                />
              ) : null}
              {week.map((d, colIdx) => {
                const inMonth = d.getMonth() === panelMonth.getMonth();
                const isToday = isSameDay(d, new Date());
                const selected = !isRange && !!value && isSameDay(d, value);
                const k = toDateKey(d);
                const isStart = isRange && startKey !== null && k === startKey;
                const isEnd = isRange && endKey !== null && k === endKey;
                const inRange = rangeMinKey !== null && rangeMaxKey !== null ? k > rangeMinKey && k < rangeMaxKey : false;
                const dis = isDateDisabled(d);
                const idx = rowIdx * 7 + colIdx;

                return (
                  <button
                    key={idx}
                    type="button"
                    className={[
                      'wyx-ui_date-select__cell',
                      inMonth ? 'is-in' : 'is-out',
                      isToday ? 'is-today' : '',
                      selected ? 'is-selected' : '',
                      isStart ? 'is-range-start' : '',
                      isEnd ? 'is-range-end' : '',
                      inRange ? 'is-in-range' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={dis}
                    onClick={() => commit(d)}
                    role="gridcell"
                    aria-selected={selected || isStart || isEnd}
                  >
                    <span className="wyx-ui_date-select__cell-text">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {minDate || maxDate ? (
        <div className="wyx-ui_date-select__limit">
          {minDate ? <span>min: {format(minDate)}</span> : null}
          {maxDate ? <span>max: {format(maxDate)}</span> : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottom"
      open={open}
      onOpenChange={handleOpenChange}
      content={content}
      className={rootClassName}
      style={style}
    >
      <button
        type="button"
        className="wyx-ui_date-select__trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={['wyx-ui_date-select__value', !isPlaceholder ? 'is-set' : 'is-placeholder'].join(' ')}>
          {displayText}
        </span>
        <span className="wyx-ui_date-select__right">
          {canClear ? (
            <span
              className="wyx-ui_date-select__clear"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clear}
              aria-label="Clear"
              role="button"
              tabIndex={-1}
            >
              <Close />
            </span>
          ) : null}
          <span className="wyx-ui_date-select__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <rect x="4" y="5" width="16" height="16" rx="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M8 3v4M16 3v4M4 9h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </span>
      </button>
    </Popover>
  );
}
