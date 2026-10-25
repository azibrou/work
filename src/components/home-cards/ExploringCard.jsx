import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

// A plain white card: headline, description and button, no artwork.
// Settings come from cards.json, edited in Storybook under Exploring cards.
export default function ExploringCard({ cardId, ...props }) {
  return <HomeCardShell variant="plain" bgDuration="150ms" {...cards[cardId]} {...props} />;
}
