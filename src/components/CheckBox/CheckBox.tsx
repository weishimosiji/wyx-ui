import React, { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import './index.scss';

export type CheckBoxValue = string | number;

export type CheckBoxSize = 'sm' | 'md' | 'lg';
export type CheckBoxVariant = 'default' | 'card';
export type CheckBoxDirection = 'horizontal' | 'vertical';

export interface CheckBoxOption {
  value: CheckBoxValue;
  label: React.ReactNode;
  disabled?: boolean;
  description?: React.ReactNode;
  prefix?: React.ReactNode;
}

export type CheckBoxOptionInput =
  | CheckBoxOption
  | CheckBoxValue
  | (Omit<CheckBoxOption, 'label'> & { label?: React.ReactNode });

function normalizeOption(input: CheckBoxOptionInput): CheckBoxOption {
  if (typeof input === 'string' || typeof input === 'number') {
    return { value: input, label: String(input) };
  }
  const label = input.label ?? String(input.value);
  return { ...input, label };
}

interface CheckBoxGroupContextValue {
  name: string;
  values: CheckBoxValue[];
  disabled: boolean;
  size: CheckBoxSize;
  variant: CheckBoxVariant;
  setChecked: (value: CheckBoxValue, checked: boolean) => void;
}

const CheckBoxGroupContext = createContext<CheckBoxGroupContextValue | null>(null);

export interface CheckBoxGroupProps {
  value?: CheckBoxValue[];
  defaultValue?: CheckBoxValue[];
  onChange?: (value: CheckBoxValue[], options: CheckBoxOption[]) => void;
  options?: CheckBoxOptionInput[];
  renderOption?: (option: CheckBoxOption, info: { checked: boolean; disabled: boolean; index: number }) => React.ReactNode;
  name?: string;
  disabled?: boolean;
  direction?: CheckBoxDirection;
  size?: CheckBoxSize;
  variant?: CheckBoxVariant;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function CheckBoxGroup(props: CheckBoxGroupProps) {
  const {
    value: valueProp,
    defaultValue,
    onChange,
    options,
    renderOption,
    name,
    disabled = false,
    direction = 'vertical',
    size = 'md',
    variant = 'default',
    className,
    style,
    children,
  } = props;

  const id = useId();
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');
  const [inner, setInner] = useState<CheckBoxValue[]>(defaultValue ?? []);
  const values = isControlled ? (valueProp ?? []) : inner;

  const normalizedOptions = useMemo(() => (options ? options.map(normalizeOption) : undefined), [options]);

  const setChecked = (v: CheckBoxValue, nextChecked: boolean) => {
    const next = nextChecked ? Array.from(new Set([...values, v])) : values.filter((x) => x !== v);
    if (!isControlled) setInner(next);
    const selectedOptions = normalizedOptions ? normalizedOptions.filter((o) => next.includes(o.value)) : [];
    onChange?.(next, selectedOptions);
  };

  const ctx = useMemo<CheckBoxGroupContextValue>(
    () => ({
      name: name ?? `wyx-checkbox-group-${id}`,
      values,
      disabled,
      size,
      variant,
      setChecked,
    }),
    [disabled, id, name, size, values, variant]
  );

  const groupClassName = [
    'wyx-checkbox-group',
    `is-${direction}`,
    `is-${variant}`,
    `is-${size}`,
    disabled ? 'is-disabled' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CheckBoxGroupContext.Provider value={ctx}>
      <div className={groupClassName} role="group" style={style}>
        {normalizedOptions
          ? normalizedOptions.map((opt, index) => {
              const info = {
                checked: values.includes(opt.value),
                disabled: disabled || !!opt.disabled,
                index,
              };
              const rendered = renderOption?.(opt, info);

              return (
                <CheckBox
                  key={String(opt.value)}
                  value={opt.value}
                  disabled={opt.disabled}
                  description={rendered ? undefined : opt.description}
                  prefix={rendered ? undefined : opt.prefix}
                  renderContent={rendered ? () => rendered : undefined}
                >
                  {rendered ? undefined : opt.label}
                </CheckBox>
              );
            })
          : children}
      </div>
    </CheckBoxGroupContext.Provider>
  );
}

export interface CheckBoxProps {
  value?: CheckBoxValue;
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean, value: CheckBoxValue | undefined) => void;
  disabled?: boolean;
  name?: string;
  size?: CheckBoxSize;
  variant?: CheckBoxVariant;
  prefix?: React.ReactNode;
  description?: React.ReactNode;
  renderContent?: (info: { checked: boolean; disabled: boolean; value: CheckBoxValue | undefined }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function CheckBoxComponent({
  value,
  checked: checkedProp,
  defaultChecked,
  indeterminate,
  onChange,
  disabled: disabledProp = false,
  name,
  size: sizeProp,
  variant: variantProp,
  prefix,
  description,
  renderContent,
  className,
  style,
  children,
}: CheckBoxProps) {
  const group = useContext(CheckBoxGroupContext);
  const isInGroup = !!group;
  const isControlled = checkedProp !== undefined;
  const [innerChecked, setInnerChecked] = useState(!!defaultChecked);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const disabled = disabledProp || group?.disabled || false;
  const size = sizeProp ?? group?.size ?? 'md';
  const variant = variantProp ?? group?.variant ?? 'default';

  const checked = isInGroup
    ? value !== undefined && group!.values.includes(value)
    : isControlled
      ? !!checkedProp
      : innerChecked;

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.indeterminate = !!indeterminate && !checked;
  }, [checked, indeterminate]);

  const inputName = name ?? group?.name;
  const customContent = renderContent?.({ checked, disabled, value });

  const setChecked = (next: boolean) => {
    if (!isInGroup) {
      if (!isControlled) setInnerChecked(next);
      onChange?.(next, value);
      return;
    }
    if (value === undefined) return;
    group!.setChecked(value, next);
    onChange?.(next, value);
  };

  const rootClassName = [
    'wyx-checkbox',
    `is-${variant}`,
    `is-${size}`,
    checked ? 'is-checked' : '',
    disabled ? 'is-disabled' : '',
    description ? 'has-desc' : '',
    prefix ? 'has-prefix' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={rootClassName} style={style}>
      <input
        ref={inputRef}
        className="wyx-checkbox__input"
        type="checkbox"
        name={inputName}
        value={value === undefined ? undefined : String(value)}
        checked={checked}
        disabled={disabled}
        onChange={(e) => setChecked(e.target.checked)}
      />
      <span className="wyx-checkbox__control" aria-hidden="true" />
      {customContent ? (
        <span className="wyx-checkbox__content">{customContent}</span>
      ) : (prefix || children || description) ? (
        <span className="wyx-checkbox__content">
          {prefix && <span className="wyx-checkbox__prefix">{prefix}</span>}
          <span className="wyx-checkbox__text">
            {children && <span className="wyx-checkbox__label">{children}</span>}
            {description && <span className="wyx-checkbox__desc">{description}</span>}
          </span>
        </span>
      ) : null}
    </label>
  );
}

const CheckBox = Object.assign(CheckBoxComponent, { Group: CheckBoxGroup });

export default CheckBox;

