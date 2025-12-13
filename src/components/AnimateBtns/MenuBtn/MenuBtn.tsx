import React from 'react';
import './index.scss';

interface MenuBtnProps {
  width?: number;
  height?: number;
  color?: string;
  onClick?: (event: React.MouseEvent) => void;
  onChange?: (isOpen: boolean) => void;
}

export default function MenuBtn({ width = 40, height = 40, color = 'var(--primary-text)', onClick, onChange, ...props }: MenuBtnProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleClick = (event: React.MouseEvent) => {
    setIsOpen(!isOpen);
    onClick?.(event);
    onChange?.(isOpen);
  }
  
  return (
    <button
      className={`wyx-ui_btns wyx-menu-button ${isOpen ? 'open' : 'closed'}`}
      style={{ width, height, color }}
      onClick={handleClick}
      {...props}
    >
      <svg viewBox="0 0 40 40">
        <path d="M 5 10 L 35 10" />
        <path d="M 5 20 L 35 20" />
        <path d="M 5 30 L 35 30" />
      </svg>
    </button>
  );
}