import { useRef } from 'react';
import groceryImage from '../../images/grocery.png';
import cartImage from '../../images/cart.png';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

export default function GroceryRevampCard(props) {
  const cardRef = useRef(null);
  const mainRef = useRef(null);
  const cartRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card || !mainRef.current || !cartRef.current) return;

    const rect = card.getBoundingClientRect();
    const moveX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const moveY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

    mainRef.current.style.transform = `translate(${moveX * 2}px, ${moveY * 2}px)`;
    cartRef.current.style.transform = `translate(${moveX * 5}px, ${moveY * 5}px)`;
  };

  const handleMouseLeave = () => {
    if (mainRef.current) mainRef.current.style.transform = 'translate(0, 0)';
    if (cartRef.current) cartRef.current.style.transform = 'translate(0, 0)';
  };

  return (
    <HomeCardShell
      ref={cardRef}
      variant="grocery"
      bgDuration="150ms"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...cards.groceryRevamp}
      {...props}
    >
      <img ref={mainRef} className="home-card__image home-card__image--main" src={groceryImage} alt="Grocery app revamp" />
      <img ref={cartRef} className="home-card__image home-card__image--cart" src={cartImage} alt="Cart interaction" />
    </HomeCardShell>
  );
}
