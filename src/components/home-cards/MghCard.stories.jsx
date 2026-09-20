import MghCard from './MghCard';
import CardSetup from './CardSetup';

const meta = {
  title: 'Home cards/MGH',
  component: MghCard,
  parameters: { layout: 'padded' },
  render: () => <CardSetup cardId="mgh" Card={MghCard} />,
};

export default meta;

export const Setup = {};
