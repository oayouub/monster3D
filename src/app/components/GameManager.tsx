"use client";

import React, { useState, useEffect, useRef } from "react";

type ArrowDirection = "left" | "up" | "down" | "right";
type AnimationType = ArrowDirection | "miss";

interface Arrow {
  id: number;
  direction: ArrowDirection;
  y: number;
}

interface GameManagerProps {
  onScore: (direction: AnimationType) => void;
  onStartGame?: () => void;
  onGameOver?: () => void;
}

const arrowIcons: Record<ArrowDirection, string> = {
  left: "←",
  up: "↑",
  down: "↓",
  right: "→",
};

const GameManager: React.FC<GameManagerProps> = ({ onScore, onStartGame, onGameOver }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const arrowIdRef = useRef(0);

  const arrowSpeed = 2;
  const spawnInterval = 1000;
  const updateInterval = 16;
  const hitZoneTop = 300;
  const hitZoneBottom = 350;

  const startGame = () => {
    setScore(0);
    setErrors(0);
    setArrows([]);
    setGameOver(false);
    arrowIdRef.current = 0;
    setGameStarted(true);

    if (onStartGame) onStartGame();
  };

  const spawnArrow = () => {
    const directions: ArrowDirection[] = ["left", "up", "down", "right"];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    const newArrow: Arrow = {
      id: arrowIdRef.current++,
      direction: randomDirection,
      y: 0,
    };
    setArrows((prev) => [...prev, newArrow]);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(() => {
      setArrows((prev) =>
        prev.map((arrow) => ({
          ...arrow,
          y: arrow.y + arrowSpeed,
        }))
      );
    }, updateInterval);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const interval = setInterval(spawnArrow, spawnInterval);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      let direction: ArrowDirection | "miss" | null = null;
      if (e.key === "ArrowLeft") direction = "left";
      else if (e.key === "ArrowRight") direction = "right";
      else if (e.key === "ArrowUp") direction = "up";
      else if (e.key === "ArrowDown") direction = "down";

      if (direction) {
        const hitIndex = arrows.findIndex(
          (arrow) =>
            arrow.direction === direction &&
            arrow.y >= hitZoneTop &&
            arrow.y <= hitZoneBottom
        );
        if (hitIndex !== -1) {
          setScore((prev) => prev + 10);
          setArrows((prev) => prev.filter((_, idx) => idx !== hitIndex));
          onScore(direction);
        } else {
          onScore("miss");
          setErrors((prev) => {
            const newErrors = prev + 1;
            if (newErrors >= 3) {
              setGameOver(true);
              if (onGameOver) onGameOver();
            }
            return newErrors;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameOver, arrows, onScore, onGameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const remainingArrows = arrows.filter((arrow) => arrow.y <= 400);
    if (remainingArrows.length !== arrows.length) {
      const missed = arrows.length - remainingArrows.length;
      setErrors((prev) => {
        const newErrors = prev + missed;
        if (newErrors >= 3) {
          setGameOver(true);
          if (onGameOver) onGameOver();
        }
        return newErrors;
      });
      setArrows(remainingArrows);
    }
  }, [gameStarted, gameOver, arrows, onGameOver]);

  return (
    <div style={{ fontFamily: "Monospace" }}>
      {!gameStarted ? (
        <div
          style={{
            width: "25vw",
            height: "25vw",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            onClick={startGame}
            style={{
              fontSize: "1.5rem",
              padding: "10px 50px",
              backgroundColor: "rgb(255, 185, 46)",
              borderRadius: "5px",
              boxShadow: "0 0 10px rgba(0,0,0,0.5)",
              cursor: "pointer",
            }}
          >
            Play
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", color: "white" }}>
            <p style={{ fontSize: "1.5rem" }}>Score : {score}</p>
            <p style={{ fontSize: "1.5rem" }}>Failed : {errors} / 3</p>
          </div>
          {gameOver && (
            <div style={{ textAlign: "center", padding: "10px" }}>
              <h2 style={{ color: "white" }}>GAME OVER</h2>
              <button
                onClick={startGame}
                style={{
                  fontSize: "1.5rem",
                  padding: "10px 50px",
                  backgroundColor: "rgb(255, 185, 46)",
                  borderRadius: "5px",
                  boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}
          <div
            style={{
              position: "relative",
              width: "400px",
              height: "500px",
              overflow: "hidden",
              margin: "20px auto",
              backdropFilter: "blur(5px)",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
            }}
          >
            {arrows.map((arrow) => (
              <div
                key={arrow.id}
                style={{
                  position: "absolute",
                  top: arrow.y,
                  left:
                    arrow.direction === "left"
                      ? "50px"
                      : arrow.direction === "up"
                      ? "150px"
                      : arrow.direction === "down"
                      ? "250px"
                      : "350px",
                  width: "30px",
                  height: "30px",
                  background:
                    arrow.direction === "left"
                      ? "yellow"
                      : arrow.direction === "up"
                      ? "green"
                      : arrow.direction === "down"
                      ? "pink"
                      : "red",
                  textAlign: "center",
                  lineHeight: "30px",
                  borderRadius: "4px",
                  fontSize: "1.5rem",
                }}
              >
                {arrowIcons[arrow.direction]}
              </div>
            ))}
            <div
              style={{
                position: "absolute",
                top: `${hitZoneTop}px`,
                left: 0,
                width: "100%",
                height: `${hitZoneBottom - hitZoneTop}px`,
                borderTop: "2px dashed green",
                backgroundColor: "rgba(0, 255, 0, 0.67)",
                borderBottom: "2px dashed green",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default GameManager;
