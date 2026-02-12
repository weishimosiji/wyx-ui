import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import "./index.scss";

export type RangeTooltipMode = "auto" | "always" | "never";

export type RangeMark = {
  value: number;
  label?: React.ReactNode;
  segmentColor?: string;
};

export type RangeRenderContext = {
  value: number;
  percent: number;
  min: number;
  max: number;
  active: boolean;
  disabled: boolean;
  segmentColor?: string;
};

export interface RangeProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "defaultValue" | "onChange"
  > {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeEnd?: (value: number) => void;
  tooltip?: RangeTooltipMode;
  tooltipHideDelay?: number;
  formatTooltip?: (value: number) => React.ReactNode;
  renderTooltip?: (ctx: RangeRenderContext) => React.ReactNode;
  tooltipClassName?: string;
  tooltipStyle?: React.CSSProperties;
  tooltipBackground?: string;
  tooltipTextColor?: string;
  tooltipBorderColor?: string;
  tooltipShadow?: string;
  tooltipRadius?: number | string;
  tooltipPadding?: number | string;
  tooltipGap?: number | string;
  tooltipFontSize?: number | string;
  tooltipArrowSize?: number | string;
  trackBackground?: string;
  fillBackground?: string;
  renderFill?: (ctx: RangeRenderContext) => React.ReactNode;
  thumbBackground?: string;
  renderThumb?: (ctx: RangeRenderContext) => React.ReactNode;
  thumbClassName?: string;
  thumbStyle?: React.CSSProperties;
  thumbBorder?: string;
  thumbShadow?: string;
  thumbShadowActive?: string;
  thumbRadius?: number | string;
  thumbSize?: number | string;
  trackHeight?: number | string;
  marks?: RangeMark[];
  allowMarkClick?: boolean;
  activeGlow?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function toNumber(v: unknown, fallback: number) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export default function Range({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange,
  onChangeEnd,
  tooltip = "auto",
  tooltipHideDelay = 650,
  formatTooltip,
  renderTooltip,
  tooltipClassName,
  tooltipStyle,
  tooltipBackground,
  tooltipTextColor,
  tooltipBorderColor,
  tooltipShadow,
  tooltipRadius,
  tooltipPadding,
  tooltipGap,
  tooltipFontSize,
  tooltipArrowSize,
  trackBackground,
  fillBackground,
  renderFill,
  thumbBackground,
  renderThumb,
  thumbClassName,
  thumbStyle,
  thumbBorder,
  thumbShadow,
  thumbShadowActive,
  thumbRadius,
  thumbSize,
  trackHeight,
  marks,
  allowMarkClick = true,
  activeGlow = true,
  className,
  style,
  disabled,
  ...rest
}: RangeProps) {
  const isControlled = value !== undefined;
  const minN = toNumber(min, 0);
  const maxN = toNumber(max, 100);
  const stepN = toNumber(step, 1);
  const initial = clamp(
    isControlled ? toNumber(value, minN) : toNumber(defaultValue, minN),
    minN,
    maxN
  );

  const [innerValue, setInnerValue] = useState<number>(initial);
  const currentValue = clamp(isControlled ? toNumber(value, initial) : innerValue, minN, maxN);

  useEffect(() => {
    if (!isControlled) return;
    setInnerValue(clamp(toNumber(value, initial), minN, maxN));
  }, [isControlled, value, minN, maxN, initial]);

  const percent = useMemo(() => {
    if (maxN <= minN) return 0;
    return ((currentValue - minN) / (maxN - minN)) * 100;
  }, [currentValue, minN, maxN]);

  const [isActive, setIsActive] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [tooltipLeftPx, setTooltipLeftPx] = useState<number | null>(null);
  const id = useId();

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const showTooltipNow = () => {
    clearHideTimer();
    setIsTooltipVisible(true);
  };

  const scheduleHideTooltip = () => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setIsTooltipVisible(false);
      hideTimerRef.current = null;
    }, Math.max(0, tooltipHideDelay));
  };

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const onUp = () => {
      setIsActive(false);
      if (tooltip === "auto") scheduleHideTooltip();
      onChangeEnd?.(currentValue);
    };

    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    window.addEventListener("touchend", onUp, { passive: true });
    window.addEventListener("touchcancel", onUp, { passive: true });

    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);
    };
  }, [isActive, tooltip, tooltipHideDelay, onChangeEnd, currentValue]);

  const normalizedMarks = useMemo(() => {
    if (!marks?.length) return [];
    const uniq = new Map<number, RangeMark>();
    for (const m of marks) {
      const v = clamp(toNumber(m.value, minN), minN, maxN);
      uniq.set(v, { value: v, label: m.label, segmentColor: m.segmentColor });
    }
    return Array.from(uniq.values()).sort((a, b) => a.value - b.value);
  }, [marks, minN, maxN]);

  const interpolatedFillColor = useMemo(() => {
    const stops = normalizedMarks
      .filter((m) => typeof m.segmentColor === "string" && m.segmentColor.trim() !== "")
      .map((m) => ({ value: m.value, color: (m.segmentColor as string).trim() }))
      .sort((a, b) => a.value - b.value);

    if (stops.length === 0) return undefined;
    if (stops.length === 1) return stops[0].color;

    if (currentValue <= stops[0].value) return stops[0].color;
    if (currentValue >= stops[stops.length - 1].value) return stops[stops.length - 1].color;

    for (let i = 0; i < stops.length - 1; i++) {
      const from = stops[i];
      const to = stops[i + 1];
      if (currentValue < from.value) continue;
      if (currentValue >= to.value) continue;
      const span = to.value - from.value;
      const t = span <= 0 ? 1 : clamp((currentValue - from.value) / span, 0, 1);
      const a = (1 - t) * 100;
      const b = t * 100;
      return `color-mix(in oklab, ${from.color} ${a}%, ${to.color} ${b}%)`;
    }

    return stops[stops.length - 1].color;
  }, [normalizedMarks, currentValue]);

  const renderCtx: RangeRenderContext = useMemo(
    () => ({
      value: currentValue,
      percent,
      min: minN,
      max: maxN,
      active: isActive,
      disabled: !!disabled,
      segmentColor: interpolatedFillColor,
    }),
    [currentValue, percent, minN, maxN, isActive, disabled, interpolatedFillColor]
  );

  const tooltipContent = renderTooltip
    ? renderTooltip(renderCtx)
    : formatTooltip
      ? formatTooltip(currentValue)
      : currentValue;

  const tooltipVisible =
    tooltip === "always" ? true : tooltip === "never" ? false : isTooltipVisible || isActive;

  const rootStyle: React.CSSProperties = { ...style };
  const toCssSize = (v: number | string) => (typeof v === "number" ? `${v}px` : v);

  if (trackBackground) (rootStyle as any)["--wyx-range-track-bg"] = trackBackground;
  if (fillBackground) (rootStyle as any)["--wyx-range-fill-bg"] = fillBackground;
  else if (interpolatedFillColor) (rootStyle as any)["--wyx-range-fill-bg"] = interpolatedFillColor;
  if (thumbBackground) (rootStyle as any)["--wyx-range-thumb-bg"] = thumbBackground;
  else if (interpolatedFillColor) (rootStyle as any)["--wyx-range-thumb-bg"] = interpolatedFillColor;
  if (thumbBorder) (rootStyle as any)["--wyx-range-thumb-border"] = thumbBorder;
  if (thumbShadow) (rootStyle as any)["--wyx-range-thumb-shadow"] = thumbShadow;
  if (thumbShadowActive) (rootStyle as any)["--wyx-range-thumb-shadow-active"] = thumbShadowActive;
  if (thumbRadius !== undefined) (rootStyle as any)["--wyx-range-thumb-radius"] = toCssSize(thumbRadius);
  if (thumbSize !== undefined) (rootStyle as any)["--wyx-range-thumb-size"] = toCssSize(thumbSize);
  if (trackHeight !== undefined) (rootStyle as any)["--wyx-range-track-height"] = toCssSize(trackHeight);
  if (tooltipBackground) (rootStyle as any)["--wyx-range-tooltip-bg"] = tooltipBackground;
  if (tooltipTextColor) (rootStyle as any)["--wyx-range-tooltip-text"] = tooltipTextColor;
  if (tooltipBorderColor) (rootStyle as any)["--wyx-range-tooltip-border"] = tooltipBorderColor;
  if (tooltipShadow) (rootStyle as any)["--wyx-range-tooltip-shadow"] = tooltipShadow;
  if (tooltipRadius !== undefined) (rootStyle as any)["--wyx-range-tooltip-radius"] = toCssSize(tooltipRadius);
  if (tooltipPadding !== undefined)
    (rootStyle as any)["--wyx-range-tooltip-padding"] = typeof tooltipPadding === "number" ? `${tooltipPadding}px` : tooltipPadding;
  if (tooltipGap !== undefined) (rootStyle as any)["--wyx-range-tooltip-gap"] = toCssSize(tooltipGap);
  if (tooltipFontSize !== undefined) (rootStyle as any)["--wyx-range-tooltip-font-size"] = toCssSize(tooltipFontSize);
  if (tooltipArrowSize !== undefined) (rootStyle as any)["--wyx-range-tooltip-arrow-size"] = toCssSize(tooltipArrowSize);
  (rootStyle as any)["--wyx-range-percent"] = `${percent}%`;

  const updateOverlayLeft = useCallback(() => {
    const inputEl = inputRef.current;
    const rootEl = rootRef.current;
    if (!inputEl || !rootEl) return;

    const width = inputEl.getBoundingClientRect().width;
    const thumbSizeRaw = window.getComputedStyle(rootEl).getPropertyValue("--wyx-range-thumb-size");
    const thumbSizePx = Number.parseFloat(thumbSizeRaw) || 0;
    const ratio = maxN <= minN ? 0 : (currentValue - minN) / (maxN - minN);
    const left = ratio * Math.max(0, width - thumbSizePx) + thumbSizePx / 2;
    if (Number.isFinite(left)) setTooltipLeftPx(left);
  }, [currentValue, minN, maxN]);

  useLayoutEffect(() => {
    updateOverlayLeft();
  }, [updateOverlayLeft]);

  useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => updateOverlayLeft());
      ro.observe(inputEl);
    }

    window.addEventListener("resize", updateOverlayLeft, { passive: true });
    return () => {
      window.removeEventListener("resize", updateOverlayLeft);
      ro?.disconnect();
    };
  }, [updateOverlayLeft]);

  const rootClass = [
    "wyx-range",
    activeGlow && isActive ? "wyx-range--active" : "",
    renderThumb ? "wyx-range--custom-thumb" : "",
    renderFill ? "wyx-range--custom-fill" : "",
    disabled ? "wyx-range--disabled" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = clamp(toNumber(e.target.value, currentValue), minN, maxN);
    if (!isControlled) setInnerValue(next);
    if (tooltip === "auto") showTooltipNow();
    onChange?.(next, e);
  };

  const handleDown = () => {
    if (disabled) return;
    setIsActive(true);
    if (tooltip === "auto") showTooltipNow();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"];
    if (keys.includes(e.key)) {
      setIsActive(true);
      if (tooltip === "auto") showTooltipNow();
    }
  };

  const handleKeyUp = () => {
    if (disabled) return;
    setIsActive(false);
    if (tooltip === "auto") scheduleHideTooltip();
    onChangeEnd?.(currentValue);
  };

  const handleBlur = () => {
    setIsActive(false);
    if (tooltip === "auto") scheduleHideTooltip();
  };

  const setValueFromMark = (v: number) => {
    if (disabled) return;
    const el = inputRef.current;
    if (!el) return;
    const next = clamp(v, minN, maxN);
    const event = new Event("input", { bubbles: true });
    el.value = String(next);
    el.dispatchEvent(event);
    if (!isControlled) setInnerValue(next);
    if (tooltip === "auto") {
      showTooltipNow();
      scheduleHideTooltip();
    }
    onChangeEnd?.(next);
  };

  return (
    <div ref={rootRef} className={rootClass} style={rootStyle}>
      <div className="wyx-range__wrap">
        <div className="wyx-range__track" aria-hidden="true">
          <div className="wyx-range__fill" aria-hidden="true">
            {renderFill ? renderFill(renderCtx) : null}
          </div>
        </div>

        <input
          {...rest}
          ref={inputRef}
          id={rest.id || id}
          className="wyx-range__input"
          type="range"
          min={minN}
          max={maxN}
          step={stepN}
          value={currentValue}
          disabled={disabled}
          onChange={handleInputChange}
          onPointerDown={handleDown}
          onMouseDown={handleDown}
          onTouchStart={handleDown}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={handleBlur}
          aria-valuemin={minN}
          aria-valuemax={maxN}
          aria-valuenow={currentValue}
          aria-describedby={tooltipVisible ? `${id}-tip` : undefined}
        />

        {renderThumb && (
          <div
            className={`wyx-range__thumb ${thumbClassName || ""}`}
            style={{ left: tooltipLeftPx !== null ? `${tooltipLeftPx}px` : `${percent}%`, ...thumbStyle }}
            aria-hidden="true"
          >
            {renderThumb(renderCtx)}
          </div>
        )}

        <div
          id={`${id}-tip`}
          className={`wyx-range__tooltip ${tooltipVisible ? "is-visible" : ""} ${tooltipClassName || ""}`}
          style={{ left: tooltipLeftPx !== null ? `${tooltipLeftPx}px` : `${percent}%`, ...tooltipStyle }}
          aria-hidden={!tooltipVisible}
        >
          {tooltipContent}
        </div>

        {normalizedMarks.length > 0 && (
          <div className="wyx-range__marks" aria-hidden="true">
            {normalizedMarks.map((m) => {
              const p = maxN <= minN ? 0 : ((m.value - minN) / (maxN - minN)) * 100;
              const isOn = Math.abs(m.value - currentValue) < stepN / 2;
              return (
                <div
                  key={m.value}
                  className={`wyx-range__mark ${isOn ? "is-on" : ""} ${allowMarkClick ? "is-clickable" : ""}`}
                  style={{ left: `${p}%` }}
                  onMouseDown={allowMarkClick ? (e) => e.preventDefault() : undefined}
                  onClick={allowMarkClick ? () => setValueFromMark(m.value) : undefined}
                >
                  <span className="wyx-range__mark-dot" />
                  {m.label !== undefined && <span className="wyx-range__mark-label">{m.label}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
