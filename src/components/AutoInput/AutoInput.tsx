import React from "react";
import './index.scss';

export interface AutoInputProps {
  placeholder?: React.ReactNode;
  floatLabel?: boolean;
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
  const [focused, setFocused] = React.useState(false);
  const inputId = React.useId();
  
  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target as HTMLInputElement;
    setValue(input.value);
    props.onInput?.(event);
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    props.onFocus?.(event);
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    props.onBlur?.(event);
  }

  const { floatLabel = false } = props;
  const floatPlaceholder = floatLabel && (focused || value.length > 0);
  
  // Decide whether to use native placeholder or simulated label
  const isStringPlaceholder = typeof props.placeholder === 'string';
  const useNativePlaceholder = !floatLabel && isStringPlaceholder;
  const showSimulatedLabel = !!props.placeholder && (!useNativePlaceholder);
  // When using simulated label but not in float mode (e.g. ReactNode placeholder), 
  // hide it when there is input to simulate native behavior
  const hideSimulatedLabel = !floatLabel && value.length > 0;
  
  return (
    <div
      className={`wyx-auto-input_container ${focused ? 'wyx-auto-input_container--focused' : ''} ${props.disabled ? 'wyx-auto-input_container--disabled' : ''} ${props.className || ''}`}
      style={{ minWidth: typeof props.minWidth === 'number' ? `${props.minWidth}px` : props.minWidth || '180px' }}
    >
      {props.prefix && <div className="wyx-auto_prefix">{props.prefix}</div>}
      <div
        className={`wyx-auto-input ${floatPlaceholder ? 'wyx-auto-input--float' : ''}`}>
          {showSimulatedLabel && (
            <label 
              className="wyx-auto_placeholder" 
              htmlFor={inputId}
              style={{
                opacity: hideSimulatedLabel ? 0 : undefined,
                pointerEvents: hideSimulatedLabel ? 'none' : undefined
              }}
            >
              {props.placeholder}
            </label>
          )}
          <input
            id={inputId}
            disabled={props.disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onInput={handleInput}
            value={value}
            maxLength={props.maxLength}
            placeholder={useNativePlaceholder ? (props.placeholder as string) : ""}
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
