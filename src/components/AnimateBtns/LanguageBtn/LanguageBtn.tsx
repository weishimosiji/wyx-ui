import './index.scss';

interface LanguageBtnProps {
  lang?: 'zh' | 'en';
  color?: string;
  width?: number | string;
  height?: number | string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function LanguageBtn(props: LanguageBtnProps) {
  const { lang = 'zh', color = 'var(--primary-text)', width = 40, height = 40, onClick } = props; 

  return (
    <button
      className={`wyx-ui_btns wyx-ui_lang-btn`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
      onClick={onClick}
    >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`wyx-ui_lang-${lang}`}
    >
      <g>
        <path d="m5 8 6 6" />
        <path d="m4 14 6-6 2-3" />
        <path d="M2 5h12" />
        <path d="M7 2h1" />
      </g>
      <g>
        <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
      </g>
    </svg>
    </button>
  );
}