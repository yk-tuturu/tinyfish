import { useState, useEffect } from "react";
import FoodCard from "./FoodCard";
import UncleBot from "./UncleBot";

export default function RouletteView({ result }) {
  const [isSpinning, setIsSpinning] = useState(true);

  useEffect(() => {
    // Spin for 2 seconds then stop
    const timer = setTimeout(() => {
      setIsSpinning(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="roulette-view">
      <div className="roulette-header">
        <h2>Uncle Bot's Secret Roulette Pick!</h2>
        <p className="roulette-subheader">
          Confirm 100% shiok, no joke lah!
        </p>
      </div>

      <div className={`roulette-spinner ${isSpinning ? "spinning" : ""}`}>
        {isSpinning ? (
          <div className="spinner-content">
            <div className="spinner-uncle">
              <UncleBot size="lg" />
            </div>
            <p className="spinner-text">Uncle is deciding...</p>
          </div>
        ) : (
          <div className="spinner-reveal">
            <FoodCard food={result} rank="🎰" />
          </div>
        )}
      </div>

      {!isSpinning && (
        <div className="roulette-message">
          <p className="message-text">
            This is Uncle's personal recommendation lah! <br />
            Cannot go wrong, I guarantee!
          </p>
        </div>
      )}
    </div>
  );
}
