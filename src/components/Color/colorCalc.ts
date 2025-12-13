export type RGB = { r: number; g: number; b: number };
export type HSV = { h: number; s: number; v: number };
export type HSL = { h: number; s: number; l: number };
export type LAB = { l: number; a: number; b: number };
export type LCH = { l: number; c: number; h: number };
export type OKLAB = { l: number; a: number; b: number };
export type OKLCH = { l: number; c: number; h: number };

export function clamp(n: number, min = 0, max = 1) { return Math.max(min, Math.min(max, n)); }

export function hexToRgb(hex: string): RGB & { a?: number } | null {
  const s = hex.trim().replace(/^#/, '');
  if (s.length === 3) {
    const r = parseInt(s[0] + s[0], 16);
    const g = parseInt(s[1] + s[1], 16);
    const b = parseInt(s[2] + s[2], 16);
    return { r, g, b, a: 1 };
  }
  if (s.length === 6) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  if (s.length === 8) {
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = parseInt(s.slice(6, 8), 16) / 255;
    return { r, g, b, a };
  }
  return null;
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(clamp(Math.round(r), 0, 255))}${to2(clamp(Math.round(g), 0, 255))}${to2(clamp(Math.round(b), 0, 255))}`;
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rr = 0, gg = 0, bb = 0;
  if (h >= 0 && h < 60) { rr = c; gg = x; bb = 0; }
  else if (h < 120) { rr = x; gg = c; bb = 0; }
  else if (h < 180) { rr = 0; gg = c; bb = x; }
  else if (h < 240) { rr = 0; gg = x; bb = c; }
  else if (h < 300) { rr = x; gg = 0; bb = c; }
  else { rr = c; gg = 0; bb = x; }
  return { r: Math.round((rr + m) * 255), g: Math.round((gg + m) * 255), b: Math.round((bb + m) * 255) };
}

export function hexToHsv(hex: string): HSV | null {
  const rgb = hexToRgb(hex); if (!rgb) return null;
  return rgbToHsv(rgb);
}

export function hsvToHex(hsv: HSV): string { return rgbToHex(hsvToRgb(hsv)); }

// HSL Support
export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; 
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// LAB & LCH Support
// D65 standard
const D65 = [95.047, 100.000, 108.883];

function rgbToXyz({ r, g, b }: RGB) {
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
  
  const x = (rr * 0.4124 + gg * 0.3576 + bb * 0.1805) * 100;
  const y = (rr * 0.2126 + gg * 0.7152 + bb * 0.0722) * 100;
  const z = (rr * 0.0193 + gg * 0.1192 + bb * 0.9505) * 100;
  return { x, y, z };
}

function xyzToRgb({ x, y, z }: { x: number; y: number; z: number }): RGB {
  let xx = x / 100;
  let yy = y / 100;
  let zz = z / 100;
  let r = xx * 3.2406 + yy * -1.5372 + zz * -0.4986;
  let g = xx * -0.9689 + yy * 1.8758 + zz * 0.0415;
  let b = xx * 0.0557 + yy * -0.2040 + zz * 1.0570;
  
  const fn = (n: number) => n > 0.0031308 ? 1.055 * Math.pow(n, 1 / 2.4) - 0.055 : 12.92 * n;
  return {
    r: clamp(Math.round(fn(r) * 255), 0, 255),
    g: clamp(Math.round(fn(g) * 255), 0, 255),
    b: clamp(Math.round(fn(b) * 255), 0, 255)
  };
}

function xyzToLab({ x, y, z }: { x: number; y: number; z: number }): LAB {
  const fn = (n: number) => n > 0.008856 ? Math.pow(n, 1 / 3) : (7.787 * n) + (16 / 116);
  const xx = fn(x / D65[0]);
  const yy = fn(y / D65[1]);
  const zz = fn(z / D65[2]);
  return {
    l: (116 * yy) - 16,
    a: 500 * (xx - yy),
    b: 200 * (yy - zz)
  };
}

function labToXyz({ l, a, b }: LAB) {
  const yy = (l + 16) / 116;
  const xx = a / 500 + yy;
  const zz = yy - b / 200;
  const fn = (n: number) => {
    const n3 = Math.pow(n, 3);
    return n3 > 0.008856 ? n3 : (n - 16 / 116) / 7.787;
  };
  return {
    x: fn(xx) * D65[0],
    y: fn(yy) * D65[1],
    z: fn(zz) * D65[2]
  };
}

export function rgbToLab(rgb: RGB): LAB { return xyzToLab(rgbToXyz(rgb)); }
export function labToRgb(lab: LAB): RGB { return xyzToRgb(labToXyz(lab)); }

export function labToLch({ l, a, b }: LAB): LCH {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c, h };
}

export function lchToLab({ l, c, h }: LCH): LAB {
  const rad = (h * Math.PI) / 180;
  return {
    l,
    a: c * Math.cos(rad),
    b: c * Math.sin(rad)
  };
}

export function rgbToLch(rgb: RGB): LCH { return labToLch(rgbToLab(rgb)); }
export function lchToRgb(lch: LCH): RGB { return labToRgb(lchToLab(lch)); }

// OKLAB
// Approximate implementation based on Björn Ottosson's work
function cbrt(x: number) { return Math.cbrt(x); }

export function rgbToOklab({ r, g, b }: RGB): OKLAB {
  // Linearize
  const fn = (n: number) => {
    n /= 255;
    return n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92;
  };
  const lr = fn(r), lg = fn(g), lb = fn(b);
  
  // Linear RGB to LMS
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = cbrt(l), m_ = cbrt(m), s_ = cbrt(s);

  return {
    l: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
  };
}

export function oklabToRgb({ l, a, b }: OKLAB): RGB {
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const fn = (n: number) => {
    n = n > 0.0031308 ? 1.055 * Math.pow(n, 1 / 2.4) - 0.055 : 12.92 * n;
    return clamp(Math.round(n * 255), 0, 255);
  };
  
  return { r: fn(r), g: fn(g), b: fn(bb) };
}

export function oklabToOklch({ l, a, b }: OKLAB): OKLCH {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c, h };
}

export function oklchToOklab({ l, c, h }: OKLCH): OKLAB {
  const rad = (h * Math.PI) / 180;
  return {
    l,
    a: c * Math.cos(rad),
    b: c * Math.sin(rad)
  };
}

export function rgbToOklch(rgb: RGB): OKLCH { return oklabToOklch(rgbToOklab(rgb)); }
export function oklchToRgb(oklch: OKLCH): RGB { return oklabToRgb(oklchToOklab(oklch)); }

// Helpers for formatting
export function formatRgb(rgb: RGB): string { return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`; }
export function formatHsl(hsl: HSL): string { return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`; }
export function formatLab(lab: LAB): string { return `lab(${Math.round(lab.l)} ${Math.round(lab.a)} ${Math.round(lab.b)})`; }
export function formatLch(lch: LCH): string { return `lch(${Math.round(lch.l)} ${Math.round(lch.c)} ${Math.round(lch.h)})`; }
export function formatOklab(ok: OKLAB): string { return `oklab(${ok.l.toFixed(2)} ${ok.a.toFixed(2)} ${ok.b.toFixed(2)})`; }
export function formatOklch(oklch: OKLCH): string { return `oklch(${oklch.l.toFixed(2)} ${oklch.c.toFixed(2)} ${oklch.h.toFixed(2)})`; }

export function parseColor(input: string): { hex: string; hsv: HSV; alpha: number } | null {
  input = input.trim().toLowerCase();
  
  // Hex
  const rgb = hexToRgb(input); 
  if (rgb) return { hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), alpha: rgb.a !== undefined ? rgb.a : 1 };
  
  // RGB
  const mRgb = input.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (mRgb) {
    const r = clamp(parseInt(mRgb[1], 10), 0, 255);
    const g = clamp(parseInt(mRgb[2], 10), 0, 255);
    const b = clamp(parseInt(mRgb[3], 10), 0, 255);
    const hsv = rgbToHsv({ r, g, b });
    return { hex: hsvToHex(hsv), hsv, alpha: 1 };
  }

  // RGBA
  const mRgba = input.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)/);
  if (mRgba) {
    const r = clamp(parseInt(mRgba[1], 10), 0, 255);
    const g = clamp(parseInt(mRgba[2], 10), 0, 255);
    const b = clamp(parseInt(mRgba[3], 10), 0, 255);
    const a = clamp(parseFloat(mRgba[4]), 0, 1);
    const hsv = rgbToHsv({ r, g, b });
    return { hex: hsvToHex(hsv), hsv, alpha: a };
  }

  // HSL
  const mHsl = input.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
  if (mHsl) {
    const h = parseInt(mHsl[1], 10);
    const s = parseInt(mHsl[2], 10) / 100;
    const l = parseInt(mHsl[3], 10) / 100;
    const rgb = hslToRgb({ h, s, l });
    return { hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), alpha: 1 };
  }
  
  // LAB
  const mLab = input.match(/lab\s*\(\s*(\d+)\s+(\-?\d+)\s+(\-?\d+)\s*\)/);
  if (mLab) {
    const l = parseInt(mLab[1], 10);
    const a = parseInt(mLab[2], 10);
    const b = parseInt(mLab[3], 10);
    const rgb = labToRgb({ l, a, b });
    return { hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), alpha: 1 };
  }

  // LCH
  const mLch = input.match(/lch\s*\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\)/);
  if (mLch) {
    const l = parseInt(mLch[1], 10);
    const c = parseInt(mLch[2], 10);
    const h = parseInt(mLch[3], 10);
    const rgb = lchToRgb({ l, c, h });
    return { hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), alpha: 1 };
  }
  
  // OKLAB
  const mOklab = input.match(/oklab\s*\(\s*([\d\.]+)\s+([\-\d\.]+)\s+([\-\d\.]+)\s*\)/);
  if (mOklab) {
    const l = parseFloat(mOklab[1]);
    const a = parseFloat(mOklab[2]);
    const b = parseFloat(mOklab[3]);
    const rgb = oklabToRgb({ l, a, b });
    return { hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), alpha: 1 };
  }

  // OKLCH
  const mOklch = input.match(/oklch\s*\(\s*([\d\.]+)\s+([\d\.]+)\s+([\d\.]+)\s*\)/);
  if (mOklch) {
    const l = parseFloat(mOklch[1]);
    const c = parseFloat(mOklch[2]);
    const h = parseFloat(mOklch[3]);
    const rgb = oklchToRgb({ l, c, h });
    return { hex: rgbToHex(rgb), hsv: rgbToHsv(rgb), alpha: 1 };
  }

  return null;
}
