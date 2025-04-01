'use client'
import "./globals.css"
import ThreeScene from "./components/ThreeScene"
import GameManager from "./components/GameManager"
import React, { useState } from "react"

export default function Home() {
  const [currentAnimation, setCurrentAnimation] = useState<"idle" | "left" | "up" | "down" | "right">("idle")
  const handleScore = (direction: "left" | "up" | "down" | "right") => {
    setCurrentAnimation(direction)
  }

  return (
    <div className="main">
      <div className="game-zone">
        <GameManager onScore={handleScore} />
      </div>
      <div className="scene">
        <ThreeScene currentAnimation={currentAnimation} />
      </div>
    </div>
  )
}
