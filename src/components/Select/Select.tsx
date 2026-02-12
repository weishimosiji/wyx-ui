import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ArrowBtn from '../AnimateBtns/ArrowBtn/ArrowBtn';
import './index.scss';

export type SelectValue = string | number;

export interface SelectOption {
  label: React.ReactNode;
  value: SelectValue;
  disabled?: boolean;
  description?: React.ReactNode;
  prefix?: React.ReactNode;
}

export type SelectOptionInput = SelectOption | SelectValue | (Omit<SelectOption, 'label'> & { label?: React.ReactNode });

export interface SelectProps {
  options: SelectOptionInput[];
  value?: SelectValue;
  defaultValue?: SelectValue;
  onChange?: (value: SelectValue | undefined, option: SelectOption | undefined) => void;
  placeholder?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterOption?: (input: string, option: SelectOption) => boolean;
  renderOption?: (
    option: SelectOption,
    info: { selected: boolean; active: boolean; index: number; search: string }
  ) => React.ReactNode;
  renderValue?: (value: SelectValue | undefined, option: SelectOption | undefined) => React.ReactNode;
  allowClear?: boolean;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

function isPrintableKey(key: string) {
  if (key.length !== 1) return false;
  return key >= ' ' && key <= '~';
}

function normalizeOption(input: SelectOptionInput): SelectOption {
  if (typeof input === 'string' || typeof input === 'number') {
    return { value: input, label: String(input) };
  }
  const label = input.label ?? String(input.value);
  return { ...input, label };
}

function getOptionText(option: SelectOption) {
  if (typeof option.label === 'string' || typeof option.label === 'number') return String(option.label);
  return '';
}

export default function Select({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  placeholder = 'Select',
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  filterOption,
  renderOption,
  renderValue,
  allowClear = false,
  width,
  className,
  style,
}: SelectProps) {
  const id = useId();
  const isControlled = valueProp !== undefined;
  const [innerValue, setInnerValue] = useState<SelectValue | undefined>(defaultValue);
  const value = isControlled ? valueProp : innerValue;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [search, setSearch] = useState('');
  const [pulsing, setPulsing] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
    origin: 'top center' | 'bottom center';
  }>({ left: 0, top: 0, width: 0, origin: 'top center' });

  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);

  const selected = useMemo(() => {
    if (value === undefined) return undefined;
    return normalizedOptions.find((o) => o.value === value);
  }, [normalizedOptions, value]);

  const normalizedFilter = useMemo(() => {
    if (filterOption) return filterOption;
    return (input: string, option: SelectOption) => {
      const t = getOptionText(option);
      return t.toLowerCase().includes(input.trim().toLowerCase());
    };
  }, [filterOption]);

  const filteredOptions = useMemo(() => {
    if (!searchable) return normalizedOptions;
    const input = search.trim();
    if (!input) return normalizedOptions;
    return normalizedOptions.filter((o) => normalizedFilter(input, o));
  }, [normalizedFilter, normalizedOptions, search, searchable]);

  const selectedIndexInFiltered = useMemo(() => {
    if (value === undefined) return -1;
    return filteredOptions.findIndex(o => o.value === value);
  }, [filteredOptions, value]);

  const canClear = allowClear && !disabled && value !== undefined;

  const setValue = (next: SelectValue | undefined) => {
    if (!isControlled) setInnerValue(next);
    const opt = next === undefined ? undefined : normalizedOptions.find((o) => o.value === next);
    onChange?.(next, opt);
  };

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    setSearch('');
  };

  const commit = (opt: SelectOption | undefined) => {
    if (!opt || opt.disabled) return;
    setValue(opt.value);
    setPulsing(true);
    closeMenu();
  };

  const findFirstEnabledIndex = (list: SelectOption[]) => {
    for (let i = 0; i < list.length; i++) {
      if (!list[i].disabled) return i;
    }
    return -1;
  };

  const findLastEnabledIndex = (list: SelectOption[]) => {
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].disabled) return i;
    }
    return -1;
  };

  const moveActive = (dir: 1 | -1) => {
    if (!filteredOptions.length) return;
    let idx = activeIndex;
    if (idx < 0) idx = dir === 1 ? -1 : filteredOptions.length;
    for (let step = 0; step < filteredOptions.length; step++) {
      idx += dir;
      if (idx < 0) idx = filteredOptions.length - 1;
      if (idx >= filteredOptions.length) idx = 0;
      const opt = filteredOptions[idx];
      if (!opt.disabled) {
        setActiveIndex(idx);
        optionRefs.current[idx]?.focus();
        return;
      }
    }
  };

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const updateDropdownPosition = () => {
    if (!open) return;
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const drop = dropdownRef.current;

    const gap = 8;
    const pad = 8;
    const width = rect.width;

    const outOfView =
      rect.bottom < -pad ||
      rect.top > window.innerHeight + pad ||
      rect.right < -pad ||
      rect.left > window.innerWidth + pad;
    if (outOfView) {
      closeMenu();
      return;
    }

    let left = rect.left;
    left = clamp(left, pad, Math.max(pad, window.innerWidth - pad - width));

    let origin: 'top center' | 'bottom center' = 'top center';
    let top = rect.bottom + gap;

    const dropH = drop ? drop.offsetHeight : 0;
    const canTop = rect.top - gap - dropH >= pad;
    const overBottom = rect.bottom + gap + dropH > window.innerHeight - pad;

    if (dropH > 0 && overBottom && canTop) {
      origin = 'bottom center';
      top = rect.top - gap - dropH;
    } else if (dropH > 0) {
      top = clamp(top, pad, Math.max(pad, window.innerHeight - pad - dropH));
    }

    setDropdownPos({ left, top, width, origin });
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node | null;
      const root = rootRef.current;
      const drop = dropdownRef.current;
      if (!t || !root) return;
      if (root.contains(t)) return;
      if (drop && drop.contains(t)) return;
      closeMenu();
    };
    document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  }, [open]);

  useEffect(() => {
    if (!pulsing) return;
    const t = window.setTimeout(() => setPulsing(false), 380);
    return () => window.clearTimeout(t);
  }, [pulsing]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const raf1 = window.requestAnimationFrame(() => {
      updateDropdownPosition();
      window.requestAnimationFrame(() => updateDropdownPosition());
    });

    const onAnyScroll = () => updateDropdownPosition();
    const onResize = () => updateDropdownPosition();
    window.addEventListener('scroll', onAnyScroll, true);
    window.addEventListener('resize', onResize);

    const ro =
      typeof window !== 'undefined' && 'ResizeObserver' in window ? new ResizeObserver(() => updateDropdownPosition()) : null;
    if (ro) {
      if (triggerRef.current) ro.observe(triggerRef.current);
      if (dropdownRef.current) ro.observe(dropdownRef.current);
    }

    return () => {
      window.cancelAnimationFrame(raf1);
      window.removeEventListener('scroll', onAnyScroll, true);
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
  }, [open, search, filteredOptions.length]);

  useEffect(() => {
    if (!open) return;
    const idx = selectedIndexInFiltered >= 0 ? selectedIndexInFiltered : findFirstEnabledIndex(filteredOptions);
    setActiveIndex(idx);
    const t = window.setTimeout(() => {
      if (searchable) {
        searchRef.current?.focus();
      } else {
        if (idx >= 0) optionRefs.current[idx]?.focus();
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [filteredOptions, open, searchable, selectedIndexInFiltered]);

  const triggerNode = useMemo(() => {
    const fallback = selected?.label ?? placeholder;
    if (!renderValue) return fallback;
    const node = renderValue(value, selected);
    return node ?? fallback;
  }, [placeholder, renderValue, selected, value]);

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(v => !v);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openMenu();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      openMenu();
      const last = findLastEnabledIndex(filteredOptions);
      setActiveIndex(last);
      return;
    }
    if (isPrintableKey(e.key)) {
      openMenu();
      if (searchable) {
        setSearch(e.key);
        e.preventDefault();
      }
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveActive(1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      commit(opt);
    }
  };

  const rootStyle = useMemo(() => {
    const w = typeof width === 'number' ? `${width}px` : width;
    return { ...style, ...(w ? { width: w } : {}) } as React.CSSProperties;
  }, [style, width]);

  const listboxId = `wyx-ui_select_listbox_${id}`;

  const dropdownNode = (
    <div
      ref={dropdownRef}
      id={listboxId}
      className={`wyx-ui_select-dropdown ${open ? 'is-open' : ''}`}
      role="listbox"
      aria-hidden={!open}
      style={{
        left: dropdownPos.left,
        top: dropdownPos.top,
        width: dropdownPos.width,
        ['--wyx-ui_select-origin' as any]: dropdownPos.origin,
      }}
    >
      {searchable && (
        <div className="wyx-ui_select-search">
          <input
            ref={searchRef}
            className="wyx-ui_select-search-input"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKeyDown}
          />
        </div>
      )}

      <div className="wyx-ui_select-options">
        {filteredOptions.length === 0 ? (
          <div className="wyx-ui_select-empty">No options</div>
        ) : (
          filteredOptions.map((opt, i) => {
            const isSelected = value !== undefined && opt.value === value;
            const isActive = i === activeIndex;
            const isSimple =
              !renderOption &&
              !opt.prefix &&
              !opt.description &&
              (typeof opt.label === 'string' || typeof opt.label === 'number');
            return (
              <button
                key={String(opt.value)}
                type="button"
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                className={[
                  'wyx-ui_select-option',
                  isSimple ? 'is-simple' : '',
                  isSelected ? 'is-selected' : '',
                  isActive ? 'is-active' : '',
                  opt.disabled ? 'is-disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                role="option"
                aria-selected={isSelected}
                disabled={opt.disabled}
                tabIndex={open ? (isActive ? 0 : -1) : -1}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(opt)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    moveActive(1);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    moveActive(-1);
                    return;
                  }
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    commit(opt);
                  }
                }}
              >
                {renderOption ? (
                  renderOption(opt, { selected: isSelected, active: isActive, index: i, search })
                ) : (
                  <>
                    {opt.prefix && <span className="wyx-ui_select-option-prefix">{opt.prefix}</span>}
                    {isSimple ? (
                      <span className="wyx-ui_select-option-label is-simple">{opt.label}</span>
                    ) : (
                      <span className="wyx-ui_select-option-main">
                        <span className="wyx-ui_select-option-label">{opt.label}</span>
                        {opt.description && <span className="wyx-ui_select-option-desc">{opt.description}</span>}
                      </span>
                    )}
                    <span className="wyx-ui_select-option-check" aria-hidden="true" />
                  </>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={rootRef}
        className={[
          'wyx-ui_select',
          open ? 'is-open' : '',
          disabled ? 'is-disabled' : '',
          selected ? 'has-value' : '',
          className || '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={rootStyle}
      >
        <button
          ref={triggerRef}
          type="button"
          className={`wyx-ui_select-trigger ${pulsing ? 'is-pulsing' : ''}`}
          onClick={() => (open ? closeMenu() : openMenu())}
          onKeyDown={onTriggerKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
        >
          <span className="wyx-ui_select-value">{triggerNode}</span>
          <span className="wyx-ui_select-actions" aria-hidden="true">
            {canClear && (
              <span
                className="wyx-ui_select-clear"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setValue(undefined);
                  setPulsing(true);
                }}
              >
                ×
              </span>
            )}
          <ArrowBtn as="span" width={18} height={18} direction={open ? 'top' : 'bottom'} />
          </span>
        </button>
      </div>

      {typeof document !== 'undefined' ? createPortal(dropdownNode, document.body) : null}
    </>
  );
}
