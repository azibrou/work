import Memo from './Memo';
import MemoSetup from './MemoSetup';

const meta = {
  title: 'Components/Memo',
  component: Memo,
  parameters: { layout: 'padded' },
  render: () => <MemoSetup />,
};

export default meta;

// Create and edit memos, pick which one each page shows, then Apply to write memo.json.
export const Setup = {};
