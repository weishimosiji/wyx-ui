import React from 'react';
import './index.scss';

export interface TypeTextProps {
  text: string;
  speed?: number;
  startDelay?: number;
  loop?: boolean;
  loopDelay?: number;
  cursor?: boolean;
  cursorChar?: string;
  className?: string;
  style?: React.CSSProperties;
  onStart?: () => void;
  onComplete?: () => void;
  erase?: boolean;
  eraseSpeed?: number;
  eraseDelay?: number;
  eraseTo?: number;
  onEraseComplete?: () => void;
}

export interface TypeTextRef {
  erase: (to?: number, speed?: number) => void;
  setText: (text: string, options?: { startDelay?: number }) => void;
}

const TypeText = React.forwardRef<TypeTextRef, TypeTextProps>(({
  text,
  speed = 80,
  startDelay = 0,
  loop = false,
  loopDelay = 800,
  cursor = true,
  cursorChar = '_',
  erase = false,
  eraseSpeed = 80,
  eraseDelay = 800,
  eraseTo = 0,
  className,
  style,
  onStart,
  onComplete,
  onEraseComplete,
}: TypeTextProps, ref) => {
  const [innerText, setInnerText] = React.useState(text);
  const chars = React.useMemo(() => Array.from(innerText || ''), [innerText]);
  const [count, setCount] = React.useState(0);
  const timerRef = React.useRef<number | null>(null);
  const delayRef = React.useRef<number | null>(null);
  const loopRef = React.useRef<number | null>(null);
  const eraseRef = React.useRef<number | null>(null);
  const [erasing, setErasing] = React.useState(false);
  const eraseTargetRef = React.useRef<number>(0);
  const nextStartDelayRef = React.useRef<number | null>(null);
  const eraseActiveRef = React.useRef<boolean>(false);
  const typingActiveRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const start = () => {
      typingActiveRef.current = true;
      onStart?.();
      timerRef.current = window.setInterval(() => {
        setCount(prev => {
          const next = prev + 1;
          if (next >= chars.length) {
            if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
            if (erase) {
              if (loopRef.current) { window.clearTimeout(loopRef.current); loopRef.current = null; }
              loopRef.current = window.setTimeout(() => {
                if (eraseRef.current) { window.clearInterval(eraseRef.current); eraseRef.current = null; }
                eraseTargetRef.current = eraseTo;
                eraseActiveRef.current = true;
                setErasing(true);
                eraseRef.current = window.setInterval(() => {
                  setCount(p => {
                    const n = p - 1;
                    if (n <= eraseTo) {
                      if (eraseRef.current) { window.clearInterval(eraseRef.current); eraseRef.current = null; }
                      setErasing(false);
                      if (loop) {
                        if (loopRef.current) { window.clearTimeout(loopRef.current); loopRef.current = null; }
                        loopRef.current = window.setTimeout(() => {
                          setCount(0);
                          start();
                        }, Math.max(0, loopDelay));
                      }
                    }
                    return Math.max(n, eraseTo);
                  });
                }, Math.max(10, eraseSpeed));
              }, Math.max(0, eraseDelay));
            } else if (loop) {
              if (loopRef.current) { window.clearTimeout(loopRef.current); loopRef.current = null; }
              loopRef.current = window.setTimeout(() => {
                setCount(0);
                start();
              }, Math.max(0, loopDelay));
            }
          }
          return Math.min(next, chars.length);
        });
      }, Math.max(10, speed));
    };

    setCount(0);
    if (delayRef.current) { window.clearTimeout(delayRef.current); delayRef.current = null; }
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (loopRef.current) { window.clearTimeout(loopRef.current); loopRef.current = null; }
    if (eraseRef.current) { window.clearInterval(eraseRef.current); eraseRef.current = null; }
    delayRef.current = window.setTimeout(start, Math.max(0, (nextStartDelayRef.current ?? startDelay)));
    nextStartDelayRef.current = null;
    return () => {
      if (delayRef.current) { window.clearTimeout(delayRef.current); delayRef.current = null; }
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      if (loopRef.current) { window.clearTimeout(loopRef.current); loopRef.current = null; }
      if (eraseRef.current) { window.clearInterval(eraseRef.current); eraseRef.current = null; }
    };
  }, [chars, speed, startDelay, loop, loopDelay, erase, eraseSpeed, eraseDelay, eraseTo, onStart, onComplete, onEraseComplete]);

  React.useEffect(() => {
    setInnerText(text);
  }, [text]);

  React.useEffect(() => {
    if (typingActiveRef.current && count === chars.length) {
      typingActiveRef.current = false;
      setTimeout(() => { onComplete?.(); }, 0);
    }
  }, [count, chars.length, onComplete]);

  React.useEffect(() => {
    if (eraseActiveRef.current && !erasing && count === eraseTargetRef.current) {
      eraseActiveRef.current = false;
      setTimeout(() => { onEraseComplete?.(); }, 0);
    }
  }, [erasing, count, onEraseComplete]);

  const shown = React.useMemo(() => chars.slice(0, count).join(''), [chars, count]);

  React.useImperativeHandle(ref, () => ({
    erase: (toArg?: number, speedArg?: number) => {
      if (delayRef.current) { window.clearTimeout(delayRef.current); delayRef.current = null; }
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      if (loopRef.current) { window.clearTimeout(loopRef.current); loopRef.current = null; }
      if (eraseRef.current) { window.clearInterval(eraseRef.current); eraseRef.current = null; }
      const target = Math.max(0, toArg ?? eraseTo);
      const s = Math.max(10, speedArg ?? eraseSpeed);
      eraseTargetRef.current = target;
      eraseActiveRef.current = true;
      setErasing(true);
      typingActiveRef.current = false;
      eraseRef.current = window.setInterval(() => {
        setCount(p => {
          const n = p - 1;
          if (n <= target) {
            if (eraseRef.current) { window.clearInterval(eraseRef.current); eraseRef.current = null; }
            setErasing(false);
          }
          return Math.max(n, target);
        });
      }, s);
    },
    setText: (newText: string, options?: { startDelay?: number }) => {
      if (delayRef.current) { window.clearTimeout(delayRef.current); delayRef.current = null; }
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
      if (loopRef.current) { window.clearTimeout(loopRef.current); loopRef.current = null; }
      if (eraseRef.current) { window.clearInterval(eraseRef.current); eraseRef.current = null; }
      setErasing(false);
      nextStartDelayRef.current = options?.startDelay ?? null;
      setInnerText(newText);
      setCount(0);
      typingActiveRef.current = false;
    }
  }), [eraseTo, eraseSpeed, onEraseComplete, startDelay]);

  return (
    <span className={`wyx-ui_typetext ${className || ''}`} style={style}>
      <span className="wyx-ui_typetext_text">{shown}</span>
      {cursor && <span className={`wyx-ui_typetext_cursor ${count >= chars.length && !loop ? 'wyx-ui_typetext_cursor--end' : ''}`}>{cursorChar}</span>}
    </span>
  );
});

export default TypeText;
