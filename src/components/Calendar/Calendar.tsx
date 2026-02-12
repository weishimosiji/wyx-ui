import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import './index.scss';

type DateInput = Date | string | null | undefined;

export type CalendarMarkVariant = 'single' | 'range';

export interface CalendarMark {
  date: Date | string;
  color?: string;
  variant?: CalendarMarkVariant;
  content?: React.ReactNode;
}

export interface CalendarHoliday {
  date: Date | string;
  name: string;
  color?: string;
}

export type CalendarSelectInfo = {
  date: Date;
  dateKey: number;
  inMonth: boolean;
  isToday: boolean;
  disabled: boolean;
  marks: string[];
  holidays: { name: string; color?: string }[];
  holidayLabel: string;
  chineseFestivals: { name: string; color?: string }[];
  internationalFestivals: { name: string; color?: string }[];
  lunarLabel: string;
  subLabel: string;
  subType: 'cn' | 'intl' | 'lunar' | '';
};

export type CalendarMarkRenderInfo = {
  date: Date;
  dateKey: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  disabled: boolean;
  marks: string[];
  markKind: CalendarMarkVariant | '';
  hasSingleMark: boolean;
  hasRangeMark: boolean;
  isDragRange: boolean;
};

export type CalendarMarkEvent = {
  variant: CalendarMarkVariant;
  dates: Date[];
};

export interface CalendarProps {
  value?: Date | string | null;
  defaultValue?: Date | string | null;
  onChange?: (date: Date | null) => void;
  onSelect?: (info: CalendarSelectInfo) => void;

  month?: Date | string;
  defaultMonth?: Date | string;
  onMonthChange?: (month: Date) => void;

  min?: Date | string;
  max?: Date | string;
  disabledDate?: (date: Date) => boolean;

  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  weekLabels?: string[];
  showOutsideDays?: boolean;
  showToday?: boolean;

  marks?: CalendarMark[];
  defaultMarks?: CalendarMark[];
  onMarksChange?: (marks: CalendarMark[]) => void;
  onMark?: (event: CalendarMarkEvent) => void;
  markable?: boolean;
  markColor?: string;
  markBehavior?: 'toggle' | 'add';
  dragToMark?: boolean;
  renderMark?: (info: CalendarMarkRenderInfo) => React.ReactNode;
  holidays?: CalendarHoliday[];
  showLunar?: boolean;
  showHolidays?: boolean;
  locale?: string;

  className?: string;
  style?: React.CSSProperties;
}

export interface CalendarRef {
  clearMarks: (dates: Array<Date | string>) => void;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function addDays(d: Date, delta: number) {
  const next = new Date(d);
  next.setDate(d.getDate() + delta);
  return next;
}

function toLocalDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return y * 10000 + m * 100 + day;
}

function parseDateInput(input: DateInput) {
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

function normalizeMarks(list: CalendarMark[]) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const map = new Map<string, { idx: number; mark: CalendarMark }>();
  list.forEach((m, idx) => {
    const d = parseDateInput(m.date);
    if (!d) return;
    const k = toDateKey(d);
    const variant: CalendarMarkVariant = m.variant === 'range' ? 'range' : 'single';
    map.set(`${k}-${variant}`, { idx, mark: m });
  });
  return [...map.values()]
    .sort((a, b) => a.idx - b.idx)
    .map((v) => v.mark);
}

