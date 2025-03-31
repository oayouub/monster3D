import "./globals.css";
import ThreeScene from "./components/ThreeScene";

export default function Home() {
  return (
    <div className="main">
      <div className="game-zone">section</div>
      <div className="scene"><ThreeScene /></div>
    </div>
  );
}
