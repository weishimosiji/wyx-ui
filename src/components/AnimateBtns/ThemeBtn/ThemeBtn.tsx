
import './index.scss';

interface ThemeBtnProps {
  theme?: 'light' | 'dark';
  color?: string;
  width?: number | string;
  height?: number | string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function ThemeBtn({ ...props }: ThemeBtnProps) {
  const { theme = 'light', color = 'var(--primary-text)', width = 40, height = 40, onClick } = props; 

  return (
    <button
      className={`wyx-ui_btns wyx-ui_theme-btn`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
      onClick={onClick}
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
          <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/>
          <path d="m19.07 4.93-1.41 1.41"/>
        </svg>)}
    </button>
  );
}