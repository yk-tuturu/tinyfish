import { useEffect, useMemo, useState } from "react";

const FALLBACK_LOCATIONS = [
  {
    name: "UTown",
    address: "36 College Ave E, Singapore 138600",
    lat: 1.3049,
    lng: 103.7737,
  },
  {
    name: "NUS Kent Ridge",
    address: "21 Lower Kent Ridge Rd, Singapore 119077",
    lat: 1.2966,
    lng: 103.7764,
  },
  {
    name: "Clementi",
    address: "Clementi Ave 3, Singapore 120443",
    lat: 1.3151,
    lng: 103.7649,
  },
  {
    name: "Woodlands",
    address: "900 South Woodlands Dr, Singapore 730900",
    lat: 1.436,
    lng: 103.7866,
  },
];

const formatSuggestion = (location) => `${location.name} ${location.address}`;

const mapOneMapResult = (item) => {
  const name = item.SEARCHVAL?.trim() || item.BUILDING?.trim() || "Address";
  const rawAddress = item.ADDRESS?.trim() || [item.BLK_NO, item.ROAD_NAME].filter(Boolean).join(" ").trim();
  const postal = item.POSTAL?.trim();
  const hasPostal = postal && rawAddress.includes(postal);
  const address = postal
    ? hasPostal
      ? `${rawAddress}, Singapore`
      : `${rawAddress}, Singapore ${postal}`
    : `${rawAddress}, Singapore`;

  return {
    name,
    address,
    lat: Number(item.LATITUDE),
    lng: Number(item.LONGITUDE),
  };
};

export default function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState("any");
  const [dietary, setDietary] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const dietaryOptions = ["vegan", "vegetarian", "halal", "gluten-free"];

  const toggleDietary = (option) => {
    setDietary((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const fallbackSuggestions = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return [];
    }

    return FALLBACK_LOCATIONS.filter((location) => {
      const displayText = formatSuggestion(location).toLowerCase();
      return displayText.includes(trimmedQuery);
    }).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setApiSuggestions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsSuggestionsLoading(true);

        const params = new URLSearchParams({
          searchVal: trimmedQuery,
          returnGeom: "Y",
          getAddrDetails: "Y",
          pageNum: "1",
        });

        const response = await fetch(
          `https://www.onemap.gov.sg/api/common/elastic/search?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Address lookup failed");
        }

        const data = await response.json();
        const mapped = (data.results || [])
          .map(mapOneMapResult)
          .filter(
            (item) => Number.isFinite(item.lat) && Number.isFinite(item.lng) && item.address.length > 0
          );

        const deduped = [];
        const seen = new Set();

        for (const item of mapped) {
          const key = `${item.name}|${item.address}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(item);
          }
          if (deduped.length >= 8) {
            break;
          }
        }

        setApiSuggestions(deduped);
      } catch (error) {
        if (error.name !== "AbortError") {
          setApiSuggestions([]);
        }
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query]);

  const filteredSuggestions = apiSuggestions.length > 0 ? apiSuggestions : fallbackSuggestions;

  const resolveLocationFromQuery = () => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return null;
    }

    const exact = filteredSuggestions.find((location) => {
      const fullText = formatSuggestion(location).toLowerCase();
      return fullText === trimmedQuery;
    });
    if (exact) {
      return exact;
    }

    return filteredSuggestions[0] || null;
  };

  const handleSearch = (mode, locationOverride = null) => {
    const resolvedLocation = locationOverride || selectedLocation || resolveLocationFromQuery();

    if (query.trim()) {
      onSearch({
        query: query.trim(),
        budget,
        dietary,
        mode,
        selectedLocation: resolvedLocation,
      });
    }
  };

  const handleSuggestionSelect = (location) => {
    setQuery(formatSuggestion(location));
    setSelectedLocation(location);
    setShowSuggestions(false);
  };

  return (
    <div className="search-bar">
      <div className="search-input-group">
        <input
          type="text"
          placeholder="Type any Singapore address, e.g. UTown"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedLocation(null);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const firstSuggestion = filteredSuggestions[0] || null;
              handleSearch("recommend", firstSuggestion);
            }
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => setShowSuggestions(false), 120);
          }}
          disabled={isLoading}
          className={`search-input ${isFocused ? "focused" : ""}`}
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="location-suggestions">
            {filteredSuggestions.map((location) => (
              <button
                key={`${location.name}-${location.address}`}
                type="button"
                className="location-suggestion-item"
                onMouseDown={() => handleSuggestionSelect(location)}
                disabled={isLoading}
              >
                <span className="location-suggestion-title">{location.name}</span>
                <span className="location-suggestion-address">{location.address}</span>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && isSuggestionsLoading && (
          <div className="location-suggestions location-suggestions-status">Searching Singapore addresses…</div>
        )}
      </div>

      <div className="budget-selector">
        <label className="budget-label">Budget:</label>
        <div className="budget-options">
          {["cheap", "medium", "high", "any"].map((option) => (
            <button
              key={option}
              className={`budget-btn ${budget === option ? "active" : ""}`}
              onClick={() => setBudget(option)}
              disabled={isLoading}
            >
              {option === "cheap"
                ? "💰 Cheap ($)"
                : option === "medium"
                  ? "💵 Medium ($$)"
                  : option === "high"
                    ? "🔥 High ($$+)"
                    : "💳 Any"}
            </button>
          ))}
        </div>
      </div>

      <div className="dietary-selector">
        <label className="dietary-label">Dietary Preferences:</label>
        <div className="dietary-options">
          {dietaryOptions.map((option) => (
            <button
              key={option}
              className={`dietary-btn ${
                dietary.includes(option) ? "active" : ""
              }`}
              onClick={() => toggleDietary(option)}
              disabled={isLoading}
            >
              {option === "vegan"
                ? "🥬 Vegan"
                : option === "vegetarian"
                  ? "🥗 Vegetarian"
                  : option === "halal"
                    ? "🌙 Halal"
                    : "🌾 Gluten-Free"}
            </button>
          ))}
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={() => handleSearch("recommend")}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? "⏳ Searching..." : "🔮 Ask the Oracle"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleSearch("roulette")}
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? "⏳ Spinning..." : "🎰 Food Roulette"}
        </button>
      </div>
    </div>
  );
}
