import React from "react";
import './index.scss'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export default function Button({ variant = "primary", size = "md", children, ...props }: ButtonProps) {
  const base = "wyx-btn";
  const { disabled, className } = props;
  const cls = `${base} ${variant === 'primary' ? `${base}--primary` : `${base}--secondary`} ${base}--${size} ${disabled ? `${base}--disabled` : ''} ${className || ''}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
};
