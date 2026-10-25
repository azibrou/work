// Themes a page can use. The app puts the active page's theme on <html> as
// data-page-theme; themes.css holds the look of every theme except Default.
// Keep free of node/browser APIs.

export const DEFAULT_THEME = 'default';

export const THEMES = {
  default: { label: 'Default' },
  geek: { label: 'Geek' }, // white on black, monospace, inverted active menu item
};

export const THEME_IDS = Object.keys(THEMES);
export const THEME_OPTIONS = THEME_IDS.map((value) => ({ value, label: THEMES[value].label }));

/** Puts a theme on <html>, or clears it for Default. */
export function applyTheme(theme, root = document.documentElement) {
  if (theme && theme !== DEFAULT_THEME) root.dataset.pageTheme = theme;
  else delete root.dataset.pageTheme;
}