function defaultWeekLabels(locale: string) {
  const lc = String(locale || '').toLowerCase();
  if (lc === 'zh' || lc.startsWith('zh-')) return ['日', '一', '二', '三', '四', '五', '六'];
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function parseMonthInput(input: Date | string | undefined) {
  const d = parseDateInput(input);
  if (!d) return null;
  return startOfMonth(d);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toCnDay(day: number) {
  const n = Math.max(1, Math.min(30, Math.floor(day)));
  const tens = Math.floor((n - 1) / 10);
  const ones = (n - 1) % 10 + 1;
  const tenChars = ['初', '十', '廿', '三'];
  const numChars = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  if (n === 10) return '初十';
  if (n === 20) return '二十';
  if (n === 30) return '三十';

  if (tens === 0) return `初${numChars[ones - 1]}`;
  if (tens === 1) return `十${ones === 10 ? '' : numChars[ones - 1]}`;
  if (tens === 2) return `廿${numChars[ones - 1]}`;
  return `三${numChars[ones - 1]}`;
}

function qingmingDay(year: number) {
  const y = year % 100;
  const base = year >= 2000 ? 4.81 : 5.59;
  return Math.floor(y * 0.2422 + base) - Math.floor((y - 1) / 4);
}

function parseFirstNumber(s: string) {
  const m = /(\d+)/.exec(s);
  return m ? Number(m[1]) : null;
}

type LunarInfo = {
  month: number | null;
  day: number | null;
  monthText: string;
  label: string;
};

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  const rotate = dir === 'left' ? 180 : 0;
  return (
    <svg
      className="wyx-ui_calendar__chev"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const Calendar = React.forwardRef<CalendarRef, CalendarProps>((props: CalendarProps, ref) => {
  const {
    value: valueProp,
    defaultValue,
    month: monthProp,
    defaultMonth,
    min,
    max,
    disabledDate,
    weekStartsOn = 0,
    weekLabels,
    showOutsideDays = true,
    showToday = true,
    marks,
    defaultMarks,
    onMarksChange,
    onMark,
    markable = false,
    markColor = 'var(--primary-border)',
    markBehavior = 'toggle',
    dragToMark = true,
    renderMark,
    holidays,
    showLunar = true,
    showHolidays = true,
    locale = 'zh-CN',
    className,
    style,
  } = props;

  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');
  const isMonthControlled = Object.prototype.hasOwnProperty.call(props, 'month');
  const isMarksControlled = Object.prototype.hasOwnProperty.call(props, 'marks');

  const [inner, setInner] = useState<Date | null>(() => parseDateInput(defaultValue));
  const selected = useMemo(() => (isControlled ? parseDateInput(valueProp) : inner), [isControlled, valueProp, inner]);

  const [innerMarks, setInnerMarks] = useState<CalendarMark[]>(() => normalizeMarks(Array.isArray(defaultMarks) ? defaultMarks : []));
  const marksList = useMemo(
    () => normalizeMarks(isMarksControlled ? marks || [] : innerMarks),
    [isMarksControlled, marks, innerMarks],
  );

  const [panelMonth, setPanelMonth] = useState<Date>(() => {
    const fromMonthProp = parseMonthInput(monthProp);
    const fromDefaultMonth = parseMonthInput(defaultMonth);
    const fromSelected = selected ? startOfMonth(selected) : null;
    return fromMonthProp || fromDefaultMonth || fromSelected || startOfMonth(new Date());
  });

  const lastMonthRef = useRef(panelMonth);
  const [monthAnim, setMonthAnim] = useState<'prev' | 'next'>('next');

  useEffect(() => {
    if (!isMonthControlled) return;
    const next = parseMonthInput(monthProp);
    if (!next) return;
    const prev = lastMonthRef.current;
    const dir = next.getTime() >= prev.getTime() ? 'next' : 'prev';
    setMonthAnim(dir);
    lastMonthRef.current = next;
    setPanelMonth(next);
  }, [isMonthControlled, monthProp]);

  const minDate = useMemo(() => parseDateInput(min), [min]);
  const maxDate = useMemo(() => parseDateInput(max), [max]);
  const minKey = minDate ? toDateKey(minDate) : null;
  const maxKey = maxDate ? toDateKey(maxDate) : null;

  const normalizedWeekLabels = useMemo(() => {
    if (Array.isArray(weekLabels) && weekLabels.length === 7) return weekLabels;
    const base = defaultWeekLabels(locale);
    const out = [...base.slice(weekStartsOn), ...base.slice(0, weekStartsOn)];
    return out;
  }, [weekLabels, weekStartsOn, locale]);

  const monthLabel = useMemo(() => {
    const y = panelMonth.getFullYear();
    const m = panelMonth.getMonth() + 1;
    return `${y}-${pad2(m)}`;
  }, [panelMonth]);

  const days = useMemo(() => {
    const first = startOfMonth(panelMonth);
    const start = new Date(first);
    const offset = (first.getDay() - weekStartsOn + 7) % 7;
    start.setDate(1 - offset);
    const out: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push(d);
    }
    return out;
  }, [panelMonth, weekStartsOn]);

  const daysByKey = useMemo(() => {
    const map = new Map<number, Date>();
    days.forEach((d) => {
      map.set(toDateKey(d), d);
    });
    return map;
  }, [days]);

  const marksMetaMap = useMemo(() => {
    const map = new Map<
      number,
      {
        allColors: string[];
        singleColors: string[];
        singleContents: React.ReactNode[];
        hasRange: boolean;
        rangeColor: string | null;
      }
    >();
    marksList.forEach((m) => {
      const d = parseDateInput(m.date);
      if (!d) return;
      const k = toDateKey(d);
      const next = map.get(k) || { allColors: [], singleColors: [], singleContents: [], hasRange: false, rangeColor: null };
      const color = m.color || 'var(--primary-border)';
      const variant: CalendarMarkVariant = m.variant === 'range' ? 'range' : 'single';

      next.allColors.push(color);
      if (variant === 'range') {
        next.hasRange = true;
        if (!next.rangeColor) next.rangeColor = color;
      } else {
        next.singleColors.push(color);
        if (m.content) next.singleContents.push(m.content);
      }

      map.set(k, next);
    });
    return map;
  }, [marksList]);

  const rangeKeySet = useMemo(() => {
    const set = new Set<number>();
    marksMetaMap.forEach((v, k) => {
      if (v.hasRange) set.add(k);
    });
    return set;
  }, [marksMetaMap]);

  const setMarks = (next: CalendarMark[]) => {
    const normalized = normalizeMarks(next);
    if (!isMarksControlled) setInnerMarks(normalized);
    onMarksChange?.(normalized);
  };

  const clearMarks = (dates: Array<Date | string>) => {
    if (!Array.isArray(dates) || dates.length === 0) return;
    const keySet = new Set<number>();
    dates.forEach((v) => {
      const d = parseDateInput(v);
      if (!d) return;
      keySet.add(toDateKey(d));
    });
    if (keySet.size === 0) return;
    setMarks(
      marksList.filter((m) => {
        const d = parseDateInput(m.date);
        if (!d) return true;
        return !keySet.has(toDateKey(d));
      }),
    );
  };

  useImperativeHandle(ref, () => ({ clearMarks }));

  const removeSingleMark = (d: Date) => {
    const k = toDateKey(d);
    setMarks(
      marksList.filter((m) => {
        const md = parseDateInput(m.date);
        if (!md || toDateKey(md) !== k) return true;
        return m.variant === 'range';
      }),
    );
  };

  const addSingleMark = (d: Date) => {
    setMarks([...marksList, { date: d, color: markColor, variant: 'single' }]);
    onMark?.({ variant: 'single', dates: [d] });
  };

  const toggleSingleMark = (d: Date) => {
    const k = toDateKey(d);
    const exists = marksList.some((m) => {
      const md = parseDateInput(m.date);
      return !!md && toDateKey(md) === k && m.variant !== 'range';
    });
    if (exists) {
      removeSingleMark(d);
      return;
    }
    addSingleMark(d);
  };

  const applyMarkBehavior = (d: Date) => {
    if (markBehavior === 'add') {
      addSingleMark(d);
      return;
    }
    toggleSingleMark(d);
  };

  const isDateDisabled = (d: Date) => {
    const k = toDateKey(d);
    if (minKey !== null && k < minKey) return true;
    if (maxKey !== null && k > maxKey) return true;
    if (disabledDate?.(d)) return true;
    return false;
  };

  const setValue = (next: Date | null) => {
    if (!isControlled) setInner(next);
    props.onChange?.(next);
  };

  const setMonth = (next: Date) => {
    const prev = lastMonthRef.current;
    const dir = next.getTime() >= prev.getTime() ? 'next' : 'prev';
    setMonthAnim(dir);
    lastMonthRef.current = next;
    if (!isMonthControlled) setPanelMonth(next);
    props.onMonthChange?.(next);
  };

  const today = useMemo(() => toLocalDateOnly(new Date()), []);

  const lunarNumFormatter = useMemo(() => new Intl.DateTimeFormat(`${locale}-u-ca-chinese`, { month: 'numeric', day: 'numeric' }), [locale]);
  const lunarMonthFormatter = useMemo(() => new Intl.DateTimeFormat(`${locale}-u-ca-chinese`, { month: 'long' }), [locale]);
  const lunarCacheRef = useRef<Map<number, LunarInfo>>(new Map());

  const customHolidayMap = useMemo(() => {
    const map = new Map<number, { name: string; color?: string }[]>();
    (holidays || []).forEach((h) => {
      const d = parseDateInput(h.date);
      if (!d) return;
      const k = toDateKey(d);
      const list = map.get(k) || [];
      list.push({ name: h.name, color: h.color });
      map.set(k, list);
    });
    return map;
  }, [holidays]);

  const getLunarInfo = (d: Date): LunarInfo => {
    const k = toDateKey(d);
    const cached = lunarCacheRef.current.get(k);
    if (cached) return cached;

    let monthNum: number | null = null;
    let dayNum: number | null = null;
    try {
      const parts = lunarNumFormatter.formatToParts(d);
      const m = parts.find((p) => p.type === 'month')?.value ?? '';
      const day = parts.find((p) => p.type === 'day')?.value ?? '';
      monthNum = parseFirstNumber(m);
      dayNum = parseFirstNumber(day);
    } catch (_e) {
      monthNum = null;
      dayNum = null;
    }

    let monthText = '';
    try {
      const parts = lunarMonthFormatter.formatToParts(d);
      monthText = parts.find((p) => p.type === 'month')?.value ?? '';
    } catch (_e) {
      monthText = '';
    }

    const label = dayNum === 1 ? monthText : dayNum ? toCnDay(dayNum) : '';
    const out: LunarInfo = { month: monthNum, day: dayNum, monthText, label };
    lunarCacheRef.current.set(k, out);
    return out;
  };

  const getChineseFestivalEntries = (d: Date): { name: string; color?: string }[] => {
    const k = toDateKey(d);
    const custom = customHolidayMap.get(k);
    if (custom && custom.length > 0) return custom;

    const solarM = d.getMonth() + 1;
    const solarD = d.getDate();
    const solarKey = `${pad2(solarM)}-${pad2(solarD)}`;
    const cnSolarNameMap: Record<string, string> = {
      '01-01': '元旦',
      '05-01': '劳动节',
      '10-01': '国庆节',
    };
    const qingming = solarM === 4 && solarD === qingmingDay(d.getFullYear()) ? '清明节' : '';
    const solarName = qingming || cnSolarNameMap[solarKey] || '';

    const lunar = getLunarInfo(d);
    const cnLunarNameMap: Record<string, string> = {
      '1-1': '春节',
      '1-15': '元宵节',
      '5-5': '端午节',
      '7-7': '七夕',
      '8-15': '中秋节',
      '9-9': '重阳节',
      '12-8': '腊八节',
      '12-23': '小年',
    };
    const lunarKey = lunar.month && lunar.day ? `${lunar.month}-${lunar.day}` : '';
    let lunarName = (lunarKey && cnLunarNameMap[lunarKey]) || '';

    if (!lunarName && lunar.month === 12 && (lunar.day === 29 || lunar.day === 30)) {
      const next = getLunarInfo(addDays(d, 1));
      if (next.month === 1 && next.day === 1) lunarName = '除夕';
    }

    const out: { name: string }[] = [];
    if (lunarName) out.push({ name: lunarName });
    if (solarName) out.push({ name: solarName });
    return out;
  };

  const getInternationalFestivalEntries = (d: Date): { name: string; color?: string }[] => {
    const solarM = d.getMonth() + 1;
    const solarD = d.getDate();
    const solarKey = `${pad2(solarM)}-${pad2(solarD)}`;
    const intlSolarNameMap: Record<string, string> = {
      '02-14': '情人节',
      '03-08': '妇女节',
      '04-01': '愚人节',
      '10-31': '万圣节',
      '12-25': '圣诞节',
    };
    const name = intlSolarNameMap[solarKey] || '';
    return name ? [{ name }] : [];
  };

  const getSubInfo = (d: Date) => {
    const chinese = showHolidays ? getChineseFestivalEntries(d) : [];
    const international = showHolidays && chinese.length === 0 ? getInternationalFestivalEntries(d) : [];
    const lunar = showLunar ? getLunarInfo(d).label : '';

    let subLabel = '';
    let subType: CalendarSelectInfo['subType'] = '';
    let subColor: string | undefined;

    if (chinese.length > 0) {
      subLabel = chinese.map((e) => e.name).filter(Boolean).join(' / ');
      subType = 'cn';
      subColor = chinese.find((e) => e.color)?.color;
    } else if (international.length > 0) {
      subLabel = international.map((e) => e.name).filter(Boolean).join(' / ');
      subType = 'intl';
      subColor = international.find((e) => e.color)?.color;
    } else if (lunar) {
      subLabel = lunar;
      subType = 'lunar';
    }

    return {
      chinese,
      international,
      lunar,
      subLabel,
      subType,
      subColor,
    };
  };

  const handlePick = (d: Date) => {
    if (isDateDisabled(d)) return;
    setValue(d);

    const k = toDateKey(d);
    const inMonth = d.getMonth() === panelMonth.getMonth();
    const isToday = isSameDay(today, d);
    const subInfo = getSubInfo(d);
    const markMeta = marksMetaMap.get(k);
    const info: CalendarSelectInfo = {
      date: d,
      dateKey: k,
      inMonth,
      isToday,
      disabled: false,
      marks: markMeta?.allColors || [],
      holidays: [...subInfo.chinese, ...subInfo.international],
      holidayLabel: subInfo.subLabel,
      chineseFestivals: subInfo.chinese,
      internationalFestivals: subInfo.international,
      lunarLabel: subInfo.lunar,
      subLabel: subInfo.subLabel,
      subType: subInfo.subType,
    };
    props.onSelect?.(info);
  };

  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    start: Date | null;
    end: Date | null;
    moved: boolean;
  }>({ active: false, pointerId: null, start: null, end: null, moved: false });

  const [dragRange, setDragRange] = useState<{ startKey: number; endKey: number } | null>(null);

  const getDateFromPointer = (e: PointerEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!el) return null;
    const dayEl = el.closest?.('.wyx-ui_calendar__day[data-datekey]') as HTMLElement | null;
    if (!dayEl) return null;
    const keyStr = dayEl.getAttribute('data-datekey');
    if (!keyStr) return null;
    const key = Number(keyStr);
    if (!Number.isFinite(key)) return null;
    return daysByKey.get(key) || null;
  };

  const finalizeDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    dragRef.current.pointerId = null;

    const start = dragRef.current.start;
    const end = dragRef.current.end;
    const moved = dragRef.current.moved;
    dragRef.current.start = null;
    dragRef.current.end = null;
    dragRef.current.moved = false;
    setDragRange(null);

    if (!markable || !dragToMark) return;
    if (!start || !end) return;

    const from = toLocalDateOnly(start);
    const to = toLocalDateOnly(end);
    if (!moved || isSameDay(from, to)) {
      handlePick(from);
      applyMarkBehavior(from);
      return;
    }
    const dir = from.getTime() <= to.getTime() ? 1 : -1;

    const existingKeys = new Set<number>();
    marksList.forEach((m) => {
      const md = parseDateInput(m.date);
      if (!md) return;
      if (m.variant !== 'range') return;
      existingKeys.add(toDateKey(md));
    });

    const nextMarks = [...marksList];
    const addedDates: Date[] = [];
    let cur = from;
    while (true) {
      if (!isDateDisabled(cur)) {
        const k = toDateKey(cur);
        if (!existingKeys.has(k)) {
          existingKeys.add(k);
          nextMarks.push({ date: cur, color: markColor, variant: 'range' });
          addedDates.push(cur);
        }
      }
      if (isSameDay(cur, to)) break;
      cur = addDays(cur, dir);
    }

    if (nextMarks.length !== marksList.length) {
      setMarks(nextMarks);
      if (addedDates.length > 0) onMark?.({ variant: 'range', dates: addedDates });
    }
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      if (dragRef.current.pointerId !== null && e.pointerId !== dragRef.current.pointerId) return;
      const d = getDateFromPointer(e);
      if (!d) return;
      dragRef.current.end = d;
      setDragRange(() => {
        const start = dragRef.current.start || d;
        const startKey = toDateKey(start);
        const endKey = toDateKey(d);
        if (startKey === endKey) return null;
        dragRef.current.moved = true;
        return { startKey, endKey };
      });
    };

    const onUp = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      if (dragRef.current.pointerId !== null && e.pointerId !== dragRef.current.pointerId) return;
      finalizeDrag();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [marksList, markable, dragToMark, markColor, minKey, maxKey, disabledDate, daysByKey]);

  const rootClassName = ['wyx-ui_calendar', className || ''].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} style={style}>
      <div className="wyx-ui_calendar__header">
        <button type="button" className="wyx-ui_calendar__nav-btn" onClick={() => setMonth(addMonths(panelMonth, -1))}>
          <Chevron dir="left" />
        </button>
        <div className="wyx-ui_calendar__month" aria-live="polite">
          {monthLabel}
        </div>
        <button type="button" className="wyx-ui_calendar__nav-btn" onClick={() => setMonth(addMonths(panelMonth, 1))}>
          <Chevron dir="right" />
        </button>
      </div>

      <div className="wyx-ui_calendar__week">
        {normalizedWeekLabels.map((w) => (
          <div key={w} className="wyx-ui_calendar__week-item">
            {w}
          </div>
        ))}
      </div>

      <div
        key={monthLabel}
        className={[
          'wyx-ui_calendar__grid',
          monthAnim === 'next' ? 'is-next' : 'is-prev',
        ].join(' ')}
      >
        {days.map((d, idx) => {
          const k = toDateKey(d);
          const inMonth = d.getMonth() === panelMonth.getMonth();
          const disabled = isDateDisabled(d);
          const isSelected = !!selected && isSameDay(selected, d);
          const isToday = isSameDay(today, d);
          const markMeta = marksMetaMap.get(k);
          const allMarkColors = markMeta?.allColors || [];
          const singleMarkColors = markMeta?.singleColors || [];
          const singleMarkContents = markMeta?.singleContents || [];
          const hasRangeMark = !!markMeta?.hasRange;
          const showTodayMark = showToday && isToday;
          const subInfo = getSubInfo(d);
          const subLabel = subInfo.subLabel;
          const cellHidden = !showOutsideDays && !inMonth;
          const dragMinKey = dragRange ? Math.min(dragRange.startKey, dragRange.endKey) : null;
          const dragMaxKey = dragRange ? Math.max(dragRange.startKey, dragRange.endKey) : null;
          const inDragRange = dragMinKey !== null && dragMaxKey !== null && k >= dragMinKey && k <= dragMaxKey;
          const hasSingleMark = singleMarkColors.length > 0;
          const singleMarkContent =
            singleMarkColors.length === 1 && singleMarkContents.length === 1 ? singleMarkContents[0] : null;
          const showRangeBg = hasRangeMark || inDragRange;
          const rangeMain = markMeta?.rangeColor || markColor;
          const markKind: CalendarMarkVariant | '' = showRangeBg ? 'range' : hasSingleMark ? 'single' : '';

          const needsInner = showTodayMark || isSelected || showRangeBg || hasSingleMark || !!subLabel;
          const markInfo: CalendarMarkRenderInfo = {
            date: d,
            dateKey: k,
            inMonth,
            isToday,
            isSelected,
            disabled,
            marks: allMarkColors,
            markKind,
            hasSingleMark,
            hasRangeMark,
            isDragRange: inDragRange,
          };

          if (cellHidden) {
            return <div key={k} className="wyx-ui_calendar__day is-hidden" />;
          }

          const prevKey = toDateKey(addDays(d, -1));
          const nextKey = toDateKey(addDays(d, 1));
          const col = idx % 7;
          const rangePrev = hasRangeMark && col !== 0 && rangeKeySet.has(prevKey);
          const rangeNext = hasRangeMark && col !== 6 && rangeKeySet.has(nextKey);
          const inDragPrev =
            inDragRange && col !== 0 && dragMinKey !== null && dragMaxKey !== null && prevKey >= dragMinKey && prevKey <= dragMaxKey;
          const inDragNext =
            inDragRange && col !== 6 && dragMinKey !== null && dragMaxKey !== null && nextKey >= dragMinKey && nextKey <= dragMaxKey;

          return (
            <div
              key={k}
              className={[
                'wyx-ui_calendar__day',
                inMonth ? '' : 'is-outside',
                disabled ? 'is-disabled' : '',
                isSelected ? 'is-selected' : '',
                showTodayMark ? 'is-today' : '',
                hasSingleMark ? 'is-single' : '',
                hasRangeMark ? 'is-range' : '',
                rangePrev ? 'is-range-prev' : '',
                rangeNext ? 'is-range-next' : '',
                inDragRange ? 'is-drag' : '',
                inDragRange && inDragPrev ? 'is-drag-prev' : '',
                inDragRange && inDragNext ? 'is-drag-next' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                showRangeBg
                  ? ({ '--wyx-ui-calendar-mark-color': rangeMain } as React.CSSProperties)
                  : undefined
              }
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled || undefined}
              aria-pressed={isSelected || undefined}
              data-datekey={k}
              onPointerDown={(e) => {
                if (!markable || !dragToMark) return;
                if (disabled) return;
                dragRef.current.active = true;
                dragRef.current.pointerId = e.pointerId;
                dragRef.current.start = d;
                dragRef.current.end = d;
                dragRef.current.moved = false;
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerUp={(e) => {
                if (!dragRef.current.active) return;
                if (dragRef.current.pointerId !== null && e.pointerId !== dragRef.current.pointerId) return;
                finalizeDrag();
              }}
              onPointerCancel={(e) => {
                if (!dragRef.current.active) return;
                if (dragRef.current.pointerId !== null && e.pointerId !== dragRef.current.pointerId) return;
                finalizeDrag();
              }}
              onClick={() => {
                if (disabled) return;
                if (markable && dragToMark) return;
                handlePick(d);
                if (markable && !dragToMark) applyMarkBehavior(d);
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePick(d);
                  if (markable) applyMarkBehavior(d);
                }
              }}
              onMouseMove={(e) => {
                const el = e.currentTarget;
                const rect = el.getBoundingClientRect();
                el.style.setProperty('--x', `${e.clientX - rect.left}px`);
                el.style.setProperty('--y', `${e.clientY - rect.top}px`);
              }}
            >
              {showRangeBg && <span className="wyx-ui_calendar__mark-bg" aria-hidden="true" />}
              {needsInner ? (
                <span className="wyx-ui_calendar__day-inner">
                  <span className="wyx-ui_calendar__day-num">{d.getDate()}</span>
                  {subLabel && (
                    <span
                      className={['wyx-ui_calendar__sub', subInfo.subType ? `is-${subInfo.subType}` : ''].filter(Boolean).join(' ')}
                      style={subInfo.subColor ? ({ '--wyx-ui-calendar-sub-color': subInfo.subColor } as React.CSSProperties) : undefined}
                    >
                      {subLabel}
                    </span>
                  )}
                  {hasSingleMark && (
                    <span className="wyx-ui_calendar__mark-slot" aria-hidden="true">
                      {renderMark ? (
                        renderMark(markInfo)
                      ) : singleMarkContent ? (
                        singleMarkContent
                      ) : (
                        <span className="wyx-ui_calendar__mark-default">
                          <span className="wyx-ui_calendar__mark-badge" style={{ background: singleMarkColors[0] }} />
                          <span className="wyx-ui_calendar__dots">
                            {singleMarkColors.slice(0, 6).map((c, dotIdx) => (
                              <span key={`${k}-${dotIdx}`} className="wyx-ui_calendar__dot" style={{ background: c }} />
                            ))}
                          </span>
                        </span>
                      )}
                    </span>
                  )}
                </span>
              ) : (
                <span className="wyx-ui_calendar__day-num">{d.getDate()}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default Calendar;
