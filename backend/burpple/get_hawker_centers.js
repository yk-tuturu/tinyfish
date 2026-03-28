import Database from 'better-sqlite3';
const db = new Database('hawker.db');

const res = await fetch("https://data.gov.sg/api/action/datastore_search?resource_id=b80cb643-a732-480d-86b5-e03957bc82aa&limit=200");
const { result } = await res.json();
const centres = result.records;

db.exec(`
  CREATE TABLE IF NOT EXISTS hawker_centres (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    lat REAL,
    lng REAL,
    no_of_food_stalls INTEGER,
    no_of_market_stalls INTEGER,
    description TEXT,
    photo_url TEXT,
    status TEXT
  )
`);

const insert = db.prepare(`
  INSERT OR IGNORE INTO hawker_centres 
    (id, name, address, lat, lng, no_of_food_stalls, no_of_market_stalls, description, photo_url, status)
  VALUES 
    (@id, @name, @address, @lat, @lng, @no_of_food_stalls, @no_of_market_stalls, @description, @photo_url, @status)
`);

for (const c of centres) {
  insert.run({
    id: c._id,
    name: c.name,
    address: c.address_myenv,
    lat: parseFloat(c.latitude_hc),
    lng: parseFloat(c.longitude_hc),
    no_of_food_stalls: parseInt(c.no_of_food_stalls) || 0,
    no_of_market_stalls: parseInt(c.no_of_market_stalls) || 0,
    description: c.description_myenv,
    photo_url: c.photourl,
    status: c.status
  });
}