import CardSetup from '../../components/home-cards/CardSetup.jsx';
import MghCard from '../../components/home-cards/MghCard.jsx';
import RobotDeliveryCard from '../../components/home-cards/RobotDeliveryCard.jsx';
import FitbitRewardsCard from '../../components/home-cards/FitbitRewardsCard.jsx';
import FitbitEngagementCard from '../../components/home-cards/FitbitEngagementCard.jsx';
import YandexCard from '../../components/home-cards/YandexCard.jsx';
import GroceryRevampCard from '../../components/home-cards/GroceryRevampCard.jsx';
import ExploringCard from '../../components/home-cards/ExploringCard.jsx';
import { EXPLORING_CARDS } from '../../components/home-cards/exploringCards.js';
import SectionsSetup from '../../components/sections/SectionsSetup.jsx';
import ShelfSetup from '../../components/book-shelf/ShelfSetup.jsx';
import BookCover from '../../components/book-shelf/BookCover.jsx';

// The setup story for every key in pageContent.js. The generated
// Components/Cards/<page> stories pick theirs from here. Each card's Apply
// writes its entry in cards.json (sections.json, shelf.json for those two).
const card = (cardId, Card) => () => <CardSetup cardId={cardId} Card={Card} />;

// Made once per card, so the preview isn't remounted on each edit.
const exploring = Object.fromEntries(
  EXPLORING_CARDS.map((cardId) => {
    const Card = (props) => <ExploringCard cardId={cardId} {...props} />;
    return [cardId, card(cardId, Card)];
  }),
);

const RENDERS = {
  mgh: card('mgh', MghCard),
  robotDelivery: card('robotDelivery', RobotDeliveryCard),
  fitbitRewards: card('fitbitRewards', FitbitRewardsCard),
  fitbitEngagement: card('fitbitEngagement', FitbitEngagementCard),
  yandex: card('yandex', YandexCard),
  groceryRevamp: card('groceryRevamp', GroceryRevampCard),
  sections: () => <SectionsSetup />,
  bookShelf: () => <ShelfSetup />,
  // One cover on its own: 320px tall, 1:1.618, white, 16px corners.
  bookCover: () => <BookCover title="Book" />,
  ...exploring,
};

export function cardStory(key) {
  const render = RENDERS[key];
  return { render: render ?? (() => <p>No setup for &quot;{key}&quot; in cardStories.jsx.</p>) };
}

export const CARD_STORY_KEYS = Object.keys(RENDERS);
