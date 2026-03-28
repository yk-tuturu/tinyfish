import { useState, useMemo } from "react";
import FoodCard from "./FoodCard";

export default function ResultsList({
  results,
  selectedId,
  onSelectResult,
}) {
  const [sortBy, setSortBy] = useState("recommended");
  const [confidenceFilter, setConfidenceFilter] = useState("all");

  const sortedAndFilteredResults = useMemo(() => {
    let filtered = results;

    // Apply confidence filter
    if (confidenceFilter !== "all") {
      filtered = filtered.filter((food) => food.confidence === confidenceFilter);
    }

    // Apply sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "price-low":
        sorted.sort((a, b) => a.price.length - b.price.length);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price.length - a.price.length);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
       case "distance":
         sorted.sort((a, b) => a.distance - b.distance);
         break;
      case "recommended":
      default:
        // Keep original order
        break;
    }

    return sorted;
  }, [results, sortBy, confidenceFilter]);

  return (
    <div className="results-list">
      <div className="results-header">
        <h2>✨ Top Recommendations</h2>
        <p className="results-summary">
          Based on {sortedAndFilteredResults.length} recommendation{sortedAndFilteredResults.length !== 1 ? "s" : ""} from multiple sources
        </p>
      </div>

      <div className="results-controls">
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recommended">🔮 Recommended</option>
            <option value="rating">⭐ Highest Rating</option>
            <option value="reviews">👥 Most Reviewed</option>
            <option value="price-low">💰 Cheapest First</option>
            <option value="price-high">💎 Most Premium</option>
            <option value="name">🔤 Alphabetical</option>
             <option value="distance">📍 Closest First</option>
          </select>
        </div>

        <div className="filter-controls">
          <label htmlFor="confidence-filter">Confidence:</label>
          <select
            id="confidence-filter"
            className="filter-select"
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="High">🎯 High</option>
            <option value="Medium">⚡ Medium</option>
            <option value="Low">💡 Low</option>
          </select>
        </div>
      </div>

      <div className="cards-container">
        {sortedAndFilteredResults.length > 0 ? (
          sortedAndFilteredResults.map((food, idx) => (
            <div
              key={food.id}
              onClick={() => onSelectResult(food.id)}
              style={{
                cursor: "pointer",
                opacity: selectedId && selectedId !== food.id ? 0.6 : 1,
                transition: "opacity 0.3s ease",
                animation: `fadeInScale 0.4s ease-out ${idx * 0.05}s both`,
              }}
            >
              <FoodCard food={food} rank={idx + 1} />
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No restaurants match your filters. Try adjusting your criteria!</p>
          </div>
        )}
      </div>
    </div>
  );
}
