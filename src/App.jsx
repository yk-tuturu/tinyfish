import { useState, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import ResultsList from "./components/ResultsList";
import MapView from "./components/MapView";
import RouletteView from "./components/RouletteView";
import LoadingStates from "./components/LoadingStates";
import Footer from "./components/Footer";
import {
  mockResults,
} from "./mockData";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/animations.css";

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function matchesBudget(food, budget) {
  if (!budget || budget === "any") {
    return true;
  }

  const priceCount = food.price.length;
  if (budget === "cheap") {
    return priceCount === 1;
  }
  if (budget === "medium") {
    return priceCount === 2;
  }
  if (budget === "high") {
    return priceCount >= 2;
  }

  return true;
}

function matchesDietary(food, dietaryFilters) {
  if (!Array.isArray(dietaryFilters) || dietaryFilters.length === 0) {
    return true;
  }

  const normalizedCriteria = Array.isArray(food.dietaryCriteria)
    ? food.dietaryCriteria.map((criteria) => criteria.toLowerCase())
    : [];

  return dietaryFilters.every((filter) =>
    normalizedCriteria.includes(filter.toLowerCase())
  );
}

function pickRandomFood(candidates, excludeId = null) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const withoutExcluded =
    excludeId == null
      ? candidates
      : candidates.filter((item) => item.id !== excludeId);

  const source = withoutExcluded.length > 0 ? withoutExcluded : candidates;
  const index = Math.floor(Math.random() * source.length);
  return source[index];
}

function App() {
  const [results, setResults] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [lastRouletteId, setLastRouletteId] = useState(null);
  const [error, setError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});

  const handleSearch = ({ query, budget, dietary, mode, selectedLocation }) => {
    setIsLoading(true);
    setError(null);
    setShowRoulette(false);
    setResults([]);
    setSearchedLocation(null);
    setSearchFilters({ query, budget, dietary });

    // Simulate API delay (3-5 seconds)
    setTimeout(() => {
      try {
        if (mode === "roulette") {
          const filteredCandidates = mockResults.filter(
            (food) => matchesBudget(food, budget) && matchesDietary(food, dietary)
          );

          const randomPick = pickRandomFood(filteredCandidates, lastRouletteId);

          if (!randomPick) {
            setShowRoulette(false);
            setRouletteResult(null);
            setError("No roulette options match your current filters. Try broadening them.");
            return;
          }

          setRouletteResult(randomPick);
          setLastRouletteId(randomPick.id);
          setShowRoulette(true);
        } else {
          const locationLat = selectedLocation?.lat;
          const locationLng = selectedLocation?.lng;

          if (typeof locationLat === "number" && typeof locationLng === "number") {
            setSearchedLocation(selectedLocation);
          }

          const resultsWithDistance = mockResults.map((result) => {
            if (typeof locationLat !== "number" || typeof locationLng !== "number") {
              return result;
            }

            const computedDistance = calculateDistanceKm(
              locationLat,
              locationLng,
              result.lat,
              result.lng
            );

            return {
              ...result,
              distance: Number(computedDistance.toFixed(1)),
            };
          });

          const sortedByDistance =
            typeof locationLat === "number" && typeof locationLng === "number"
              ? [...resultsWithDistance].sort((a, b) => a.distance - b.distance)
              : resultsWithDistance;

          setResults(sortedByDistance);
          if (sortedByDistance.length > 0) {
            setSelectedMapId(sortedByDistance[0].id);
          }
        }
      } catch (err) {
        setError(
          "Oops! The food gods were silent. Try again?"
        );
      } finally {
        setIsLoading(false);
      }
    }, 3000);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-badge">Uncle Bot Recommends 👨‍🍳</div>
        <h1>Uncle Bot's Food Oracle</h1>
        <p>
          "Eh, let me tell you lah... I know ALL the best hawker spots!"
        </p>
      </header>

      <main className="app-main">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "2rem",
            }}
          >
            {error}
          </div>
        )}

        {isLoading && <LoadingStates />}

        {!isLoading && showRoulette && rouletteResult && (
          <RouletteView result={rouletteResult} />
        )}

        {!isLoading && !showRoulette && results.length > 0 && (
          <div className="content-container">
            <ResultsList
              results={results}
              selectedId={selectedMapId}
              onSelectResult={setSelectedMapId}
            />
            <MapView
              results={results}
              selectedId={selectedMapId}
              onSelectResult={setSelectedMapId}
              searchedLocation={searchedLocation}
            />
          </div>
        )}

        {!isLoading &&
          !showRoulette &&
          results.length === 0 &&
          !error && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              <p style={{ fontSize: "1.1rem" }}>
                �‍🍳 "Eh, don't be shy lah! Tell Uncle where you want to eat, I guarantee you find the best spot!" 🍜
              </p>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
