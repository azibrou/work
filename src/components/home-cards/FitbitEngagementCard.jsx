import fitbitEngagementImage from '../../images/fitbit-engagement.png';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

export default function FitbitEngagementCard(props) {
  return (
    <HomeCardShell variant="fitbit-engagement" bgDuration="3000ms" {...cards.fitbitEngagement} {...props}>
      <img className="home-card__image" src={fitbitEngagementImage} alt="Fitbit engagement" />
    </HomeCardShell>
  );
}
