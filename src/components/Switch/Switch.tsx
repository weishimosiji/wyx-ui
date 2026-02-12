import React, { useEffect, useMemo, useState } from 'react';
import './index.scss';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  checkedColor?: string;
  unCheckedColor?: string;
}

const Switch: React.FC<SwitchProps> = ({
  checked: propsChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  loading = false,
  size = 'medium',
  checkedChildren,
  unCheckedChildren,
  className = '',
  style,
  checkedColor,
  unCheckedColor,
}) => {
  const [checked, setChecked] = useState<boolean>(propsChecked ?? defaultChecked);

  useEffect(() => {
    if (propsChecked !== undefined) {
      setChecked(propsChecked);
    }
  }, [propsChecked]);

  const isDisabled = disabled || loading;

  const handleToggle = () => {
    if (disabled || loading) return;
    const newChecked = !checked;
    if (propsChecked === undefined) {
      setChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  const customStyle = {
    ...style,
    ...(checked && checkedColor ? { '--switch-checked-color': checkedColor } : {}),
    ...(!checked && unCheckedColor ? { '--switch-unchecked-color': unCheckedColor } : {}),
  } as React.CSSProperties;

  const switchClassName = useMemo(() => {
    const cls: string[] = ['wyx-switch', `wyx-switch-${size}`];
    if (checked) cls.push('wyx-switch-checked');
    if (loading) cls.push('wyx-switch-loading');
    if (disabled) cls.push('wyx-switch-disabled');
    if (className) cls.push(className);
    return cls.join(' ');
  }, [checked, className, disabled, loading, size]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={isDisabled}
      disabled={disabled}
      className={switchClassName}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      style={customStyle}
    >
      <div className="wyx-switch-handle">
        {loading && <span className="wyx-switch-loading-icon" />}
      </div>
      <span className="wyx-switch-inner">
        {checked ? checkedChildren : unCheckedChildren}
      </span>
      <div className="wyx-switch-wave" />
    </button>
  );
};

export default Switch;
