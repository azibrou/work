import mghA from '../../images/mgh01.svg';
import mghB from '../../images/mgh02.svg';
import mghC from '../../images/mgh03.svg';
import mghD from '../../images/mgh04.svg';
import mghE from '../../images/mgh05.svg';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

export default function MghCard(props) {
  return (
    <HomeCardShell variant="mgh" bgDuration="150ms" {...cards.mgh} {...props}>
      <img className="home-card__image home-card__image--a" src={mghA} alt="" />
      <img className="home-card__image home-card__image--b" src={mghB} alt="" />
      <img className="home-card__image home-card__image--c" src={mghC} alt="" />
      <img className="home-card__image home-card__image--d" src={mghD} alt="" />
      <img className="home-card__image home-card__image--e" src={mghE} alt="" />
    </HomeCardShell>
  );
}
