import 'dotenv/config';
import fs from 'fs';

function extractStalls(parsed) {
  if (Array.isArray(parsed)) {
    return { stalls: parsed, outputBuilder: enriched => enriched };
  }

  if (Array.isArray(parsed?.stalls)) {
    return {
      stalls: parsed.stalls,
      outputBuilder: enriched => ({ ...parsed, stalls: enriched }),
    };
  }

  if (Array.isArray(parsed?.result)) {
    return {
      stalls: parsed.result,
      outputBuilder: enriched => ({ ...parsed, result: enriched }),
    };
  }

  if (typeof parsed?.result === 'string') {
    const codeBlockMatch = parsed.result.match(/```json\s*([\s\S]*?)\s*```/i);
    const rawArrayText = codeBlockMatch ? codeBlockMatch[1] : parsed.result;
    const parsedArray = JSON.parse(rawArrayText);

    if (!Array.isArray(parsedArray)) {
      throw new Error('Expected parsed.result string to contain a JSON array.');
    }

    return {
      stalls: parsedArray,
      outputBuilder: enriched => ({ ...parsed, result: enriched }),
    };
  }

  throw new Error('Unsupported input schema. Expected an array, { stalls: [...] }, { result: [...] }, or { result: "```json [...]```" }.');
}

async function enrichStallWithGoogle(stall) {
  const name = stall.stall_name;
  const lat = stall.lat ?? stall.location?.lat ?? stall.google_maps?.lat ?? stall.google_maps_lat_lng?.lat ?? stall.google_maps_coords?.lat ?? stall.google_maps_details?.lat ?? stall.latitude;
  const lng = stall.lng ?? stall.location?.lng ?? stall.google_maps?.lng ?? stall.google_maps_lat_lng?.lng ?? stall.google_maps_coords?.lng ?? stall.google_maps_details?.lng ?? stall.longitude;

  // Step 1: Text search by name + lat/lng bias
  const query = encodeURIComponent(`${name} Singapore`);
  const locationBias = (lat != null && lng != null)
    ? `&location=${lat},${lng}&radius=300`
    : '';
  const textRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}${locationBias}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  const textData = await textRes.json();
  let placeId = textData.results?.[0]?.place_id;

  // Step 2: Fall back to nearby search if no text match
  if (!placeId && lat && lng) {
    const nearbyRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50&type=restaurant&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const nearbyData = await nearbyRes.json();
    placeId = nearbyData.results?.[0]?.place_id;
  }

  if (!placeId) {
    console.log(`✗ No Google listing found for: ${name}`);
    return { ...stall, google: null };
  }

  // Step 3: Place Details
  const detailRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,formatted_phone_number,opening_hours,url,website,price_level,editorial_summary&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  const detailData = await detailRes.json();
  const place = detailData.result;

  console.log(`✓ ${name} → ${place.name} (${place.rating ?? 'no rating'}⭐ ${place.user_ratings_total ?? 0} reviews)`);

  return {
    ...stall,
    google: {
      place_id: placeId,
      google_name: place.name,
      rating: place.rating ?? null,
      review_count: place.user_ratings_total ?? 0,
      reviews: place.reviews?.map(r => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
      })) ?? [],
      phone: place.formatted_phone_number ?? null,
      opening_hours: place.opening_hours?.weekday_text ?? null,
      maps_url: place.url ?? null,
      website: place.website ?? null,
      price_level: place.price_level ?? null,       // 0-4, $ to $$$$
      summary: place.editorial_summary?.overview ?? null,
    }
  };
}

async function enrichAllStalls(inputFile, outputFile) {
  const parsed = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
  const { stalls, outputBuilder } = extractStalls(parsed);
  const enriched = [];

  console.log(`Enriching ${stalls.length} stalls with Google Maps data...\n`);

  for (const stall of stalls) {
    const result = await enrichStallWithGoogle(stall);
    enriched.push(result);
    await new Promise(r => setTimeout(r, 300)); // stay under rate limits
  }

  const outputPayload = outputBuilder(enriched);
  fs.writeFileSync(outputFile, JSON.stringify(outputPayload, null, 2));

  const matched = enriched.filter(s => s.google).length;
  console.log(`\nDone. ${matched}/${stalls.length} matched on Google Maps.`);
  console.log(`Written to ${outputFile}`);
}

await enrichAllStalls(
  'results/result-Zion_Riverside_Food_Centre.json',
  'results-enriched/result-Zion_Riverside_Food_Centre-enriched.json'
);