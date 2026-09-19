import { useRef } from 'react'
import groceryImage from './images/grocery.png'
import cartImage from './images/cart.png'

export default function GroceryRevampTile() {
  const tileRef = useRef(null)
  const image1Ref = useRef(null)
  const image2Ref = useRef(null)

  const handleMouseMove = (e) => {
    const tile = tileRef.current
    const image1 = image1Ref.current
    const image2 = image2Ref.current
    if (!tile || !image1 || !image2) return

    const rect = tile.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const moveX = (x - centerX) / centerX
    const moveY = (y - centerY) / centerY

    const parallax1X = moveX * 2
    const parallax1Y = moveY * 2

    const parallax2X = moveX * 5
    const parallax2Y = moveY * 5

    image1.style.transform = `translate(${parallax1X}px, ${parallax1Y}px)`
    image2.style.transform = `translate(${parallax2X}px, ${parallax2Y}px)`
  }

  const handleMouseLeave = () => {
    if (image1Ref.current) image1Ref.current.style.transform = 'translate(0, 0)'
    if (image2Ref.current) image2Ref.current.style.transform = 'translate(0, 0)'
  }

  return (
    <div
      ref={tileRef}
      className="tile landscape-tile grocery-revamp"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img ref={image1Ref} className="tile-image1" src={groceryImage} alt="Grocery app revamp" />
      <img ref={image2Ref} className="tile-image2" src={cartImage} alt="Cart interaction" />
      <div className="landscape-product-details-center">
        <h3>Grocery revamp</h3>
        <p>Redesigning the grocery shopping experience end to end.</p>
        <a href="#">View case study</a>
      </div>
    </div>
  )
}
