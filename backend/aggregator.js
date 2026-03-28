import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeName(value) {
  return normalizeText(value)
    .replace(/\b(stall|food|centre|center|market|hawker|kopitiam)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function scoreSentimentFromText(text = '') {
  const normalized = normalizeText(text);
  const positiveWords = [
    'good', 'great', 'best', 'nice', 'excellent', 'tasty', 'friendly', 'worth', 'recommend', 'amazing',
  ];
  const criticalWords = [
    'bad', 'worse', 'salty', 'slow', 'expensive', 'dry', 'overpriced', 'queue', 'not', 'small portion',
  ];

  let score = 0;
  for (const word of positiveWords) {
    if (normalized.includes(word)) score += 1;
  }
  for (const word of criticalWords) {
    if (normalized.includes(word)) score -= 1;
  }

  if (score >= 2) return 'positive';
  if (score <= -1) return 'critical';
  return 'mixed';
}

function sentimentFromRating(rating) {
  if (typeof rating !== 'number') return null;
  if (rating >= 4) return 'positive';
  if (rating <= 3.5) return 'critical';
  return 'mixed';
}

function loadBurppleData() {
  const dir = path.join(__dirname, 'results-enriched');
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
  const allStalls = [];

  for (const file of files) {
    const centreName = file
      .replace('result-', '')
      .replace('-enriched.json', '')
      .replace('.json', '')
      .replace(/_/g, ' ');

    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      const stalls = Array.isArray(data) ? data : [];

      for (const stall of stalls) {
        const googleReviews = Array.isArray(stall.google?.reviews) ? stall.google.reviews : [];
        const burppleReviews = Array.isArray(stall.reviews) ? stall.reviews : [];

        allStalls.push({
          id: `burpple-${centreName}-${stall.stall_name || 'unknown'}`,
          name: stall.stall_name || 'Unknown',
          normalizedName: normalizeName(stall.stall_name || 'Unknown'),
          centre: centreName,
          cuisine: stall.cuisine_type || 'Unknown',
          source: 'burpple+google',
          rating: typeof stall.google?.rating === 'number' ? stall.google.rating : null,
          google_review_count:
            typeof stall.google?.review_count === 'number' ? stall.google.review_count : 0,
          burpple_review_count:
            typeof stall.review_count === 'number' ? stall.review_count : burppleReviews.length,
          price_level: stall.google?.price_level ?? null,
          lat: stall.google_maps_details?.lat ?? stall.lat ?? null,
          lng: stall.google_maps_details?.lng ?? stall.lng ?? null,
          address:
            stall.google?.address ||
            stall.other_info?.address ||
            stall.contact_and_links?.address ||
            null,
          opening_hours: stall.google?.opening_hours || stall.other_info?.opening_hours || null,
          dishes: Array.isArray(stall.dishes) ? stall.dishes : [],
          burpple_reviews: burppleReviews,
          google_reviews: googleReviews,
          url: stall.url || stall.google?.maps_url || null,
          maps_url: stall.google?.maps_url || null,
        });
      }
    } catch (error) {
      console.error(`Failed to load ${file}:`, error.message);
    }
  }

  return allStalls;
}

function loadRedditData() {
  const filePath = path.join(__dirname, 'fixtures', 'reddit-results.json');
  if (!fs.existsSync(filePath)) return [];

  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const allMentions = [];

    for (const centreGroup of data) {
      for (const stall of centreGroup.stalls || []) {
        allMentions.push({
          name: stall.stall_name || 'Unknown',
          normalizedName: normalizeName(stall.stall_name || 'Unknown'),
          centre: centreGroup.centre || null,
          area: centreGroup.area || null,
          source: 'reddit',
          food_mentioned: stall.food_mentioned || null,
          sentiment: (stall.sentiment || '').toLowerCase() || null,
          quote: stall.quote || '',
          post_date: stall.post_date || null,
          post_url: stall.post_url || null,
        });
      }
    }

    return allMentions;
  } catch (error) {
    console.error('Failed to load Reddit data:', error.message);
    return [];
  }
}

function redditMatchesStall(stall, mention) {
  if (!mention?.normalizedName || !stall?.normalizedName) return false;

  const stallName = stall.normalizedName;
  const mentionName = mention.normalizedName;
  const nameMatch = stallName.includes(mentionName) || mentionName.includes(stallName);
  const centreMatch =
    mention.centre && stall.centre
      ? normalizeText(mention.centre).includes(normalizeText(stall.centre)) ||
        normalizeText(stall.centre).includes(normalizeText(mention.centre))
      : true;

  return nameMatch && centreMatch;
}

