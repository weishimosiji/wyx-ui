import React, { createContext, useContext, useId, useMemo, useState } from 'react';
import './index.scss';

export type RadioValue = string | number;

export type RadioSize = 'sm' | 'md' | 'lg';
export type RadioVariant = 'default' | 'card';
export type RadioDirection = 'horizontal' | 'vertical';

export interface RadioOption {
  value: RadioValue;
  label: React.ReactNode;
  disabled?: boolean;
  description?: React.ReactNode;
  prefix?: React.ReactNode;
}

export type RadioOptionInput = RadioOption | RadioValue | (Omit<RadioOption, 'label'> & { label?: React.ReactNode });

function normalizeOption(input: RadioOptionInput): RadioOption {
  if (typeof input === 'string' || typeof input === 'number') {
    return { value: input, label: String(input) };
  }
  const label = input.label ?? String(input.value);
  return { ...input, label };
}

interface RadioGroupContextValue {
  name: string;
  value: RadioValue | undefined;
  disabled: boolean;
  allowDeselect: boolean;
  size: RadioSize;
  variant: RadioVariant;
  setValue: (next: RadioValue) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  value?: RadioValue;
  defaultValue?: RadioValue;
  onChange?: (value: RadioValue | undefined, option: RadioOption | undefined) => void;
  options?: RadioOptionInput[];
  renderOption?: (option: RadioOption, info: { checked: boolean; disabled: boolean; index: number }) => React.ReactNode;
  name?: string;
  disabled?: boolean;
  allowDeselect?: boolean;
  direction?: RadioDirection;
  size?: RadioSize;
  variant?: RadioVariant;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function RadioGroup(props: RadioGroupProps) {
  const {
    value: valueProp,
    defaultValue,
    onChange,
    options,
    renderOption,
    name,
    disabled = false,
    allowDeselect = false,
    direction = 'vertical',
    size = 'md',
    variant = 'default',
    className,
    style,
    children,
  } = props;
  const id = useId();
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value');
  const [inner, setInner] = useState<RadioValue | undefined>(defaultValue);
  const value = isControlled ? valueProp : inner;

  const normalizedOptions = useMemo(() => (options ? options.map(normalizeOption) : undefined), [options]);

  const setValue = (next: RadioValue) => {
    const nextValue = allowDeselect && value === next ? undefined : next;
    if (!isControlled) setInner(nextValue);
    const opt = nextValue === undefined ? undefined : normalizedOptions?.find((o) => o.value === nextValue);
    onChange?.(nextValue, opt);
  };

  const ctx = useMemo<RadioGroupContextValue>(
    () => ({
      name: name ?? `wyx-radio-group-${id}`,
      value,
      disabled,
      allowDeselect,
      size,
      variant,
      setValue,
    }),
    [allowDeselect, disabled, id, name, size, value, variant]
  );

  const groupClassName = [
    'wyx-radio-group',
    `is-${direction}`,
    `is-${variant}`,
    `is-${size}`,
    disabled ? 'is-disabled' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <RadioGroupContext.Provider value={ctx}>
      <div className={groupClassName} role="radiogroup" style={style}>
        {normalizedOptions
          ? normalizedOptions.map((opt, index) => {
              const info = {
                checked: value === opt.value,
                disabled: disabled || !!opt.disabled,
                index,
              };
              const rendered = renderOption?.(opt, info);

              return (
                <Radio
                  key={String(opt.value)}
                  value={opt.value}
                  disabled={opt.disabled}
                  description={rendered ? undefined : opt.description}
                  prefix={rendered ? undefined : opt.prefix}
                  renderContent={rendered ? () => rendered : undefined}
                >
                  {rendered ? undefined : opt.label}
                </Radio>
              );
            })
          : children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps {
  value: RadioValue;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, value: RadioValue) => void;
  disabled?: boolean;
  allowDeselect?: boolean;
  name?: string;
  size?: RadioSize;
  variant?: RadioVariant;
  prefix?: React.ReactNode;
  description?: React.ReactNode;
  renderContent?: (info: { checked: boolean; disabled: boolean; value: RadioValue }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function RadioComponent({
  value,
  checked: checkedProp,
  defaultChecked,
  onChange,
  disabled: disabledProp = false,
  allowDeselect: allowDeselectProp = false,
  name,
  size: sizeProp,
  variant: variantProp,
  prefix,
  description,
  renderContent,
  className,
  style,
  children,
}: RadioProps) {
  const group = useContext(RadioGroupContext);
  const isInGroup = !!group;
  const isControlled = checkedProp !== undefined;
  const [innerChecked, setInnerChecked] = useState(!!defaultChecked);

  const disabled = disabledProp || group?.disabled || false;
  const allowDeselect = allowDeselectProp || group?.allowDeselect || false;
  const size = sizeProp ?? group?.size ?? 'md';
  const variant = variantProp ?? group?.variant ?? 'default';
  const checked = isInGroup ? group!.value === value : isControlled ? !!checkedProp : innerChecked;

  const inputName = name ?? group?.name;
  const customContent = renderContent?.({ checked, disabled, value });

  const setChecked = (next: boolean) => {
    if (!isInGroup) {
      if (!isControlled) setInnerChecked(next);
      onChange?.(next, value);
      return;
    }
    if (!next) return;
    group!.setValue(value);
    onChange?.(true, value);
  };

  const rootClassName = [
    'wyx-radio',
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
        className="wyx-radio__input"
        type="radio"
        name={inputName}
        value={String(value)}
        checked={checked}
        disabled={disabled}
        onClick={(e) => {
          if (disabled) return;
          if (!allowDeselect) return;
          if (!checked) return;
          e.preventDefault();
          if (!isInGroup) {
            if (!isControlled) setInnerChecked(false);
            onChange?.(false, value);
            return;
          }
          group!.setValue(value);
          onChange?.(false, value);
        }}
        onChange={(e) => setChecked(e.target.checked)}
      />
      <span className="wyx-radio__control" aria-hidden="true" />
      {customContent ? (
        <span className="wyx-radio__content">{customContent}</span>
      ) : (prefix || children || description) ? (
        <span className="wyx-radio__content">
          {prefix && <span className="wyx-radio__prefix">{prefix}</span>}
          <span className="wyx-radio__text">
            {children && <span className="wyx-radio__label">{children}</span>}
            {description && <span className="wyx-radio__desc">{description}</span>}
          </span>
        </span>
      ) : null}
    </label>
  );
}

const Radio = Object.assign(RadioComponent, { Group: RadioGroup });

export default Radio;
