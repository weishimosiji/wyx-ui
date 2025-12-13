import React from 'react';
import './index.scss';

interface FullScreenBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  onChange?: (isFullScreen: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function FullScreenBtn({ width = 40, height = 40, color = 'var(--primary-text)', onChange, onClick, ...props }: FullScreenBtnProps) {
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsFullScreen(!isFullScreen);
    onChange?.(!isFullScreen);  
    onClick?.(event);
  }
  return (
    <button
      onClick={handleClick}
      className={`wyx-ui_btns wyx-btn_fullscreen ${isFullScreen ? 'open' : 'close'}`}
      style={{ width, height, color }}
      {...props}
    >
      <svg viewBox="0 0 150 150">
        <path id="fullscreen-path1" />
        <path id="fullscreen-path2" />
        <path id="fullscreen-path3" />
        <path id="fullscreen-path4" />
      </svg>
    </button>
  );
}