function buildReviewPool(stall, redditMentions) {
  const pool = [];

  for (const review of stall.google_reviews || []) {
    if (!review?.text) continue;

    pool.push({
      source: 'Google Maps',
      sourceType: 'google',
      author: review.author || null,
      rating: typeof review.rating === 'number' ? review.rating : null,
      text: review.text.trim(),
      sentiment: sentimentFromRating(review.rating) || scoreSentimentFromText(review.text),
      evidenceScore: 3 + (typeof review.rating === 'number' ? review.rating / 5 : 0),
    });
  }

  for (const review of stall.burpple_reviews || []) {
    if (!review) continue;
    const text = String(review).trim();
    if (!text) continue;

    pool.push({
      source: 'Burpple',
      sourceType: 'burpple',
      author: null,
      rating: null,
      text,
      sentiment: scoreSentimentFromText(text),
      evidenceScore: 2,
    });
  }

  for (const mention of redditMentions || []) {
    const text = String(mention.quote || mention.food_mentioned || '').trim();
    if (!text) continue;

    pool.push({
      source: 'Reddit',
      sourceType: 'reddit',
      author: null,
      rating: null,
      text,
      sentiment: mention.sentiment || scoreSentimentFromText(text),
      evidenceScore: 2.5,
      postDate: mention.post_date || null,
      postUrl: mention.post_url || null,
    });
  }

  return dedupeBy(pool, (review) => normalizeText(review.text));
}

function pickMixedTopReviews(reviewPool) {
  const positive = reviewPool
    .filter((review) => review.sentiment === 'positive')
    .sort((a, b) => b.evidenceScore - a.evidenceScore);
  const critical = reviewPool
    .filter((review) => review.sentiment === 'critical')
    .sort((a, b) => b.evidenceScore - a.evidenceScore);
  const mixed = reviewPool
    .filter((review) => review.sentiment === 'mixed')
    .sort((a, b) => b.evidenceScore - a.evidenceScore);

  const selected = [];
  if (positive[0]) selected.push(positive[0]);
  if (critical[0]) selected.push(critical[0]);
  if (mixed[0]) selected.push(mixed[0]);

  const remaining = [...positive.slice(1), ...critical.slice(1), ...mixed.slice(1)]
    .sort((a, b) => b.evidenceScore - a.evidenceScore);

  for (const review of remaining) {
    if (selected.length >= 6) break;
    selected.push(review);
  }

  return selected.slice(0, 6);
}

function buildSummary(topReviews, reviewPool) {
  if (reviewPool.length === 0) {
    return 'Limited written feedback available right now.';
  }

  const counts = reviewPool.reduce(
    (accumulator, review) => {
      accumulator[review.sentiment] = (accumulator[review.sentiment] || 0) + 1;
      return accumulator;
    },
    { positive: 0, mixed: 0, critical: 0 }
  );

  const topSnippet = topReviews[0]?.text ? topReviews[0].text.slice(0, 90) : null;
  const positiveLead = counts.positive >= counts.critical;

  if (positiveLead && counts.critical > 0) {
    return `Mostly positive feedback overall, with some criticism noted. ${topSnippet || ''}`.trim();
  }
  if (!positiveLead && counts.positive > 0) {
    return `Mixed sentiment: recurring concerns appear alongside notable positives. ${topSnippet || ''}`.trim();
  }

  return `General sentiment is ${positiveLead ? 'positive' : 'mixed'}, based on current written reviews.`;
}

function computeConfidence(stall, redditMentions, reviewPool) {
  const hasGoogleWritten = (stall.google_reviews || []).length > 0;
  const hasBurppleWritten = (stall.burpple_reviews || []).length > 0;
  const hasRedditWritten = (redditMentions || []).length > 0;
  const sourceCount = [hasGoogleWritten, hasBurppleWritten, hasRedditWritten].filter(Boolean).length;

  const allReviewTexts = reviewPool
    .map((review) => String(review?.text || '').trim())
    .filter(Boolean);

  const writtenResourceCount = allReviewTexts.length;
  const writtenCharCount = allReviewTexts.reduce((sum, text) => sum + text.length, 0);
  const writtenWordCount = allReviewTexts
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const pageEquivalent = writtenWordCount / 500;

  let confidence = 'Low';
  let confidenceScore = 0.35;

  if (
    (writtenWordCount >= 900 || writtenCharCount >= 5200 || pageEquivalent >= 1.8) &&
    writtenResourceCount >= 6
  ) {
    confidence = 'High';
    confidenceScore = 0.9;
  } else if (
    (writtenWordCount >= 350 || writtenCharCount >= 2000 || pageEquivalent >= 0.7) &&
    writtenResourceCount >= 3
  ) {
    confidence = 'Medium';
    confidenceScore = 0.65;
  }

  if (sourceCount >= 3 && confidence !== 'High') {
    confidence = confidence === 'Low' ? 'Medium' : confidence;
    confidenceScore = Math.max(confidenceScore, 0.65);
  }

  return {
    confidence,
    confidenceScore,
    sourceCount,
    writtenResourceCount,
    writtenWordCount,
    writtenCharCount,
    pageEquivalent: Number(pageEquivalent.toFixed(2)),
  };
}

