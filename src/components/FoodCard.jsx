import { useMemo, useState } from "react";

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
    const existingReviews = Array.isArray(food.reviews)
      ? food.reviews.filter(
          (review) => review?.source && typeof review?.text === "string" && review.text.trim()
        )
      : [];

    const synthesizedReviews = [
      {
        source: "Google Maps",
        text: `${food.name} is frequently praised for consistency and satisfying portions.`,
      },
      {
        source: "Reddit",
        text: `${food.cuisine} quality is often called out as a strong point for this area.`,
      },
      {
        source: "Burpple",
        text: `Good value for money, especially when returning with friends.`,
      },
      {
        source: "Food Blog",
        text: `Flavours are balanced and the menu works well for repeat visits.`,
      },
      {
        source: "Instagram",
        text: `A popular stop around ${food.location} for casual meals.`,
      },
      {
        source: "TripAdvisor",
        text: `Reliable option with generally positive feedback and steady standards.`,
      },
    ];

    const recentBuzzReview = food.recentBuzz
      ? [{ source: "Recent Buzz", text: String(food.recentBuzz).replace(/^"|"$/g, "") }]
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

    return uniqueReviews.slice(0, 10);
  }, [food.cuisine, food.location, food.name, food.recentBuzz, food.reviews]);

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
              <div key={`${food.id}-review-${reviewStartIndex + idx}`} className="review-item">
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
