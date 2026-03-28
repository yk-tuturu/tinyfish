# 🍜 Hawker Oracle (Uncle Bot's Food Oracle)

**Real-time food intelligence for Singapore — powered by TinyFish + OpenAI**

Built at the TinyFish SG Hackathon, March 28 2026 @ NUS

## What It Does

Hawker Oracle scrapes live food data from **Burpple**, **Google Maps**, and **Reddit** across Singapore's hawker centres, then uses **OpenAI** to rank and recommend the best stalls based on your query, budget, and location.

No more stale 2022 reviews. No more scrolling 10 Reddit threads. Just ask the Oracle.

## Features

- 🔮 **Smart Recommendations** — Ask "chicken rice near Clementi" and get 5 AI-ranked results with explanations
- 🎰 **Food Roulette** — Feeling adventurous? Let the Oracle pick a hidden gem for you
- 🗺️ **Map View** — See all recommendations on an interactive map
- 📊 **Cross-Source Confidence** — Stalls mentioned on both Reddit AND Burpple get a higher confidence score
- ⚡ **Cached Results** — Same query returns instantly the second time

## Architecture

```
[TinyFish Agents] → Scrape Burpple + Google Maps + Reddit in parallel
        ↓
  Pre-scraped JSON fixtures (15 hawker centres, ~100 stalls)
        ↓
  Express API → Aggregates all sources, sends to OpenAI
        ↓
  OpenAI GPT-4o → Ranks, explains, picks hidden gems
        ↓
  React Frontend → Search bar + Food cards + Map + Roulette
```

## Tech Stack

- **Frontend:** React + Vite + Leaflet
- **Backend:** Node.js + Express
- **AI:** OpenAI GPT-4o
- **Scraping:** TinyFish Web Agent API
- **Data Sources:** Burpple, Google Maps, Reddit (r/singapore, r/SingaporeEats)

## Coverage

Hawker centres in **Clementi** and **Tiong Bahru** areas:

- Clementi Ave 2 Market, Ayer Rajah Food Centre, Pasir Panjang Food Centre, Commonwealth Crescent Market
- Tiong Bahru Market, Alexandra Village Food Centre, Redhill Market, Margaret Drive Hawker Centre, Zion Riverside Food Centre, Tanglin Halt Market
- Ghim Moh Market, Holland Village Market

## Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Fill in your TINYFISH_API_KEY and OPENAI_API_KEY

# Start backend (terminal 1)
node backend/server.js

# Start frontend (terminal 2)
npm run dev
```

## API

**POST** `/api/recommend`

```json
{
  "query": "chicken rice near Clementi",
  "budget": "cheap",
  "mode": "recommend"
}
```

Returns AI-ranked recommendations with cross-source data from Burpple + Google Maps + Reddit.

## Team

Built by Leyli Jalilova, Koh Wai Kei and Aïda Tadlaoui at the TinyFish SG Hackathon 🐟