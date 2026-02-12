import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './index.scss';

interface DownloadBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  downloading?: boolean;
  progress?: number;
  durationMs?: number;
  defaultDownloading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onChange?: (downloading: boolean, progress: number, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function DownloadBtn({
  width = 40,
  height = 40,
  color = 'var(--primary-text)',
  downloading,
  progress,
  durationMs = 1600,
  defaultDownloading = false,
  onClick,
  onChange
}: DownloadBtnProps) {
  const [innerDownloading, setInnerDownloading] = useState(defaultDownloading);
  const [innerProgress, setInnerProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const doneTimerRef = useRef<number | null>(null);
  const startAtRef = useRef<number>(0);

  const isControlled = useMemo(() => downloading !== undefined, [downloading]);
  const isDownloading = isControlled ? (downloading as boolean) : innerDownloading;
  const shownProgress = progress !== undefined ? Math.max(0, Math.min(100, Math.round(progress))) : innerProgress;
  const meterX1 = 7;
  const meterWidth = 10;
  const meterY = 15;
  const meterX2 = meterX1 + (meterWidth * shownProgress) / 100;

  const stopTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (doneTimerRef.current !== null) {
      window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  useEffect(() => {
    if (isControlled) return;
    if (!innerDownloading) {
      stopTimers();
      setInnerProgress(0);
      return;
    }

    stopTimers();
    startAtRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startAtRef.current;
      const next = Math.min(100, Math.max(0, Math.round((elapsed / Math.max(200, durationMs)) * 100)));
      setInnerProgress(next);
      if (next >= 100) {
        stopTimers();
        doneTimerRef.current = window.setTimeout(() => {
          setInnerDownloading(false);
          setInnerProgress(0);
        }, 240);
      }
    }, 32);
  }, [durationMs, innerDownloading, isControlled, stopTimers]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (isDownloading) return;

    if (!isControlled) {
      setInnerProgress(0);
      setInnerDownloading(true);
    }
    onChange?.(true, 0, event);
  }, [isControlled, isDownloading, onChange, onClick]);

  return (
    <button
      className={`wyx-ui_btns wyx-btn_download ${isDownloading ? 'wyx-btn_download--downloading' : ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        color
      }}
      onClick={handleClick}
      aria-busy={isDownloading}
    >
      <svg
        className="wyx-btn_download__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <g className="wyx-btn_download__arrow">
          <g className="wyx-btn_download__arrowBob">
            <g transform="translate(12 9) scale(0.82) translate(-12 -9)">
              <path d="M12 3v10" />
              <path d="M8 11l4 4 4-4" />
            </g>
          </g>
        </g>
        <g className="wyx-btn_download__meter">
          <line className="wyx-btn_download__meterTrack" x1={meterX1} y1={meterY} x2={meterX1 + meterWidth} y2={meterY} />
          <line className="wyx-btn_download__meterFill" x1={meterX1} y1={meterY} x2={meterX2} y2={meterY} />
        </g>
        <g className="wyx-btn_download__tray">
          <path d="M5 19h14" />
          <path d="M5 16v3" />
          <path d="M19 16v3" />
        </g>
      </svg>
    </button>
  );
}
