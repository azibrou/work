import { useState } from 'react'
import MghCard from './components/home-cards/MghCard.jsx'
import RobotDeliveryCard from './components/home-cards/RobotDeliveryCard.jsx'
import FitbitRewardsCard from './components/home-cards/FitbitRewardsCard.jsx'
import FitbitEngagementCard from './components/home-cards/FitbitEngagementCard.jsx'
import YandexCard from './components/home-cards/YandexCard.jsx'
import GroceryRevampCard from './components/home-cards/GroceryRevampCard.jsx'

const SECTIONS = ['Doing', 'Writing', 'Exploring']

function App() {
  const [section, setSection] = useState('Doing')

  return (
    <div className="main-container">
      <nav className="top-menu" aria-label="Sections">
        {SECTIONS.map((name) => (
          <button
            key={name}
            type="button"
            className={`top-menu-item${name === section ? ' is-active' : ''}`}
            aria-current={name === section ? 'page' : undefined}
            onClick={() => setSection(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <div className="memo">
        <h1>Product design portfolio</h1>
      </div>
      {section === 'Doing' && (
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
      )}
    </div>
  )
}

export default App
