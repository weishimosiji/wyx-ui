import React from 'react';
import './index.scss';

export interface BorderTextProps {
  borderWidth?: `${number}px`;
  borderColor?: string;
  transitionTime?: `${number}s`;
}

export default function BorderText({ children, ...props }: React.PropsWithChildren<BorderTextProps>) {
  return (
    <span
        className={`wyx-ui wyx-border-text`}
        style={{
          '--s': props.borderWidth || '2px',
          '--c': props.borderColor || 'var(--primary-border)',
          '--t': props.transitionTime || '0.4s'
        } as React.CSSProperties}>
      {children}
    </span>
  );
}