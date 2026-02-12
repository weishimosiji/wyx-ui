import './index.scss';

type ArrowDirection = 'top' | 'right' | 'bottom' | 'left';

interface ArrowBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  width?: number | string;
  height?: number | string;
  color?: string;
  direction?: ArrowDirection;
  as?: 'button' | 'span';
}


export default function ArrowBtn({
  width = 40,
  height = 40,
  color = 'var(--primary-text)',
  direction = 'right',
  as = 'button',
  onClick,
  className,
  style,
  ...props
}: ArrowBtnProps) {

  const cls = `wyx-ui_btns wyx-btn_arrow arrow-path_${direction} ${className || ''}`.trim();
  const s = { width, height, color, ...(style || {}) } as React.CSSProperties;

  if (as === 'span') {
    return (
      <span className={cls} style={s} aria-hidden="true">
        <svg viewBox="0 0 150 150">
          <path className="arrow-path" />
        </svg>
      </span>
    );
  }

  return (
    <button
      className={cls}
      style={s}
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
