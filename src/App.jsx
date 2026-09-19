import robotImage from './images/robot.png'
import mghAa from './images/mgh01.svg'
import mghBb from './images/mgh02.svg'
import mghCc from './images/mgh03.svg'
import mghDd from './images/mgh04.svg'
import mghEe from './images/mgh05.svg'
import mghLogo from './images/mhg.svg'
import fitbitRewardsImage from './images/fitbit-rewards.png'
import fitbitEngagementImage from './images/fitbit-engagement.png'
import yandexImage from './images/yandex.png'
import yandexLogo from './images/yandex.svg'
import GroceryRevampTile from './GroceryRevampTile.jsx'

function RobotDeliveryTile() {
  return (
    <div className="tile basic-tile robot-delivery">
      <img className="tile-image" src={robotImage} alt="Robot delivery" />
      <div className="basic-product-details">
        <h3>Robot delivery</h3>
        <p>Designing an autonomous delivery experience.</p>
        <a href="#">View case study</a>
      </div>
    </div>
  )
}

function MghTile() {
  return (
    <div className="tile vertical-tile mgh">
      <img className="tile-image aa" src={mghAa} alt="" />
      <img className="tile-image bb" src={mghBb} alt="" />
      <img className="tile-image cc" src={mghCc} alt="" />
      <img className="tile-image dd" src={mghDd} alt="" />
      <img className="tile-image ee" src={mghEe} alt="" />
      <div className="basic-product-details-top">
        <img src={mghLogo} alt="MGH" width={40} height={40} />
        <h3>MGH</h3>
        <p>Building a patient-first digital experience for Mass General Hospital.</p>
        <a href="#">View case study</a>
      </div>
    </div>
  )
}

function FitbitRewardsTile() {
  return (
    <div className="tile basic-tile fitbit-rewards">
      <img className="tile-image" src={fitbitRewardsImage} alt="Fitbit rewards" />
      <div className="basic-product-details">
        <h3>Fitbit rewards</h3>
        <p>Motivating healthy habits through a rewards program.</p>
        <a href="#">View case study</a>
      </div>
    </div>
  )
}

function FitbitEngagementTile() {
  return (
    <div className="tile basic-tile fitbit-engagement">
      <img className="tile-image" src={fitbitEngagementImage} alt="Fitbit engagement" />
      <div className="basic-product-details">
        <h3>Fitbit engagement</h3>
        <p>Increasing daily active engagement across the Fitbit app.</p>
        <a href="#">View case study</a>
      </div>
    </div>
  )
}

function YandexTile() {
  return (
    <div className="tile basic-tile yandex">
      <img className="tile-image" src={yandexImage} alt="Yandex" />
      <img className="cover-image" src={yandexLogo} alt="" />
      <div className="basic-product-details-top">
        <h3>Yandex</h3>
        <p>Reimagining search and discovery for Yandex.</p>
        <a href="#">View case study</a>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="main-container">
      <div className="memo">
        <h1>Product design portfolio</h1>
      </div>
      <div className="tiles">
        <MghTile />
        <div className="stack">
          <RobotDeliveryTile />
          <FitbitRewardsTile />
        </div>
        <div className="stack">
          <FitbitEngagementTile />
          <YandexTile />
        </div>
        <GroceryRevampTile />
      </div>
    </div>
  )
}

export default App
