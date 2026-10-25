import DoingPage from './doing/DoingPage.jsx';
import ExploringPage from './exploring/ExploringPage.jsx';

// Page id → component. A new page needs a component here, an entry in
// pages.json and a list in pageContent.js.
const PAGE_COMPONENTS = {
  doing: DoingPage,
  exploring: ExploringPage,
};

// Renders a page by id, or nothing for an unknown id.
export default function Page({ id }) {
  const Component = PAGE_COMPONENTS[id];
  return Component ? <Component /> : null;
}
