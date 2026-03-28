// Aggregator: loads pre-scraped data from Burpple (enriched with Google Maps) + Reddit

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadBurppleData() {
  const dir = path.join(__dirname, 'results-enriched');
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
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
        allStalls.push({
          name: stall.stall_name || 'Unknown',
          centre: centreName,
          cuisine: stall.cuisine_type || 'Unknown',
          source: 'burpple+google',
          rating: stall.google?.rating || null,
          google_review_count: stall.google?.review_count || null,
          burpple_review_count: stall.review_count || null,
          price_level: stall.google?.price_level || null,
          lat: stall.google_maps_details?.lat || stall.lat || null,
          lng: stall.google_maps_details?.lng || stall.lng || null,
          address: stall.google?.address || stall.other_info?.address || stall.contact_and_links?.address || null,
          opening_hours: stall.google?.opening_hours || stall.other_info?.opening_hours || null,
          dishes: stall.dishes || [],
          reviews: (stall.reviews || []).slice(0, 2),
          google_reviews: (stall.google?.reviews || []).slice(0, 2).map(r => r.text),
          url: stall.url || null
        });
      }
    } catch (err) {
      console.error(`Failed to load ${file}:`, err.message);
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

    for (const centre of data) {
      for (const stall of (centre.stalls || [])) {
        allMentions.push({
          name: stall.stall_name,
          centre: centre.centre,
          area: centre.area,
          source: 'reddit',
          food_mentioned: stall.food_mentioned,
          sentiment: stall.sentiment,
          quote: stall.quote,
          post_date: stall.post_date,
          post_url: stall.post_url
        });
      }
    }

    return allMentions;
  } catch (err) {
    console.error('Failed to load Reddit data:', err.message);
    return [];
  }
}

export async function getFoodData(query) {
  const burpple = loadBurppleData();
  const reddit = loadRedditData();

  console.log(`Loaded ${burpple.length} Burpple stalls + ${reddit.length} Reddit mentions`);

  // Merge: attach Reddit mentions to Burpple stalls where names match
  const merged = burpple.map(stall => {
    const redditMentions = reddit.filter(r =>
      stall.name.toLowerCase().includes(r.name.toLowerCase()) ||
      r.name.toLowerCase().includes(stall.name.toLowerCase().split('(')[0].trim())
    );

    return {
      ...stall,
      reddit_mentions: redditMentions.length > 0 ? redditMentions : [],
      cross_source: redditMentions.length > 0 ? 'high' : 'medium'
    };
  });

  // Also add Reddit-only stalls (not found in Burpple)
  const burppleNames = burpple.map(s => s.name.toLowerCase());
  const redditOnly = reddit.filter(r =>
    !burppleNames.some(name =>
      name.includes(r.name.toLowerCase()) ||
      r.name.toLowerCase().includes(name.split('(')[0].trim())
    )
  ).map(r => ({
    name: r.name,
    centre: r.centre,
    cuisine: 'Unknown',
    source: 'reddit',
    rating: null,
    lat: null,
    lng: null,
    dishes: [r.food_mentioned],
    reviews: [],
    google_reviews: [],
    reddit_mentions: [r],
    cross_source: 'reddit-only',
    quote: r.quote,
    area: r.area
  }));

  return [...merged, ...redditOnly];
}