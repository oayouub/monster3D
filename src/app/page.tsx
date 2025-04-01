import "./globals.css"
import ThreeScene from "./components/ThreeScene"
import GameManager from "./components/GameManager"

export default function Home() {
  return (
    <div className="main">
      <div className="game-zone"><GameManager /></div>
      <div className="scene"><ThreeScene /></div>
    </div>
  )
}
