import fs from 'fs';

function parseResult(raw) {
  if (!raw?.result) return null;
  
  // strip markdown code fences if present
  const cleaned = raw.result
    .replace(/^```json\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse result:', err.message);
    return null;
  }
}

// usage
const raw = JSON.parse(fs.readFileSync('results/result-Ayer_Rajah_Food_Centre.json', 'utf-8'));
const stalls = parseResult(raw);
console.log(`${stalls.length} stalls found`);
fs.writeFileSync('all-stalls.json', JSON.stringify(stalls, null, 2));