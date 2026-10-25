import TopMenu from './TopMenu';
import TopMenuSetup from './TopMenuSetup';

const meta = {
  title: 'Components/Top navigation',
  component: TopMenu,
  parameters: { layout: 'padded' },
  render: () => <TopMenuSetup />,
};

export default meta;

// Add, remove, rename and reorder items, pick each item's page and transition, then Apply to write menu.json.
export const Setup = {};
