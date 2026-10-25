import './book-shelf.css';

// A blank book cover: 320px tall, 1:1.618 (width:height), white with 16px corners.
// The title isn't drawn on the cover; screen readers still get it.
export default function BookCover({ title, as: Tag = 'div' }) {
  return (
    <Tag className="book-cover">
      <span className="book-shelf__sr-only">{title}</span>
    </Tag>
  );
}
