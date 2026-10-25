import BookShelf from '../../components/book-shelf/BookShelf.jsx';
import ExploringCard from '../../components/home-cards/ExploringCard.jsx';
import { EXPLORING_CARDS } from '../../components/home-cards/exploringCards.js';
import { PageMemo } from '../../components/memo/Memo.jsx';

// The Exploring page: its memo, the book shelf, then the white project cards.
export default function ExploringPage() {
  return (
    <>
      <PageMemo pageId="exploring" />
      <BookShelf />
      <div className="tiles tiles--after-shelf">
        {EXPLORING_CARDS.map((cardId) => (
          <ExploringCard key={cardId} cardId={cardId} />
        ))}
      </div>
    </>
  );
}
