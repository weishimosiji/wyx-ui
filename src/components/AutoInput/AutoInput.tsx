import React from "react";
import './index.scss';

export interface AutoInputProps {
  placeholder?: string;
  minWidth?: number | string;
  className?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  showCount?: boolean;
  defaultValue?: string;
  disabled?: boolean;
  maxLength?: number;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onInput?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AutoInput({ children, ...props }: React.PropsWithChildren<AutoInputProps>) {
  const [value, setValue] = React.useState(props.defaultValue || '');
  
  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    setValue(input.value);
    props.onInput?.(event);
  }
  
  return (
    <div
      className={`wyx-auto-input_container ${props.className || ''}`}
      style={{ minWidth: typeof props.minWidth === 'number' ? `${props.minWidth}px` : props.minWidth || '180px' }}
    >
      {props.prefix && <div className="wyx-auto_prefix">{props.prefix}</div>}
      <div
        className="wyx-auto-input">
          <input
            onFocus={props.onFocus}
            onBlur={props.onBlur}
            onInput={handleInput}
            value={value}
            maxLength={props.maxLength}
            placeholder={props.placeholder || ''}
          />
        
        <div className="wyx-auto_content-fill">{value}</div>
      </div>
      {props.suffix && <div className="wyx-auto_suffix">{props.suffix}</div>}
      {props.showCount && (
        <div className="wyx-auto_count">
          {value.length}/{props.maxLength || ''}
        </div>
      )}
    </div>
  );
}
