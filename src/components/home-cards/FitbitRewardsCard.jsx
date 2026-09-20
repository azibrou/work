import fitbitRewardsImage from '../../images/fitbit-rewards.png';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

export default function FitbitRewardsCard(props) {
  return (
    <HomeCardShell variant="fitbit-rewards" bgDuration="1000ms" {...cards.fitbitRewards} {...props}>
      <img className="home-card__image" src={fitbitRewardsImage} alt="Fitbit rewards" />
    </HomeCardShell>
  );
}
