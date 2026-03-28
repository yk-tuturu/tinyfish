import { useState } from "react";
import SearchBar from "./components/SearchBar";
import ResultsList from "./components/ResultsList";
import MapView from "./components/MapView";
import RouletteView from "./components/RouletteView";
import LoadingStates from "./components/LoadingStates";
import Footer from "./components/Footer";
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

function toDisplayConfidence(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "high") return "High";
  if (normalized === "medium") return "Medium";
  return "Low";
}

function normalizeReviews(item) {
  if (Array.isArray(item.topReviews)) {
    return item.topReviews
      .map((review) => {
        if (typeof review === "string") {
          return { source: "Review", text: review, sentiment: "mixed" };
        }

        const text =
          typeof review?.text === "string"
            ? review.text
            : typeof review?.review === "string"
              ? review.review
              : "";

        if (!text.trim()) return null;

        return {
          source: review?.source || "Review",
          text,
          sentiment: review?.sentiment || "mixed",
        };
      })
      .filter(Boolean);
  }

  if (Array.isArray(item.reviews)) {
    return item.reviews
      .map((review) => {
        if (typeof review === "string") {
          return { source: "Review", text: review, sentiment: "mixed" };
        }

        const text =
          typeof review?.text === "string"
            ? review.text
            : typeof review?.review === "string"
              ? review.review
              : "";

        if (!text.trim()) return null;

        return {
          source: review?.source || "Review",
          text,
          sentiment: review?.sentiment || "mixed",
        };
      })
      .filter(Boolean);
  }

  return [];
}

function normalizeRecommendation(item, fallbackId) {
  return {
    id: item.id ?? fallbackId,
    name: item.name || "Unknown Stall",
    location: item.location || item.address || "Unknown",
    cuisine: item.cuisine || "Unknown",
    price: item.price || "$$",
    rating: typeof item.rating === "number" ? item.rating : 0,
    reviewCount: typeof item.reviewCount === "number" ? item.reviewCount : 0,
    ratingText:
      item.ratingText ||
      (typeof item.rating === "number"
        ? `${item.rating.toFixed(1)} stars by ${item.reviewCount || 0} reviews`
        : "No ratings yet"),
    whyPicked: item.why || item.whyPicked || item.summary || "",
    summary: item.summary || "",
    confidence: toDisplayConfidence(item.confidence),
    sourceCount: typeof item.sourceCount === "number" ? item.sourceCount : 1,
    locationSource: item.source || "aggregated",
    lat: typeof item.lat === "number" ? item.lat : null,
    lng: typeof item.lng === "number" ? item.lng : null,
    mapUrl: item.sourceUrl || item.mapUrl || null,
    recentBuzz: item.recentBuzz || null,
    reviews: normalizeReviews(item),
    dietaryCriteria: Array.isArray(item.dietaryCriteria) && item.dietaryCriteria.length > 0
      ? item.dietaryCriteria
      : ["Unknown"],
  };
}

async function fetchRecommendations({ query, budget, mode, dietary, selectedLocation }) {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, budget, mode, dietary, selectedLocation }),
  });

  const rawResponseText = await response.text();
  console.log("[raw /api/recommend response]", rawResponseText);

  if (!response.ok) {
    throw new Error(rawResponseText || `Request failed with status ${response.status}`);
  }

  try {
    return JSON.parse(rawResponseText);
  } catch {
    throw new Error("API returned non-JSON response");
  }
}

function App() {
  const [results, setResults] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [rouletteResult, setRouletteResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});

  const handleSearch = async ({ query, budget, dietary, mode, selectedLocation }) => {
    setIsLoading(true);
    setError(null);
    setShowRoulette(false);
    setResults([]);
    setSearchedLocation(null);
    setSearchFilters({ query, budget, dietary });

    try {
      const apiData = await fetchRecommendations({
        query,
        budget,
        mode,
        dietary,
        selectedLocation,
      });
      const rawRecommendations = Array.isArray(apiData?.recommendations)
        ? apiData.recommendations
        : [];
      const normalizedRecommendations = rawRecommendations.map((item, idx) =>
        normalizeRecommendation(item, idx + 1)
      );

      const locationLat = selectedLocation?.lat;
      const locationLng = selectedLocation?.lng;

      if (typeof locationLat === "number" && typeof locationLng === "number") {
        setSearchedLocation(selectedLocation);
      }

      const resultsWithDistance = normalizedRecommendations.map((result) => {
        if (
          typeof locationLat !== "number" ||
          typeof locationLng !== "number" ||
          typeof result.lat !== "number" ||
          typeof result.lng !== "number"
        ) {
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
          ? [...resultsWithDistance].sort((a, b) => {
              const distanceA = typeof a.distance === "number" ? a.distance : Number.POSITIVE_INFINITY;
              const distanceB = typeof b.distance === "number" ? b.distance : Number.POSITIVE_INFINITY;
              return distanceA - distanceB;
            })
          : resultsWithDistance;

      if (mode === "roulette") {
        const rouletteRaw = apiData?.roulettePick || sortedByDistance[0] || null;

        if (!rouletteRaw) {
          setShowRoulette(false);
          setRouletteResult(null);
          setError("No roulette options found for this query. Try another one.");
          return;
        }

        const rouletteNormalized = normalizeRecommendation(
          rouletteRaw,
          rouletteRaw.id || 9999
        );

        if (
          typeof locationLat === "number" &&
          typeof locationLng === "number" &&
          typeof rouletteNormalized.lat === "number" &&
          typeof rouletteNormalized.lng === "number"
        ) {
          const computedDistance = calculateDistanceKm(
            locationLat,
            locationLng,
            rouletteNormalized.lat,
            rouletteNormalized.lng
          );
          rouletteNormalized.distance = Number(computedDistance.toFixed(1));
        }

        setRouletteResult(rouletteNormalized);
        setShowRoulette(true);
      } else {
        setResults(sortedByDistance);
        if (sortedByDistance.length > 0) {
          setSelectedMapId(sortedByDistance[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Backend request failed. Ensure API server is running on port 3001.");
    } finally {
      setIsLoading(false);
    }
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