function buildRating(stall) {
  const rating = typeof stall.rating === 'number' ? Number(stall.rating.toFixed(1)) : null;
  const ratingCount = Math.max(stall.google_review_count || 0, stall.burpple_review_count || 0);
  const ratingText =
    rating != null
      ? `${rating.toFixed(1)} stars by ${ratingCount} reviews`
      : ratingCount > 0
        ? `No star rating yet, ${ratingCount} written reviews`
        : 'No ratings yet';

  return { rating, ratingCount, ratingText };
}

function buildPriceLabel(priceLevel) {
  if (priceLevel == null) return '$$';
  if (priceLevel <= 1) return '$';
  if (priceLevel === 2) return '$$';
  return '$$$';
}

function inferDietaryCriteria(stall, reviewPool) {
  const textCorpus = normalizeText(
    [
      stall.cuisine,
      ...(Array.isArray(stall.dishes) ? stall.dishes : []),
      ...(reviewPool || []).map((review) => review?.text || ''),
    ].join(' ')
  );

  const hasAny = (keywords) => keywords.some((keyword) => textCorpus.includes(keyword));
  const tags = [];

  const halalKeywords = [
    'halal', 'muslim', 'mee rebus', 'mee soto', 'nasi lemak', 'gado gado', 'nasi rawon',
  ];
  const vegetarianKeywords = [
    'vegetarian', 'veg ', 'meat free', 'no meat', 'plant based',
  ];
  const veganKeywords = [
    'vegan', 'fully plant based', 'dairy free', 'egg free', '100 vegan',
  ];
  const glutenFreeKeywords = [
    'gluten free', 'rice noodles', 'bee hoon', 'kway teow', 'no wheat',
  ];

  if (hasAny(halalKeywords)) tags.push('Halal');
  if (hasAny(vegetarianKeywords)) tags.push('Vegetarian');
  if (hasAny(veganKeywords)) tags.push('Vegan');
  if (hasAny(glutenFreeKeywords)) tags.push('Gluten-Free');

  const deduped = [...new Set(tags)];
  return deduped.length > 0 ? deduped : ['Unknown'];
}

function toFrontendListing(stall, redditMentions, index) {
  const reviewPool = buildReviewPool(stall, redditMentions);
  const topReviews = pickMixedTopReviews(reviewPool);
  const summary = buildSummary(topReviews, reviewPool);
  const {
    confidence,
    confidenceScore,
    sourceCount,
    writtenResourceCount,
    writtenWordCount,
    writtenCharCount,
    pageEquivalent,
  } =
    computeConfidence(stall, redditMentions, reviewPool);
  const { rating, ratingCount, ratingText } = buildRating(stall);
  const dietaryCriteria = inferDietaryCriteria(stall, reviewPool);

  const recentBuzz = redditMentions.find((mention) => mention.quote)?.quote || topReviews[0]?.text || null;
  const mapUrl = stall.maps_url || stall.url || null;

  return {
    id: index + 1,
    canonical_id: stall.id,
    name: stall.name,
    location: stall.centre,
    address: stall.address,
    lat: stall.lat,
    lng: stall.lng,
    cuisine: stall.cuisine,
    price: buildPriceLabel(stall.price_level),
    rating,
    reviewCount: ratingCount,
    ratingText,
    confidence,
    confidenceScore,
    sourceCount,
    writtenReviewResources: writtenResourceCount,
    writtenWordCount,
    writtenCharCount,
    writtenPageEquivalent: pageEquivalent,
    whyPicked: summary,
    summary,
    recentBuzz,
    mapUrl,
    dietaryCriteria,
    dishes: stall.dishes,
    opening_hours: stall.opening_hours,
    reddit_mentions: redditMentions,
    reviews: topReviews.map((review) => ({
      source: review.source,
      sentiment: review.sentiment,
      rating: review.rating,
      text: review.text,
      postUrl: review.postUrl || null,
      postDate: review.postDate || null,
    })),
  };
}

export async function getFoodData(query) {
  const burpple = loadBurppleData();
  const reddit = loadRedditData();

  console.log(`Loaded ${burpple.length} Burpple/Google stalls + ${reddit.length} Reddit mentions`);

  const mergedListings = burpple.map((stall, index) => {
    const redditMentions = reddit.filter((mention) => redditMatchesStall(stall, mention));
    return toFrontendListing(stall, redditMentions, index);
  });

  const normalizedQuery = normalizeText(query || '');
  if (!normalizedQuery) {
    return mergedListings;
  }

  return mergedListings.filter((listing) => {
    const searchable = normalizeText(
      [listing.name, listing.location, listing.cuisine, ...(listing.dishes || [])].join(' ')
    );
    return searchable.includes(normalizedQuery);
  });
}