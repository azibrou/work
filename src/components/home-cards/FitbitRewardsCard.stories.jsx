import FitbitRewardsCard from './FitbitRewardsCard';
import CardSetup from './CardSetup';

const meta = {
  title: 'Home cards/Fitbit rewards',
  component: FitbitRewardsCard,
  parameters: { layout: 'padded' },
  render: () => <CardSetup cardId="fitbitRewards" Card={FitbitRewardsCard} />,
};

export default meta;

export const Setup = {};
