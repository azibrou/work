import './top-menu.css';
import menu from './menu.json';

// Let the browser handle new-tab / new-window clicks itself.
const opensElsewhere = (event) => event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

// The top navigation. Items come from menu.json, edited in Storybook under
// Components/Top navigation; each item opens one page. They are links to #<id> (each
// item is its own page in the URL), so screen readers announce them as
// navigation and aria-current marks the page you're on. onChange also gets the
// clicked link, which page transitions use as their origin.
export default function TopMenu({ items = menu.items, active, onChange }) {
  return (
    <nav className="top-menu" aria-label="Sections">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          data-menu-id={item.id}
          className={`top-menu-item${item.id === active ? ' is-active' : ''}`}
          aria-current={item.id === active ? 'page' : undefined}
          onClick={(event) => {
            if (opensElsewhere(event)) return;
            event.preventDefault();
            onChange?.(item.id, event.currentTarget);
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
