import './index.scss';

type ArrowDirection = 'top' | 'right' | 'bottom' | 'left';

interface ArrowBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  direction?: ArrowDirection;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}


export default function ArrowBtn({ width = 40, height = 40, color = 'var(--primary-text)', direction = 'right', onClick, ...props }: ArrowBtnProps) {

  return (
    <button
      className={`wyx-ui_btns wyx-btn_arrow arrow-path_${direction}`}
      style={{ width, height, color }}
      {...props}
      onClick={(event) => {
        onClick?.(event);
      }}
    >
      <svg viewBox="0 0 150 150">
        <path className="arrow-path" />
      </svg>
    </button>
  );
}