export type BaseOp = 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'sepia' | 'hue' | 'saturate' | 'invert';

export type FilterSpec =
  | { op: BaseOp; value: number }
  | { op: 'dropShadow'; x: number; y: number; blur: number; color?: string };

function fmtPercent(v: number) {
  return v <= 1 ? `${Math.round(v * 100)}%` : `${v}%`;
}

export function toFilterString(specs: FilterSpec[]): string {
  return specs
    .map((s) => {
      if (s.op === 'blur') return `blur(${s.value}px)`;
      if (s.op === 'brightness') return `brightness(${fmtPercent(s.value)})`;
      if (s.op === 'contrast') return `contrast(${fmtPercent(s.value)})`;
      if (s.op === 'grayscale') return `grayscale(${fmtPercent(s.value)})`;
      if (s.op === 'sepia') return `sepia(${fmtPercent(s.value)})`;
      if (s.op === 'hue') return `hue-rotate(${s.value}deg)`;
      if (s.op === 'saturate') return `saturate(${fmtPercent(s.value)})`;
      if (s.op === 'invert') return `invert(${fmtPercent(s.value)})`;
      if (s.op === 'dropShadow') return `drop-shadow(${s.x}px ${s.y}px ${s.blur}px ${s.color || 'rgba(0,0,0,0.3)'})`;
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

export const blur = (px: number): FilterSpec => ({ op: 'blur', value: px });
export const brightness = (v: number): FilterSpec => ({ op: 'brightness', value: v });
export const contrast = (v: number): FilterSpec => ({ op: 'contrast', value: v });
export const grayscale = (v: number): FilterSpec => ({ op: 'grayscale', value: v });
export const sepia = (v: number): FilterSpec => ({ op: 'sepia', value: v });
export const hue = (deg: number): FilterSpec => ({ op: 'hue', value: deg });
export const saturate = (v: number): FilterSpec => ({ op: 'saturate', value: v });
export const invert = (v: number): FilterSpec => ({ op: 'invert', value: v });
export const dropShadow = (x: number, y: number, blurPx: number, color?: string): FilterSpec => ({ op: 'dropShadow', x, y, blur: blurPx, color });

export function apply(specs: FilterSpec[]) {
  return { filter: toFilterString(specs) } as const;
}

export const presets = {
  vintage: [sepia(60), contrast(110), brightness(100), saturate(130)] as FilterSpec[],
  noir: [grayscale(100), contrast(120), brightness(90)] as FilterSpec[],
  warm: [sepia(20), saturate(110), contrast(105)] as FilterSpec[],
  cool: [hue(200), saturate(110), brightness(98), contrast(102)] as FilterSpec[],
  mono: [grayscale(100)] as FilterSpec[],
};

export const namedPresets: Record<string, FilterSpec[]> = {
  classic: [contrast(105), saturate(110), brightness(102)],
  warm: presets.warm,
  cool: presets.cool,
  vintage: presets.vintage,
  noir: presets.noir,
  mono: presets.mono,
  blackwhite: presets.mono,
};

export function getPreset(name: string): FilterSpec[] | undefined {
  if (!name) return undefined;
  const k = name.toLowerCase();
  return namedPresets[k] || namedPresets[name];
}