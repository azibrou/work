import YandexCard from './YandexCard';
import CardSetup from './CardSetup';

const meta = {
  title: 'Home cards/Yandex',
  component: YandexCard,
  parameters: { layout: 'padded' },
  render: () => <CardSetup cardId="yandex" Card={YandexCard} />,
};

export default meta;

export const Setup = {};
