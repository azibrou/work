// What each page is made of, in page order. Pages are separate instances: each
// has a component in pageRegistry.jsx, an entry in pages.json (name, theme) and
// a list here. The list decides how components are grouped in Storybook
// (Components/Cards/<page name>). Keep free of node/browser APIs: the story
// generator reads it in node.

export const PAGE_CONTENT = {
  doing: [
    { key: 'mgh', name: 'MGH' },
    { key: 'robotDelivery', name: 'Robot delivery' },
    { key: 'fitbitRewards', name: 'Fitbit rewards' },
    { key: 'fitbitEngagement', name: 'Fitbit engagement' },
    { key: 'yandex', name: 'Yandex' },
    { key: 'groceryRevamp', name: 'Grocery revamp' },
    { key: 'sections', name: 'Sections' },
  ],
  exploring: [
    { key: 'bookShelf', name: 'Book shelf' },
    { key: 'bookCover', name: 'Book cover' },
    { key: 'homeClimate', name: 'Home climate' },
    { key: 'uvLightSensor', name: 'UV and light sensor' },
    { key: 'tradeStudy', name: 'Trade study' },
    { key: 'synthesizerEditor', name: 'Synthesizer editor' },
    { key: 'stockMap', name: 'Stock map' },
    { key: 'atlas', name: 'Atlas' },
  ],
};

export const PAGE_IDS = Object.keys(PAGE_CONTENT);

/**
 * The name a page goes by: the label of the first top-navigation item that
 * opens it, else its own name from pages.json. Removing a menu item never
 * removes the page; it just falls back to that name.
 */
export function pageLabel(pageId, menu, pages) {
  const item = menu?.items?.find((i) => i.page === pageId);
  return item?.label ?? pages?.pages?.find((p) => p.id === pageId)?.name ?? pageId;
}
