import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';

interface ClockBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  seconds?: number;
  running?: boolean;
  defaultRunning?: boolean;
  shakeDurationMs?: number;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFinish?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onChange?: (running: boolean, remainingSeconds: number) => void;
}

function formatSeconds(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export default function ClockBtn({
  width = 40,
  height = 40,
  color = 'var(--primary-text)',
  seconds = 10,
  running,
  defaultRunning = false,
  shakeDurationMs = 3000,
  onClick,
  onFinish,
  onChange
}: ClockBtnProps) {
  const [innerRunning, setInnerRunning] = useState(defaultRunning);
  const [innerRemaining, setInnerRemaining] = useState(() => Math.max(0, Math.round(seconds)));
  const [ringing, setRinging] = useState(false);

  const isControlled = useMemo(() => running !== undefined, [running]);
  const isRunning = isControlled ? (running as boolean) : innerRunning;
  const remainingSeconds = useMemo(() => {
    if (isControlled) return Math.max(0, Math.round(innerRemaining));
    return innerRemaining;
  }, [innerRemaining, isControlled]);

  const tickTimerRef = useRef<number | null>(null);
  const endAtRef = useRef<number>(0);
  const ringTimerRef = useRef<number | null>(null);
  const lastClickEventRef = useRef<React.MouseEvent<HTMLButtonElement> | null>(null);

  const stopTimers = useCallback(() => {
    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (ringTimerRef.current !== null) {
      window.clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isControlled) {
      setInnerRemaining(Math.max(0, Math.round(seconds)));
    }
  }, [isControlled, seconds]);

  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  useEffect(() => {
    if (isControlled) return;

    if (!innerRunning) {
      if (tickTimerRef.current !== null) {
        window.clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }
      return;
    }

    const total = Math.max(0, Math.round(seconds));
    const start = Date.now();
    endAtRef.current = start + total * 1000;
    setInnerRemaining(total);
    onChange?.(true, total);

    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current);
    }
    tickTimerRef.current = window.setInterval(() => {
      const now = Date.now();
      const next = Math.max(0, Math.ceil((endAtRef.current - now) / 1000));
      setInnerRemaining(next);
      onChange?.(true, next);

      if (next <= 0) {
        if (tickTimerRef.current !== null) {
          window.clearInterval(tickTimerRef.current);
          tickTimerRef.current = null;
        }
        setInnerRunning(false);
        onChange?.(false, 0);
        setRinging(true);
        const evt = lastClickEventRef.current;
        if (evt) onFinish?.(evt);
        ringTimerRef.current = window.setTimeout(() => {
          setRinging(false);
          setInnerRemaining(total);
        }, Math.max(0, shakeDurationMs));
      }
    }, 180);
  }, [innerRunning, isControlled, onChange, onFinish, seconds, shakeDurationMs]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    lastClickEventRef.current = event;
    onClick?.(event);
    if (ringing) return;
    if (isRunning) return;

    if (!isControlled) {
      setInnerRunning(true);
    } else {
      onChange?.(true, Math.max(0, Math.round(seconds)));
    }
  }, [isControlled, isRunning, onChange, onClick, ringing, seconds]);

  const showTime = useMemo(() => isRunning || ringing, [isRunning, ringing]);

  const displayText = useMemo(() => {
    if (!showTime) return '';
    return formatSeconds(remainingSeconds);
  }, [remainingSeconds, showTime]);

  return (
    <button
      className={`wyx-ui_btns wyx-btn_clock ${ringing ? 'wyx-btn_clock--ringing' : ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        color,
        ['--wyx-clock-shake-ms' as any]: `${shakeDurationMs}ms`
      }}
      onClick={handleClick}
      aria-busy={isRunning}
    >
      <svg
        className="wyx-btn_clock__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <g className="wyx-btn_clock__top">
          <path d="M4 5 2 3" />
          <path d="M20 5 22 3" />
        </g>

        {!showTime && (
          <g className="wyx-btn_clock__middle">
            <circle cx="12" cy="13" r="7" />
            <path d="M12 13l3-2" />
            <path d="M12 10v3" />
          </g>
        )}

        <g className="wyx-btn_clock__bottom">
          <path d="M8 20l-2 2" />
          <path d="M16 20l2 2" />
        </g>

        {showTime && (
          <g className="wyx-btn_clock__outline" aria-hidden="true">
            <path d="M7.1 8A7 7 0 0 1 16.9 8" />
            <path d="M16.9 18A7 7 0 0 1 7.1 18" />
          </g>
        )}

        {showTime && (
          <g className="wyx-btn_clock__label" aria-hidden="true">
            <text
              className="wyx-btn_clock__labelText"
              x="12"
              y="13"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              stroke="none"
              fontSize="6.4"
              fontWeight="800"
            >
              {displayText}
            </text>
          </g>
        )}
      </svg>
    </button>
  );
}
