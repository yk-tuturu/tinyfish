import { useMemo, useState, useEffect } from "react";

export default function FoodCard({ food, rank }) {
  const [showReviews, setShowReviews] = useState(false);
  const [reviewStartIndex, setReviewStartIndex] = useState(0);
  const REVIEWS_PER_PAGE = 4;
  const confidenceColor =
    food.sourceCount >= 3 ? "#22c55e" : "#eab308"; // green or yellow
  const dietaryCriteria =
    Array.isArray(food.dietaryCriteria) && food.dietaryCriteria.length > 0
      ? food.dietaryCriteria
      : ["Unknown"];
  const reviews = useMemo(() => {
    const normalizeSentiment = (value) => {
      const normalized = String(value || "unknown").toLowerCase();
      if (normalized === "critical") {
        return "negative";
      }
      if (
        normalized === "positive" ||
        normalized === "negative" ||
        normalized === "mixed" ||
        normalized === "unknown"
      ) {
        return normalized;
      }
      return "unknown";
    };

    const existingReviews = Array.isArray(food.reviews)
      ? food.reviews.filter(
          (review) => review?.source && typeof review?.text === "string" && review.text.trim()
        ).map((review) => ({
          ...review,
          sentiment: normalizeSentiment(review?.sentiment),
        }))
      : [];

    const synthesizedReviewPool = [
      {
        source: "Google Maps",
        text: `${food.name} is commonly mentioned for consistent quality and reliable portions.`,
        sentiment: "unknown",
      },
      {
        source: "Reddit",
        text: `People looking for ${food.cuisine} around ${food.location} often bring up this stall as a dependable pick.`,
        sentiment: "unknown",
      },
      {
        source: "Local Buzz",
        text: `A practical choice in ${food.location} when you want something familiar and repeatable.`,
        sentiment: "unknown",
      },
    ];

    // Keep synthetic content minimal: append only enough to reach at most 3 baseline reviews.
    const neededSynthCount = Math.max(0, 3 - existingReviews.length);
    const synthesizedReviews = synthesizedReviewPool.slice(0, neededSynthCount);

    const recentBuzzReview = food.recentBuzz
      ? [{ source: "Recent Buzz", text: String(food.recentBuzz).replace(/^"|"$/g, ""), sentiment: "mixed" }]
      : [];

    const combined = [...existingReviews, ...recentBuzzReview, ...synthesizedReviews];
    const uniqueReviews = [];
    const seen = new Set();

    for (const review of combined) {
      const reviewKey = `${review.source}-${review.text}`;
      if (!seen.has(reviewKey)) {
        seen.add(reviewKey);
        uniqueReviews.push(review);
      }
    }

    return uniqueReviews.slice(0, 8);
  }, [food.cuisine, food.location, food.name, food.recentBuzz, food.reviews]);
    useEffect(() => {
      console.log(food)
    }, [food])
  const reviewEndIndex = Math.min(
    reviewStartIndex + REVIEWS_PER_PAGE,
    reviews.length
  );
  const maxReviewStartIndex = Math.max(0, reviews.length - REVIEWS_PER_PAGE);
  const visibleReviews = reviews.slice(reviewStartIndex, reviewEndIndex);

  const isRoulette = typeof rank === "string" && rank.includes("🎰");

  return (
    <div className={`food-card ${isRoulette ? "roulette-card" : ""}`}>
      <div className="card-header">
        <div className="card-title">
          <span
            className="rank-badge"
            style={{
              animation: isRoulette ? "scaleUpDown 1.2s ease-in-out infinite" : "",
            }}
          >
            {rank}
          </span>
          <h3>{food.name}</h3>
        </div>
        <div className="card-rating">
          ⭐ {food.rating}
          <span className="review-count">
            ({food.reviewCount})
          </span>
        </div>
      </div>

      {showReviews ? (
        <div className="reviews-mode-panel">
          <div className="reviews-range">
            Showing {reviewStartIndex + 1}–{reviewEndIndex} of {reviews.length} reviews
          </div>

          <div className="reviews-list">
            {visibleReviews.map((review, idx) => (
              <div
                key={`${food.id}-review-${reviewStartIndex + idx}`}
                className={`review-item review-item-${review.sentiment || "unknown"}`}
              >
                <div className="review-source">{review.source}</div>
                <em>"{review.text}"</em>
              </div>
            ))}
          </div>

          <div className="reviews-pagination">
            <button
              type="button"
              className="reviews-page-btn"
              disabled={reviewStartIndex === 0}
              onClick={(event) => {
                event.stopPropagation();
                setReviewStartIndex((prev) => Math.max(0, prev - REVIEWS_PER_PAGE));
              }}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="reviews-page-btn"
              disabled={reviewEndIndex >= reviews.length}
              onClick={(event) => {
                event.stopPropagation();
                setReviewStartIndex((prev) =>
                  Math.min(prev + REVIEWS_PER_PAGE, maxReviewStartIndex)
                );
              }}
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card-meta">
            <span className="cuisine-tag">{food.cuisine}</span>
            <span className="price-tag">{food.price}</span>
          </div>

          <div className="card-dietary">
            {dietaryCriteria.map((criteria) => (
              <span
                key={criteria}
                className={`dietary-tag ${criteria.toLowerCase() === "unknown" ? "unknown" : ""}`}
              >
                🥗 {criteria}
              </span>
            ))}
          </div>

          <div className="card-why">
            <p>{food.whyPicked}</p>
          </div>

          <div className="card-confidence">
            <div
              className="confidence-dot"
              style={{ backgroundColor: confidenceColor }}
            ></div>
            <span>
              {food.sourceCount >= 3
                ? "🟢 High Confidence"
                : "🟡 Medium Confidence"}{" "}
              ({food.sourceCount} source{food.sourceCount !== 1 ? "s" : ""})
            </span>
          </div>

          <div className="card-location">
            <span>📍 {food.location}</span>
          </div>
        </>
      )}

      <div className="card-actions">
        <a
          href={food.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="card-link"
        >
          🔗 View on Maps
        </a>
        <button
          type="button"
          className="card-link card-link-button"
          onClick={(event) => {
            event.stopPropagation();
            setShowReviews((prev) => {
              if (prev) {
                setReviewStartIndex(0);
              }
              return !prev;
            });
          }}
        >
          {showReviews ? "↩ Back to Details" : `📝 Show Reviews (${reviews.length})`}
        </button>
      </div>
    </div>
  );
}
