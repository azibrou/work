import RobotDeliveryCard from './RobotDeliveryCard';
import CardSetup from './CardSetup';

const meta = {
  title: 'Home cards/Robot delivery',
  component: RobotDeliveryCard,
  parameters: { layout: 'padded' },
  render: () => <CardSetup cardId="robotDelivery" Card={RobotDeliveryCard} />,
};

export default meta;

export const Setup = {};
