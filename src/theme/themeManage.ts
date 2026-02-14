interface ThemeConfig {
  "--primary-border": string;
  "--bg-dark": string;
  "--bg": string;
  "--bg-light": string;
  "--bg-card": string;
  "--primary-text": string;
  "--primary-muted": string;
  "--primary-hover": string;
}

export enum ThemeName {
  Dark = 'dark',
  Light = 'light',
}

const canUseDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

class ThemeManager {
  private themes: Record<string, ThemeConfig> = {};
  private currentTheme: 'light' | 'dark' = 'light';
  private stylesheet: CSSStyleSheet | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private attached = false;
  private initialized = false;

  constructor() {
    this.themes = {
      dark: {
        "--primary-border": "oklch(0.65 0.15 264)",
        "--bg-dark": "oklch(0.92 0 264)",
        "--bg": "oklch(0.96 0 264)",
        "--bg-light": "oklch(1 0 264)",
        "--bg-card": "oklch(0.89 0 0)",
        "--primary-text": "oklch(0.15 0 264)",
        "--primary-muted": "oklch(0.4 0 264)",
        "--primary-hover": "oklch(0 0 0 / 0.05)",
      },
      light: {
        "--primary-border": "oklch(0.9 0.17 100)",
        "--bg-dark": "oklch(0.1 0 264)",
        "--bg": "oklch(0.2 0 264)",
        "--bg-light": "oklch(0.3 0 264)",
        "--bg-card": "oklch(0.24 0 0)",
        "--primary-text": "oklch(0.9 0 0)",
        "--primary-muted": "oklch(0.75 0 264)",
        "--primary-hover": "oklch(0.39 0 0)",
      }
    };
    
    this.currentTheme = 'light';
  }

  private attachSheet() {
    if (!canUseDOM) return;
    if (this.attached) return;

    const supportsConstructable =
      'adoptedStyleSheets' in document &&
      typeof (CSSStyleSheet as any) !== 'undefined' &&
      'replaceSync' in (CSSStyleSheet.prototype as any);

    if (supportsConstructable) {
      if (!this.stylesheet) this.stylesheet = new CSSStyleSheet();
      const sheets = (document.adoptedStyleSheets || []) as CSSStyleSheet[];
      if (this.stylesheet && !sheets.includes(this.stylesheet)) {
        document.adoptedStyleSheets = [...sheets, this.stylesheet];
      }
    } else {
      this.styleEl = document.getElementById('wyx-ui-theme-style') as HTMLStyleElement | null;
      if (!this.styleEl) {
        this.styleEl = document.createElement('style');
        this.styleEl.id = 'wyx-ui-theme-style';
        document.head.appendChild(this.styleEl);
      }
    }

    this.attached = true;
  }

  private applyTheme(theme: ThemeConfig) {
    if (!canUseDOM) return;
    const cssText = `
      .wyx-ui {
        ${Object.entries(theme).map(([key, value]) => `${key}: ${value};`).join('\n')}
      }
    `;
    const supportsConstructable =
      'adoptedStyleSheets' in document &&
      this.stylesheet &&
      'replaceSync' in (CSSStyleSheet.prototype as any);

    if (supportsConstructable && this.stylesheet) {
      this.stylesheet.replaceSync(cssText);
    } else if (this.styleEl) {
      this.styleEl.textContent = cssText;
    }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    if (!canUseDOM) return;

    let savedTheme: ThemeName | null = null;
    try {
      savedTheme = localStorage.getItem('wyx-ui-theme') as ThemeName | null;
    } catch {
      savedTheme = null;
    }

    this.attachSheet();
    this.switchTheme(savedTheme || ThemeName.Light);
  }

  switchTheme(themeName: ThemeName) {
    if (!this.themes[themeName]) { 
      console.warn(`Theme "${themeName}" not found`);
      return;
    }

    this.currentTheme = themeName;
    const theme = this.themes[themeName];

    if (!canUseDOM) return;
    this.attachSheet();
    this.applyTheme(theme);
    
    try {
      localStorage.setItem('wyx-ui-theme', themeName);
    } catch {
      void 0;
    }
    
    try {
      window.dispatchEvent(new CustomEvent('themeChange', {
        detail: { theme: themeName }
      }));
    } catch {
      void 0;
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return Object.keys(this.themes) as (keyof ThemeConfig)[];
  }

  // Third parties can add custom themes
  addTheme(name: ThemeName, themeConfig: ThemeConfig) {
    this.themes[name] = { ...this.themes.light, ...themeConfig };
  }

  // Third parties can update existing themes
  updateTheme(name: ThemeName, updates: Partial<ThemeConfig>) {
    if (this.themes[name]) {
      this.themes[name] = { ...this.themes[name], ...updates };
      if (this.currentTheme === name) {
        this.switchTheme(name);
      }
    }
  }
}

let singleton: ThemeManager | null = null;
function getThemeManager() {
  if (!singleton) singleton = new ThemeManager();
  if (canUseDOM) singleton.init();
  return singleton;
}

export const switchTheme = (themeName: ThemeName) => getThemeManager().switchTheme(themeName);
export const getCurrentTheme = () => getThemeManager().getCurrentTheme();
export const getAvailableThemes = () => getThemeManager().getAvailableThemes();
export const addTheme = (name: ThemeName, themeConfig: ThemeConfig) => getThemeManager().addTheme(name, themeConfig);
export const updateTheme = (name: ThemeName, updates: Partial<ThemeConfig>) => getThemeManager().updateTheme(name, updates);

const themeManager = {
  init: () => getThemeManager().init(),
  switchTheme,
  getCurrentTheme,
  getAvailableThemes,
  addTheme,
  updateTheme,
};

export default themeManager;
