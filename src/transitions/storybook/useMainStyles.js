import { useLayoutEffect } from 'react';
// Page-level styles (reset, body, container). Injected only while a page or the
// app shell is mounted, so they don't leak into the other Storybook pages.
import mainCss from '../../main.css?inline';

export function useMainStyles() {
  useLayoutEffect(() => {
    const style = document.createElement('style');
    style.dataset.appShell = '';
    style.textContent = mainCss;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}
