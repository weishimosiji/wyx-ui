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

// theme.js
class ThemeManager {
  private themes: Record<string, ThemeConfig> = {};
  private currentTheme: 'light' | 'dark' = 'light';
  private stylesheet: CSSStyleSheet = new CSSStyleSheet();
  private styleEl: HTMLStyleElement | null = null;

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
    this.init();
  }

  private attachSheet() {
    const supportsConstructable = 'adoptedStyleSheets' in document && 'replaceSync' in (CSSStyleSheet.prototype as any);
    if (supportsConstructable) {
      const sheets = (document.adoptedStyleSheets || []) as CSSStyleSheet[];
      if (!sheets.includes(this.stylesheet)) {
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
  }

  private applyTheme(theme: ThemeConfig) {
    const cssText = `
      .wyx-ui {
        ${Object.entries(theme).map(([key, value]) => `${key}: ${value};`).join('\n')}
      }
    `;
    const supportsConstructable = 'adoptedStyleSheets' in document && 'replaceSync' in (CSSStyleSheet.prototype as any);
    if (supportsConstructable) {
      this.stylesheet.replaceSync(cssText);
    } else if (this.styleEl) {
      this.styleEl.textContent = cssText;
    }
  }

  init() {
    // Restore theme from localStorage
    const savedTheme: ThemeName | null = localStorage.getItem('wyx-ui-theme') as ThemeName | null;
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

    this.applyTheme(theme);
    
    // Save to localStorage
    localStorage.setItem('wyx-ui-theme', themeName);
    
    // Trigger theme change event
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { theme: themeName } 
    }));
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
        this.switchTheme(name); // Apply update immediately
      }
    }
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export methods for third-party use
export const switchTheme = (themeName: ThemeName) => themeManager.switchTheme(themeName);
export const getCurrentTheme = () => themeManager.getCurrentTheme();
export const getAvailableThemes = () => themeManager.getAvailableThemes();
export const addTheme = (name: ThemeName, themeConfig: ThemeConfig) => themeManager.addTheme(name, themeConfig);
export const updateTheme = (name: ThemeName, updates: Partial<ThemeConfig>) => themeManager.updateTheme(name, updates);

export default themeManager;