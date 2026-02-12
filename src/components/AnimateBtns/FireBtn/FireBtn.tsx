import { useCallback, useMemo, useState } from "react";
import './index.scss';
import { ClassicFlame } from "./ClassicFlame";

interface FireBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  fireColor?: string;
  burning?: boolean;
  defaultBurning?: boolean;
  onClick?: (burning: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function FireBtn({ width = 40, height = 40, color = 'var(--primary-muted)', fireColor = '#fb923c', burning, defaultBurning = false, onClick }: FireBtnProps) {
  const [innerBurning, setInnerBurning] = useState(defaultBurning);

  const isControlled = useMemo(() => burning !== undefined, [burning]);
  const isBurning = isControlled ? (burning as boolean) : innerBurning;

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const next = !isBurning;
    if (!isControlled) setInnerBurning(next);
    onClick?.(next, event);
  }, [isBurning, isControlled, onClick]);

  return (
    <button
      className={`wyx-ui_btns wyx-ui_fire-btn ${isBurning ? 'wyx-ui_fire-btn-burning' : ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        color: isBurning ? fireColor : color,
      }}
      onClick={handleClick}
      aria-pressed={isBurning}
    >
      <span className="wyx-ui_fire-flame" aria-hidden="true">
        <ClassicFlame size={28} intensity={1} active={isBurning} />
      </span>
    </button>
  );
}
