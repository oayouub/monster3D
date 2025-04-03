"use client";

import "./globals.css";
import ThreeScene from "./components/ThreeScene";
import GameManager from "./components/GameManager";
import React, { useState, useRef } from "react";

export default function Home() {
  const [currentAnimation, setCurrentAnimation] = useState<"idle" | "left" | "up" | "down" | "right" | "miss">("idle");
  const [sceneLoaded, setSceneLoaded] = useState(false);

  const musicRef = useRef<HTMLAudioElement>(null);
  const hitRef = useRef<HTMLAudioElement>(null);
  const bonusRef = useRef<HTMLAudioElement>(null);
  const gameOverRef = useRef<HTMLAudioElement>(null);

  const handleScore = (direction: typeof currentAnimation) => {
    setCurrentAnimation(direction);
    if (direction !== "miss") {
      hitRef.current?.play().catch((e) => console.warn("hit sound error", e));
      setTimeout(() => {
        bonusRef.current?.play().catch((e) => console.warn("bonus sound error", e));
      }, 150);
    }
  };

  const handleGameStart = () => {
    const audio = musicRef.current;
    if (audio) {
      audio.volume = 0.5;
      audio.loop = true;
      audio.play().catch((e) => console.warn("music play error", e));
    }
  };

  const handleGameOver = () => {
    musicRef.current?.pause();
    musicRef.current!.currentTime = 0;
    gameOverRef.current?.play().catch((e) => console.warn("game over sound error", e));
  };

  return (
    <div className="main">
      <audio ref={musicRef} src="/music/musique.mp3" />
      <audio ref={hitRef} src="/music/correct.mp3" />
      <audio ref={bonusRef} src="/music/foule.mp3" />
      <audio ref={gameOverRef} src="/music/loose.mp3" />

      {sceneLoaded && (
        <div className="game-zone">
          <GameManager onScore={handleScore} onStartGame={handleGameStart} onGameOver={handleGameOver} />
        </div>
      )}

      <div className="scene">
        <ThreeScene currentAnimation={currentAnimation} onLoaded={() => setSceneLoaded(true)} />
      </div>
    </div>
  );
}
