import { useState } from 'react';
import './index.scss';

interface CodeBtnProps {
  color?: string;
  width?: number | string;
  height?: number | string;
  show?: boolean;
  onChange?: (show: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function CodeBtn({ ...props }: CodeBtnProps) {
  const { color = 'var(--primary-text)', width = 40, height = 40, onChange, onClick, show = false } = props; 

  const [showCode, setShowCode] = useState(show);

  return (
    <button
      className={`wyx-ui_btns wyx-ui_code-btn ${showCode ? '' : 'wyx-ui_code-btn_hide'}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
      onClick={(event) => {
        onClick?.(event);
        setShowCode(!showCode);
        onChange?.(!showCode);
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path className="wyx-ui_code-btn__r" d="m18 16 4-4-4-4"/>
        <path className="wyx-ui_code-btn__l" d="m6 8-4 4 4 4"/>
        <path className="wyx-ui_code-btn__path" d="m14.5 4-5 16"/>
      </svg>

    </button>
  );
}