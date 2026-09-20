import robotImage from '../../images/robot.png';
import HomeCardShell from './HomeCardShell';
import cards from './cards.json';

export default function RobotDeliveryCard(props) {
  return (
    <HomeCardShell variant="robot" bgDuration="150ms" {...cards.robotDelivery} {...props}>
      <img className="home-card__image" src={robotImage} alt="Robot delivery" />
    </HomeCardShell>
  );
}
