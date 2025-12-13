import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';
import { 
  HSV, clamp, 
  hsvToHex, 
  hsvToRgb, rgbToHsv,
  rgbToHsl, formatHsl,
  rgbToLab, formatLab,
  rgbToLch, formatLch,
  rgbToOklab, formatOklab,
  rgbToOklch, formatOklch,
  formatRgb,
  parseColor
} from './colorCalc';

type ColorMode = 'rgb' | 'hsl' | 'lch' | 'lab' | 'oklab' | 'oklch';

const MODES: Record<ColorMode, { label: string }> = {
  rgb: { label: 'RGB' },
  hsl: { label: 'HSL' },
  lch: { label: 'LCH' },
  lab: { label: 'LAB' },
  oklab: { label: 'OKLAB' },
  oklch: { label: 'OKLCH' },
};

export interface ColorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (hex: string, detail: { hsv: HSV; rgb: { r: number; g: number; b: number }; alpha: number; rgba: string }) => void;
  width?: number | string;
  height?: number | string;
  showAlpha?: boolean;
  showConverter?: boolean;
  preset?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export default function Color({
  value,
  defaultValue = '#4096ff',
  onChange,
  width = 260,
  height,
  showAlpha = true,
  showConverter = true,
  className,
  style,
}: ColorProps) {
  const isControlled = typeof value === 'string';
  
  const init = useMemo(() => {
    const p = (isControlled ? parseColor(value as string) : parseColor(defaultValue)) || { hex: '#4096ff', hsv: { h: 210, s: 0.75, v: 1 }, alpha: 1 };
    return { hsv: p.hsv, alpha: p.alpha };
  }, []); // Only run once for init state if uncontrolled, or if we want to sync init. 
  
  const [hsv, setHsv] = useState<HSV>(init.hsv);
  const [alpha, setAlpha] = useState<number>(init.alpha);
  const [displayMode, setDisplayMode] = useState<ColorMode>('rgb');
  const [modeOpen, setModeOpen] = useState(false);
  
  // Local state for hex input to allow loose typing
  const [localHex, setLocalHex] = useState('');
  
  // Track if we are currently dragging any slider to prevent external updates
  // from overriding the high-precision internal state with lossy hex conversions
  const isDragging = useRef(false);
  
  const hueRef = useRef<HTMLDivElement | null>(null);
  const svRef = useRef<HTMLDivElement | null>(null);
  const alphaRef = useRef<HTMLDivElement | null>(null);
  const modeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setModeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isControlled || isDragging.current) return;
    const parsed = parseColor(value as string);
    if (parsed) {
      setHsv((prev) => {
        // Preserve hue if the new color is achromatic (saturation is 0)
        // This prevents the hue from resetting to 0 (Red) when dragging near the left edge
        if (parsed.hsv.s === 0 && prev.h !== 0) {
          return { ...parsed.hsv, h: prev.h };
        }
        return parsed.hsv;
      });
      setAlpha(parsed.alpha);
    }
  }, [value, isControlled]);

  const rgb = useMemo(() => hsvToRgb(hsv), [hsv]);
  const hex = useMemo(() => hsvToHex(hsv), [hsv]);
  const hueColor = useMemo(() => {
    const rgb = hsvToRgb({ h: hsv.h, s: 1, v: 1 });
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }, [hsv.h]);

  // Sync local hex when color changes from outside or other controls
  useEffect(() => {
    setLocalHex(hex.replace('#', ''));
  }, [hex]);

  const triggerChange = (nextHsv: HSV, nextAlpha: number) => {
    const nrgb = hsvToRgb(nextHsv);
    const nhex = hsvToHex(nextHsv);
    onChange?.(nhex, { 
      hsv: nextHsv, 
      rgb: nrgb, 
      alpha: nextAlpha, 
      rgba: `rgba(${nrgb.r},${nrgb.g},${nrgb.b},${nextAlpha})` 
    });
  };

  const handleHsvChange = (nextHsv: HSV) => {
    setHsv(nextHsv);
    triggerChange(nextHsv, alpha);
  };

  const handleAlphaChange = (nextAlpha: number) => {
    setAlpha(nextAlpha);
    triggerChange(hsv, nextAlpha);
  };

  const onDownSV = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const el = svRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const move = (ev: MouseEvent) => {
      const x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
      const s = x;
      const v = clamp(1 - y, 0, 1);
      const next = { h: hsv.h, s, v };
      handleHsvChange(next);
    };
    const up = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e.nativeEvent as unknown as MouseEvent);
  };

  const onDownHue = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const el = hueRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const move = (ev: MouseEvent) => {
      const x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const h = Math.round(x * 360);
      const next = { h, s: hsv.s, v: hsv.v };
      handleHsvChange(next);
    };
    const up = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e.nativeEvent as unknown as MouseEvent);
  };

  const onDownAlpha = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const el = alphaRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const move = (ev: MouseEvent) => {
      const x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      handleAlphaChange(x);
    };
    const up = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    move(e.nativeEvent as unknown as MouseEvent);
  };

  const svStyle = useMemo(() => ({
    width: '100%',
    backgroundImage: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${hueColor})`,
  }), [hueColor]);

  const hueStyle = useMemo(() => ({ width: '100%', background: `linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)` }), []);
  const alphaStyle = useMemo(() => ({ width: '100%', background: `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b},0), rgba(${rgb.r},${rgb.g},${rgb.b},1))` }), [rgb]);

  const svThumb = { left: `calc(${hsv.s * 100}% - 6px)`, top: `calc(${(1 - hsv.v) * 100}% - 6px)` } as React.CSSProperties;
  const hueThumb = { left: `calc(${(hsv.h / 360) * 100}% - 6px)` } as React.CSSProperties;
  const alphaThumb = { left: `calc(${alpha * 100}% - 6px)` } as React.CSSProperties;

  // Format converter logic
  const displayValue = useMemo(() => {
    switch (displayMode) {
      case 'rgb': return formatRgb(rgb);
      case 'hsl': return formatHsl(rgbToHsl(rgb));
      case 'lch': return formatLch(rgbToLch(rgb));
      case 'lab': return formatLab(rgbToLab(rgb));
      case 'oklab': return formatOklab(rgbToOklab(rgb));
      case 'oklch': return formatOklch(rgbToOklch(rgb));
      default: return '';
    }
  }, [rgb, displayMode]);

  const handleHexInput = (val: string) => {
    setLocalHex(val);
    
    // Try to parse as we type. If valid hex (3 or 6 chars), update color
    const match = val.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (match) {
      const p = parseColor('#' + match[1]);
      if (p) handleHsvChange(p.hsv);
    }
  };

  const handleHexBlur = () => {
    // On blur, if valid, format it. If invalid, reset to current color
    const match = localHex.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (match) {
       // Valid input, ensure it's synced and formatted (e.g. if user typed 3 chars)
       const p = parseColor('#' + match[1]);
       if (p) {
         handleHsvChange(p.hsv);
         // Local hex will be updated by the useEffect syncing with `hex`
       }
    } else {
      // Invalid input, reset to current color
      setLocalHex(hex.replace('#', ''));
    }
  };

  return (
    <div className={`wyx-ui_color ${className || ''}`} style={{ width, height, ...style }}>
      <div ref={svRef} className="wyx-ui_color-sv" style={svStyle} onMouseDown={onDownSV}>
        <span className="wyx-ui_color-thumb" style={svThumb} />
      </div>
      <div ref={hueRef} className="wyx-ui_color-hue" style={hueStyle} onMouseDown={onDownHue}>
        <span className="wyx-ui_color-thumb" style={hueThumb} />
      </div>
      {showAlpha && (
        <div ref={alphaRef} className="wyx-ui_color-alpha" style={alphaStyle} onMouseDown={onDownAlpha}>
          <span className="wyx-ui_color-thumb" style={alphaThumb} />
        </div>
      )}
      
      <div className="wyx-ui_color-controls">
        <div className="wyx-ui_color-row">
          <div className="wyx-ui_color-preview" style={{ background: `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})` }} />
          <div className="wyx-ui_color-hex-group">
            <input 
              className="wyx-ui_color-input"
              value={localHex}
              onChange={e => handleHexInput(e.target.value)}
              onBlur={handleHexBlur}
              onKeyDown={e => {
                if (e.key === 'Enter') handleHexBlur();
              }}
            />
            <span className="wyx-ui_color-label">HEX</span>
          </div>
          {showAlpha && (
            <div className="wyx-ui_color-alpha-group">
              <input 
                className="wyx-ui_color-input"
                value={Math.round(alpha * 100)}
                onChange={e => {
                  let v = parseInt(e.target.value, 10);
                  if (isNaN(v)) v = 100;
                  handleAlphaChange(clamp(v, 0, 100) / 100);
                }}
              />
              <span className="wyx-ui_color-label">A %</span>
            </div>
          )}
        </div>

          {showConverter && (
            <div className="wyx-ui_color-converter">
              <div className="wyx-ui_color-mode-container" ref={modeRef}>
                <div 
                  className="wyx-ui_color-mode-trigger" 
                  onClick={() => setModeOpen(!modeOpen)}
                >
                  <span>{MODES[displayMode].label}</span>
                  <svg 
                    viewBox="0 0 24 24" 
                    width="12" 
                    height="12" 
                    fill="currentColor" 
                    className={`wyx-ui_color-mode-arrow ${modeOpen ? 'is-open' : ''}`}
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </div>
                {modeOpen && (
                  <div className="wyx-ui_color-mode-list">
                    {Object.entries(MODES).map(([k, m]) => (
                      <div 
                        key={k} 
                        className={`wyx-ui_color-mode-item ${k === displayMode ? 'is-selected' : ''}`}
                        onClick={() => {
                          setDisplayMode(k as ColorMode);
                          setModeOpen(false);
                        }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div 
                className="wyx-ui_color-display-input"
              >
                <span>{displayValue}</span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}