import './index.scss';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';


function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface TransformTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface TransformTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  texts: string[];
  animatePresenceMode?: 'sync' | 'wait';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  duration?: number;
  ease?: string;
  enterFromY?: string | number;
  exitToY?: string | number;
}

const TransformText = forwardRef<TransformTextRef, TransformTextProps>((props, ref) => {
  const {
    texts,
    animatePresenceMode = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    duration = 400,
    ease = 'cubic-bezier(.2,.8,.2,1)',
    enterFromY = '100%',
    exitToY = '-120%',
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);
  const [prevTextIndex, setPrevTextIndex] = useState<number | null>(null);
  
  
  const pendingIndexRef = useRef<number | null>(null);
  const clearPrevTimer = useRef<number | null>(null);
  const randomAnchorRef = useRef<{ total: number; anchor: number } | null>(null);

  const splitIntoCharacters = (text: string): string[] => {
    return Array.from(text);
  };

  const elementsForIndex = useCallback((idx: number) => {
    const text = texts[idx];
    if (splitBy === 'characters') {
      const words = text.split(' ');
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1
      }));
    }
    if (splitBy === 'words') {
      return text.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1
      }));
    }
    if (splitBy === 'lines') {
      return text.split('\n').map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1
      }));
    }

    return text.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1
    }));
  }, [texts, splitBy, splitIntoCharacters]);

  const elements = useMemo(() => elementsForIndex(currentTextIndex), [elementsForIndex, currentTextIndex]);
  const prevElements = useMemo(() => (prevTextIndex != null ? elementsForIndex(prevTextIndex) : null), [elementsForIndex, prevTextIndex]);

  const getStaggerDelay = useCallback(
    (index: number, totalChars: number): number => {
      const total = totalChars;
      const withMs = (d: number) => d * staggerDuration;

      let anchorIndex: number;
      if (staggerFrom === 'first') anchorIndex = 0;
      else if (staggerFrom === 'last') anchorIndex = total - 1;
      else if (staggerFrom === 'center') anchorIndex = Math.floor((total - 1) / 2);
      else if (staggerFrom === 'random') {
        if (!randomAnchorRef.current || randomAnchorRef.current.total !== total) {
          randomAnchorRef.current = { total, anchor: Math.floor(Math.random() * total) };
        }
        anchorIndex = randomAnchorRef.current.anchor;
      } else {
        const n = typeof staggerFrom === 'number' ? Math.max(0, Math.min(staggerFrom, total - 1)) : 0;
        anchorIndex = n;
      }

      const dist = Math.abs(anchorIndex - index);
      return withMs(dist);
    },
    [staggerFrom, staggerDuration]
  );

  const getTotalChars = useCallback((arr: { characters: string[]; needsSpace: boolean }[]) => arr.reduce((sum, word) => sum + word.characters.length, 0), []);

  const getLongestDelay = useCallback((arr: { characters: string[]; needsSpace: boolean }[]) => {
    const total = getTotalChars(arr);
    let max = 0;
    for (let i = 0; i < total; i++) {
      const d = getStaggerDelay(i, total);
      if (d > max) max = d;
    }
    return max;
  }, [getStaggerDelay, getTotalChars]);

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      if (animatePresenceMode === 'wait') {
        if (prevTextIndex != null) {
          pendingIndexRef.current = newIndex;
          return;
        }
        pendingIndexRef.current = newIndex;
        setPrevTextIndex(currentTextIndex);
        const arr = elementsForIndex(currentTextIndex);
        const exitAfter = getLongestDelay(arr) + duration;
        if (clearPrevTimer.current) { window.clearTimeout(clearPrevTimer.current); clearPrevTimer.current = null; }
        clearPrevTimer.current = window.setTimeout(() => {
          const finalIndex = pendingIndexRef.current ?? newIndex;
          setCurrentTextIndex(finalIndex);
          setPrevTextIndex(null);
          pendingIndexRef.current = null;
        }, exitAfter);
        onNext?.(newIndex);
      } else {
        setPrevTextIndex(currentTextIndex);
        setCurrentTextIndex(newIndex);
        const arr = elementsForIndex(currentTextIndex);
        const exitAfter = getLongestDelay(arr) + duration;
        if (clearPrevTimer.current) { window.clearTimeout(clearPrevTimer.current); clearPrevTimer.current = null; }
        clearPrevTimer.current = window.setTimeout(() => setPrevTextIndex(null), exitAfter);
        onNext?.(newIndex);
      }
    },
    [animatePresenceMode, currentTextIndex, prevTextIndex, elementsForIndex, getLongestDelay, duration, onNext]
  );

  const next = useCallback(() => {
    const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback(
    (index: number) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0);
    }
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset
    }),
    [next, previous, jumpTo, reset]
  );

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  useEffect(() => {
    return () => {
      if (clearPrevTimer.current) { window.clearTimeout(clearPrevTimer.current); clearPrevTimer.current = null; }
    };
  }, []);

  const rootStyle: React.CSSProperties = {
    ['--text-rotate-duration' as any]: `${duration}ms`,
    ['--text-rotate-ease' as any]: ease,
    ['--text-rotate-enter-y' as any]: typeof enterFromY === 'number' ? `${enterFromY}px` : enterFromY,
    ['--text-rotate-exit-y' as any]: typeof exitToY === 'number' ? `${exitToY}px` : exitToY,
  };

  const renderChunk = (arr: { characters: string[]; needsSpace: boolean }[], enter: boolean) => (
    <span className={cn(splitBy === 'lines' ? 'wyx-ui_transform-lines' : 'wyx-ui_transform-text')} aria-hidden="true">
      {arr.map((wordObj, wordIndex, array) => {
        const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
        const totalChars = getTotalChars(array);
        const chunkTextIndex = enter ? currentTextIndex : (prevTextIndex ?? currentTextIndex);
        return (
          <span key={`w-${chunkTextIndex}-${wordIndex}-${enter ? 'in' : 'out'}`} className={cn('wyx-ui_transform-word', splitLevelClassName)}>
            {wordObj.characters.map((char, charIndex) => (
              <span
                key={`c-${chunkTextIndex}-${wordIndex}-${charIndex}-${enter ? 'in' : 'out'}`}
                className={cn('wyx-ui_transform-element', enter ? 'wyx-ui_transform-enter' : 'wyx-ui_transform-exit', elementLevelClassName)}
                style={{ animationDelay: `${getStaggerDelay(previousCharsCount + charIndex, totalChars)}ms` }}
              >
                {char}
              </span>
            ))}
            {wordObj.needsSpace && <span className="wyx-ui_transform-space"> </span>}
          </span>
        );
      })}
    </span>
  );

  

  return (
    <span className={cn('wyx-ui_transform-text', mainClassName)} {...rest} style={{ ...(rest.style as React.CSSProperties), ...rootStyle }}>
      <span className="wyx-ui_transform-sr-only">{texts[currentTextIndex]}</span>
      {prevElements && renderChunk(prevElements, false)}
      {animatePresenceMode === 'wait' ? (!prevElements && renderChunk(elements, true)) : renderChunk(elements, true)}
    </span>
  );
});

TransformText.displayName = 'TransformText';
export default TransformText;
