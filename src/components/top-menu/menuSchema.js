// Shared by the menu setup page (browser) and the save endpoint (node). Keep free of node/browser APIs.
import { DEFAULT_TRANSITION, TRANSITION_IDS } from '../../transitions/registry.js';
import { PAGE_IDS } from '../../pages/pageContent.js';

export const MAX_ITEMS = 8;
export const MAX_LABEL = 30;

function fail(message) {
  throw new Error(message);
}

// Turns a label into an id like "my-section". Ids stay fixed after an item is added,
// so renaming an item never changes which page content it shows.
export function slugify(label) {
  return (
    String(label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

// A slug from the label that no other item uses yet ("item", "item-2", ...).
export function uniqueId(label, items) {
  const taken = new Set(items.map((item) => item.id));
  const base = slugify(label);
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

// Each item opens one page (by id, from pages.json) and plays one transition
// when that page opens. Pages live on their own: removing an item keeps its page.
export function validateMenu(menu, pageIds = PAGE_IDS) {
  const items = Array.isArray(menu?.items) ? menu.items : fail('Menu must have a list of items');
  if (items.length < 1 || items.length > MAX_ITEMS) fail(`Menu needs 1-${MAX_ITEMS} items`);

  const ids = new Set();
  const labels = new Set();
  return {
    items: items.map((item, index) => {
      const n = index + 1;
      const id = typeof item?.id === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id) ? item.id : fail(`Item ${n} has an invalid id`);
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      if (!label || label.length > MAX_LABEL) fail(`Item ${n} needs a label up to ${MAX_LABEL} characters`);
      if (ids.has(id)) fail(`Two items share the id "${id}"`);
      if (labels.has(label.toLowerCase())) fail(`Two items are called "${label}"`);
      ids.add(id);
      labels.add(label.toLowerCase());
      if (!pageIds.includes(item.page)) fail(`Item ${n} opens an unknown page "${item.page ?? ''}"`);
      const transition = item.transition || DEFAULT_TRANSITION;
      if (!TRANSITION_IDS.includes(transition)) fail(`Item ${n} has an unknown transition "${transition}"`);
      return { id, label, page: item.page, transition };
    }),
  };
}
