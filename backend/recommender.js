import OpenAI from 'openai';

let openai = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  if (!openai) {
    openai = new OpenAI({ apiKey });
  }

  return openai;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function budgetMatches(priceSymbol, budget) {
  if (!budget || budget === 'any') return true;
  const priceLevel = String(priceSymbol || '$$').length;
  if (budget === 'cheap') return priceLevel <= 1;
  if (budget === 'medium') return priceLevel === 2;
  if (budget === 'high') return priceLevel >= 2;
  return true;
}

function dietaryMatches(item, dietaryFilters) {
  if (!Array.isArray(dietaryFilters) || dietaryFilters.length === 0) return true;
  const normalizedItemDietary = Array.isArray(item.dietaryCriteria)
    ? item.dietaryCriteria.map((entry) => normalizeText(entry))
    : [];
  return dietaryFilters.every((filter) =>
    normalizedItemDietary.includes(normalizeText(filter))
  );
}

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

function tokenizeQuery(query) {
  return normalizeText(query)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function confidenceToScore(confidence) {
  const c = String(confidence || '').toLowerCase();
  if (c === 'high') return 1;
  if (c === 'medium') return 0.65;
  return 0.35;
}

function toApiRecommendation(item) {
  return {
    name: item.name,
    location: item.location,
    lat: item.lat,
    lng: item.lng,
    cuisine: item.cuisine,
    price: item.price,
    rating: item.rating,
    ratingText: item.ratingText,
    reviewCount: item.reviewCount,
    source: item.locationSource || 'aggregated',
    confidence: String(item.confidence || 'Low').toLowerCase(),
    why: item.whyPicked || item.summary || 'Recommended based on available written reviews.',
    summary: item.summary || 'General sentiment is mixed based on available reviews.',
    topReviews: Array.isArray(item.reviews) ? item.reviews.slice(0, 6) : [],
    recentBuzz: item.recentBuzz || null,
    sourceUrl: item.mapUrl || null,
    dietaryCriteria: item.dietaryCriteria || ['Unknown'],
  };
}

function pickDiversifiedTop(candidates, count = 5) {
  const pool = [...candidates].slice(0, 15);
  const picks = [];

  while (picks.length < count && pool.length > 0) {
    const weighted = pool.map((item, index) => {
      const base = typeof item.compositeScore === 'number' ? item.compositeScore : 0.3;
      const rankBonus = Math.max(0, 1 - index / 20);
      return { item, weight: Math.max(0.001, base + rankBonus * 0.15) };
    });

    const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let target = Math.random() * totalWeight;
    let chosenIndex = 0;

    for (let i = 0; i < weighted.length; i += 1) {
      target -= weighted[i].weight;
      if (target <= 0) {
        chosenIndex = i;
        break;
      }
    }

    picks.push(weighted[chosenIndex].item);
    pool.splice(chosenIndex, 1);
  }

  return picks;
}

function deterministicRecommendations(query, budget, mode, foodData, options = {}) {
  const { selectedLocation = null, dietary = [] } = options;
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenizeQuery(query);

  const candidates = (Array.isArray(foodData) ? foodData : [])
    .filter((item) => budgetMatches(item.price, budget) && dietaryMatches(item, dietary))
    .map((item) => {
      const searchable = normalizeText(
        [
          item.name,
          item.location,
          item.cuisine,
          ...(Array.isArray(item.dishes) ? item.dishes : []),
          ...(Array.isArray(item.reviews) ? item.reviews.map((r) => r?.text || '') : []),
        ].join(' ')
      );

      const exactQueryHit = normalizedQuery ? searchable.includes(normalizedQuery) : true;
      const tokenMatches = queryTokens.reduce(
        (count, token) => (searchable.includes(token) ? count + 1 : count),
        0
      );
      const tokenCoverage = queryTokens.length > 0 ? tokenMatches / queryTokens.length : 0;
      const queryBoost = normalizedQuery
        ? Math.max(exactQueryHit ? 1 : 0, tokenCoverage)
        : 0;

      const ratingScore = typeof item.rating === 'number' ? item.rating / 5 : 0.4;
      const reviewVolumeScore = Math.min((item.reviewCount || 0) / 200, 1);
      const confidenceScore = confidenceToScore(item.confidence);
      const hasCoords =
        typeof item.lat === 'number' &&
        typeof item.lng === 'number' &&
        typeof selectedLocation?.lat === 'number' &&
        typeof selectedLocation?.lng === 'number';

      const distanceKm = hasCoords
        ? calculateDistanceKm(selectedLocation.lat, selectedLocation.lng, item.lat, item.lng)
        : null;
      const distanceScore =
        hasCoords && typeof distanceKm === 'number'
          ? Math.max(0, 1 - Math.min(distanceKm, 20) / 20)
          : 0;

      const locationWeight = hasCoords ? 0.65 : 0;
      const queryWeight = hasCoords ? 0.1 : 0.4;
      const ratingWeight = hasCoords ? 0.12 : 0.25;
      const reviewWeight = 0.08;
      const confidenceWeight = hasCoords ? 0.05 : 0.2;

      const tieBreakerJitter = Math.random() * 0.0001;

      const compositeScore =
        queryBoost * queryWeight +
        ratingScore * ratingWeight +
        reviewVolumeScore * reviewWeight +
        confidenceScore * confidenceWeight +
        distanceScore * locationWeight +
        tieBreakerJitter;

      return {
        ...item,
        queryHit: exactQueryHit || tokenCoverage > 0,
        distanceKm,
        hasCoords,
        compositeScore,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  const hasSelectedCoords =
    typeof selectedLocation?.lat === 'number' && typeof selectedLocation?.lng === 'number';

  let rankedCandidates = candidates;

  if (hasSelectedCoords) {
    const withDistance = candidates.filter(
      (item) => item.hasCoords && typeof item.distanceKm === 'number'
    );
    const noDistance = candidates.filter(
      (item) => !item.hasCoords || typeof item.distanceKm !== 'number'
    );

    const near8km = withDistance.filter((item) => item.distanceKm <= 8);
    const near15km = withDistance.filter((item) => item.distanceKm <= 15);

    const locationPool =
      near8km.length >= 5
        ? near8km
        : near15km.length >= 5
          ? near15km
          : withDistance;

    const locationSorted = [...locationPool].sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return b.compositeScore - a.compositeScore;
    });

    rankedCandidates = [...locationSorted, ...noDistance];
  }

  const fallbackCandidates = rankedCandidates.length > 0
    ? rankedCandidates
    : (Array.isArray(foodData) ? foodData : []).slice().sort((a, b) => {
        const scoreA = (typeof a.rating === 'number' ? a.rating : 0) + confidenceToScore(a.confidence);
        const scoreB = (typeof b.rating === 'number' ? b.rating : 0) + confidenceToScore(b.confidence);
        return scoreB - scoreA;
      });

  const topFive = pickDiversifiedTop(fallbackCandidates, 5).map(toApiRecommendation);

  const roulettePool = fallbackCandidates.slice(1, 8);
  const rouletteSource = roulettePool.length > 0 ? roulettePool : fallbackCandidates;
  const rouletteChoice = rouletteSource[Math.floor(Math.random() * Math.max(rouletteSource.length, 1))] || fallbackCandidates[0] || null;

  const summary = topFive.length > 0
    ? `Across current written reviews, ${topFive[0].name} and nearby options show the strongest momentum, with mixed but useful community feedback for comparison.`
    : 'No listings matched this search yet. Try a broader location or cuisine.';

  return {
    recommendations: topFive,
    roulettePick: rouletteChoice ? toApiRecommendation(rouletteChoice) : null,
    summary,
  };
}

export async function getRecommendations(query, budget, mode, foodData, options = {}) {
  const client = getOpenAIClient();

  if (!client) {
    return deterministicRecommendations(query, budget, mode, foodData, options);
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are Hawker Oracle, Singapore's smartest food recommendation AI.
You receive normalized listings merged from Google Maps, Reddit, and Burpple.

Your job:
1. Analyze the user's query to understand what they want (cuisine, location, vibe)
2. Prioritize entries with stronger written-review evidence and cross-source agreement
3. Use ratingText exactly as provided (e.g. "4.2 stars by 105 reviews")
4. Use confidence based on written review resources (do not invent confidence logic)
4. Consider budget: "cheap" = under $8, "medium" = $8-15, "any" = no filter
5. For review snippets, keep a MIXTURE: include positive and at least one critical/mixed point when available
6. Summary should be short and general (1 sentence)

Return JSON with this exact structure:
{
  "recommendations": [
    {
      "name": "string",
      "location": "string",
      "lat": number,
      "lng": number,
      "cuisine": "string",
      "price": "string (e.g. $4-6)",
      "rating": number,
      "ratingText": "string",
      "reviewCount": number,
      "source": "google_maps|reddit|burpple",
      "confidence": "high|medium",
      "why": "string (1-2 sentences, mention which sources agree)",
      "summary": "string (short general overview of review sentiment)",
      "topReviews": [
        {
          "source": "string",
          "sentiment": "positive|mixed|critical",
          "text": "string"
        }
      ],
      "recentBuzz": "string (a real quote or paraphrase from the data)",
      "sourceUrl": "string"
    }
  ],
  "roulettePick": { same format — pick the most surprising hidden gem },
  "summary": "string (2-3 sentences about the food scene in this area right now)"
}

Return exactly 5 recommendations ranked by relevance.
If mode is "roulette", make roulettePick something unexpected — not the top-rated place.`
        },
        {
          role: "user",
          content: `Query: ${query}
Budget: ${budget}
Mode: ${mode}
Selected location: ${JSON.stringify(options.selectedLocation || null)}
Dietary filters: ${JSON.stringify(options.dietary || [])}

Live scraped food data:
${JSON.stringify(foodData, null, 2)}`
        }
      ]
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI request failed, falling back to deterministic recommender:', error.message);
    return deterministicRecommendations(query, budget, mode, foodData, options);
  }
}
