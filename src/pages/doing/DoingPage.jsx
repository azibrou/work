import MghCard from '../../components/home-cards/MghCard.jsx';
import RobotDeliveryCard from '../../components/home-cards/RobotDeliveryCard.jsx';
import FitbitRewardsCard from '../../components/home-cards/FitbitRewardsCard.jsx';
import FitbitEngagementCard from '../../components/home-cards/FitbitEngagementCard.jsx';
import YandexCard from '../../components/home-cards/YandexCard.jsx';
import GroceryRevampCard from '../../components/home-cards/GroceryRevampCard.jsx';
import ProjectSections from '../../components/sections/ProjectSections.jsx';
import { PageMemo } from '../../components/memo/Memo.jsx';

// The Doing page: its memo, the project tiles, then the project sections.
export default function DoingPage() {
  return (
    <>
      <PageMemo pageId="doing" />
      <div className="tiles">
        <MghCard />
        <div className="stack">
          <RobotDeliveryCard />
          <FitbitRewardsCard />
        </div>
        <FitbitEngagementCard />
        <YandexCard />
        <div className="tiles-wide">
          <GroceryRevampCard />
        </div>
      </div>
      <ProjectSections />
    </>
  );
}
