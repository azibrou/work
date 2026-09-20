import yandexImage from '../../images/yandex.png';
import yandexDisc from '../../images/yandex.svg';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

export default function YandexCard(props) {
  return (
    <HomeCardShell variant="yandex" bgDuration="3000ms" {...cards.yandex} {...props}>
      <img className="home-card__image" src={yandexImage} alt="Yandex" />
      <img className="home-card__disc" src={yandexDisc} alt="" />
    </HomeCardShell>
  );
}
