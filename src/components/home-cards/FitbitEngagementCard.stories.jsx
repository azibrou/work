import FitbitEngagementCard from './FitbitEngagementCard';
import CardSetup from './CardSetup';

const meta = {
  title: 'Home cards/Fitbit engagement',
  component: FitbitEngagementCard,
  parameters: { layout: 'padded' },
  render: () => <CardSetup cardId="fitbitEngagement" Card={FitbitEngagementCard} />,
};

export default meta;

export const Setup = {};
