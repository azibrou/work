import GroceryRevampCard from './GroceryRevampCard';
import CardSetup from './CardSetup';

const meta = {
  title: 'Home cards/Grocery revamp',
  component: GroceryRevampCard,
  parameters: { layout: 'padded' },
  render: () => <CardSetup cardId="groceryRevamp" Card={GroceryRevampCard} />,
};

export default meta;

export const Setup = {};
