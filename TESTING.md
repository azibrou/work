# Testing

Run from the project root. On Windows PowerShell, use `npm.cmd` if script execution is blocked.

| Command | Description |
| --- | --- |
| `npm run test:a11y` | Accessibility: axe-core WCAG 2.0/2.1/2.2 A/AA scan in light and dark mode, plus a keyboard-focus check. |
| `npm run test:a11y:aaa` | Accessibility: same scan plus WCAG AAA rules (e.g. enhanced 7:1 contrast), light and dark mode. |
| `npm run test:seo` | SEO: lang, title and meta description length, viewport, single h1, image alts, canonical link, Open Graph tags, link text. |
| `npx playwright test` | Runs all Playwright tests (a11y + SEO). |
| `npx playwright show-report` | Opens the HTML report of the last run. |
| `npx lighthouse http://localhost:4173 --only-categories=accessibility,seo --view` | Optional Lighthouse score report. Needs `npm run build; npm run preview` running in another terminal. |
| `npm run storybook` | Starts Storybook (with the a11y addon) on port 6006. |
| `npm test` | Unit tests (Vitest, `tests/`): token CSS generation and validation, committed CSS matches token JSON, card config, `useTokenEditor` hook. |
| `npx vitest run --project storybook` | Runs Storybook component tests in headless Chromium. |
| `npm run lint` | Lints the code with oxlint. |

Tests live in `e2e/`; config is in `playwright.config.js`. The test commands build the app and start a preview server on port 4173 automatically.

**Before going live:** replace the placeholder canonical URL (`https://example.com/`) and the name/description in `index.html`.
