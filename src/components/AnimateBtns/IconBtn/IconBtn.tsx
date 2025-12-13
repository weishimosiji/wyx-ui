import './index.scss';
import React from 'react';

interface IconBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  icon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function IconBtn({ ...props }: IconBtnProps) {
  const { icon = undefined, width = 40, height = 40, color = 'var(--primary-text)', onClick } = props;

  return (
    <button
      className={`wyx-ui_btns wyx-btn_icon`}
      style={{ width, height, color }}
      onClick={onClick}
    >
      { icon }
    </button>
  );
}