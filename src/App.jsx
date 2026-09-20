import MghCard from './components/home-cards/MghCard.jsx'
import RobotDeliveryCard from './components/home-cards/RobotDeliveryCard.jsx'
import FitbitRewardsCard from './components/home-cards/FitbitRewardsCard.jsx'
import FitbitEngagementCard from './components/home-cards/FitbitEngagementCard.jsx'
import YandexCard from './components/home-cards/YandexCard.jsx'
import GroceryRevampCard from './components/home-cards/GroceryRevampCard.jsx'

function App() {
  return (
    <div className="main-container">
      <div className="memo">
        <h1>Product design portfolio</h1>
      </div>
      <div className="tiles">
        <MghCard />
        <div className="stack">
          <RobotDeliveryCard />
          <FitbitRewardsCard />
        </div>
        <div className="stack">
          <FitbitEngagementCard />
          <YandexCard />
        </div>
        <div className="tiles-wide">
          <GroceryRevampCard />
        </div>
      </div>
    </div>
  )
}

export default App
