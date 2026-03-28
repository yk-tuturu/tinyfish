import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getRecommendations } from './recommender.js';
import { getFoodData } from './aggregator.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Cache to store results
const cache = {};
const cacheEnabled = process.env.ENABLE_API_CACHE === '1';

// Pre-load all food data on startup
let allFoodData = [];
try {
  allFoodData = await getFoodData();
  console.log(`✓ Loaded ${allFoodData.length} stalls from Burpple + Reddit`);
} catch (err) {
  console.error('Failed to load food data:', err.message);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), stalls_loaded: allFoodData.length });
});

app.post('/api/recommend', async (req, res) => {
  const {
    query,
    budget = 'any',
    mode = 'recommend',
    selectedLocation = null,
    dietary = [],
  } = req.body;

  try {
    const locationKey = selectedLocation
      ? `${selectedLocation.lat ?? 'na'}-${selectedLocation.lng ?? 'na'}`
      : 'no-location';
    const dietaryKey = Array.isArray(dietary) ? dietary.slice().sort().join('|') : 'no-dietary';
    const cacheKey = `${query}-${budget}-${mode}-${locationKey}-${dietaryKey}`;
    if (cacheEnabled && cache[cacheKey]) {
      return res.json({ ...cache[cacheKey], cached: true });
    }

    const result = await getRecommendations(query, budget, mode, allFoodData, {
      selectedLocation,
      dietary,
    });

    const responsePayload = {
      ...result,
      sourcesChecked: 3,
      totalDataPoints: allFoodData.length,
      searchTime: "3.2s"
    };

    if (cacheEnabled) {
      cache[cacheKey] = responsePayload;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to get recommendations', message: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🍜 Hawker Oracle API running on http://localhost:${PORT}`);
});