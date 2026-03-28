export const mockResults = [
  {
    id: 1,
    name: "Din Tai Fung",
    cuisine: "Dim Sum",
    dietaryCriteria: ["Unknown"],
    price: "$$",
    rating: 4.7,
    reviewCount: 2341,
    whyPicked:
      "Multi-source consensus. Highly rated on Google Maps and Reddit loves their har gow.",
    confidence: "High",
    sourceCount: 4,
    location: "Tao Payoh Rise",
    lat: 1.3304,
    lng: 103.8444,
    distance: 2.1,
    reviews: [
      {
        source: "Google Maps",
        text: "Soup dumplings were juicy and consistently good even during lunch rush.",
      },
      {
        source: "Reddit",
        text: "Pricey but worth it for xiao long bao and shrimp fried rice.",
      },
      {
        source: "Burpple",
        text: "Service was fast and portions were decent for a chain spot.",
      },
    ],
    recentBuzz:
      '"Best dumplings in SG!" - r/singapore (2 days ago)',
    mapUrl: "https://maps.google.com/?q=Din+Tai+Fung+Tao+Payoh",
  },
  {
    id: 2,
    name: "Shibuya Gohan",
    cuisine: "Japanese",
    dietaryCriteria: ["Unknown"],
    price: "$$$",
    rating: 4.4,
    reviewCount: 1823,
    whyPicked:
      "Trending on Reddit. Praised for authentic ramen and tonkotsu broth. Recent mention on r/singaporefoodies.",
    confidence: "High",
    sourceCount: 3,
    location: "Clementi",
    lat: 1.3344,
    lng: 103.7639,
    distance: 1.5,
    reviews: [
      {
        source: "Reddit",
        text: "Tonkotsu broth is rich without being too salty.",
      },
      {
        source: "Google Maps",
        text: "Noodles had good bite and chashu was tender.",
      },
      {
        source: "Instagram",
        text: "Small queue at dinner but turnover is fast.",
      },
    ],
    recentBuzz:
      '"The tonkotsu is 10/10" - r/singaporefoodies (1 day ago)',
    mapUrl: "https://maps.google.com/?q=Shibuya+Gohan+Clementi",
  },
  {
    id: 3,
    name: "Chick Boss",
    cuisine: "Chicken Rice",
    dietaryCriteria: ["Halal"],
    price: "$",
    rating: 4.5,
    reviewCount: 3421,
    whyPicked:
      "Hidden gem with exceptional value. Google Maps consensus + surprising Reddit mentions.",
    confidence: "Medium",
    sourceCount: 2,
    location: "Holland Village",
    lat: 1.3176,
    lng: 103.8019,
    distance: 1.2,
    reviews: [
      {
        source: "Google Maps",
        text: "Chicken was tender and the chilli had a nice kick.",
      },
      {
        source: "Reddit",
        text: "Great value set meals, especially for students nearby.",
      },
      {
        source: "Food Blog",
        text: "Rice quality is fragrant and portions are generous.",
      },
    ],
    recentBuzz:
      '"Best chicken rice for the price" - r/singapore (3 days ago)',
    mapUrl: "https://maps.google.com/?q=Chick+Boss+Holland+Village",
  },
  {
    id: 4,
    name: "Nasi Kuning House",
    cuisine: "Malay",
    dietaryCriteria: ["Halal"],
    price: "$$",
    rating: 4.6,
    reviewCount: 2109,
    whyPicked:
      "Consistent quality. Mentioned in multiple sources. Specialty: nasi kuning with ayam merah.",
    confidence: "High",
    sourceCount: 3,
    location: "Geylang Serai",
    lat: 1.3978,
    lng: 103.8624,
    distance: 2.8,
    reviews: [
      {
        source: "Burpple",
        text: "Nasi kuning was aromatic and ayam merah had deep flavour.",
      },
      {
        source: "Google Maps",
        text: "Halal options are clear and staff was helpful.",
      },
      {
        source: "Reddit",
        text: "Authentic taste with fair pricing for the portion.",
      },
    ],
    recentBuzz: '"Authentic flavors!" - Burpple (5 days ago)',
    mapUrl: "https://maps.google.com/?q=Nasi+Kuning+House+Geylang",
  },
  {
    id: 5,
    name: "Burnt Ends",
    cuisine: "BBQ",
    dietaryCriteria: ["Unknown"],
    price: "$$$",
    rating: 4.8,
    reviewCount: 4523,
    whyPicked:
      "Premium pick - highest rated across all sources. Award-winning concept. Singapore stalwart.",
    confidence: "High",
    sourceCount: 4,
    location: "Burghley Drive",
    lat: 1.3058,
    lng: 103.7989,
    distance: 3.1,
    reviews: [
      {
        source: "Google Maps",
        text: "Meat quality is excellent and open-kitchen experience is fun.",
      },
      {
        source: "Reddit",
        text: "Hard to book, but tasting menu impressed all around.",
      },
      {
        source: "Food Critic",
        text: "Strong execution and memorable sauces.",
      },
    ],
    recentBuzz:
      '"Best BBQ in Singapore" - r/singapore (1 day ago)',
    mapUrl: "https://maps.google.com/?q=Burnt+Ends+Singapore",
  },
  {
    id: 6,
    name: "Tiny Kopi",
    cuisine: "Coffee",
    dietaryCriteria: ["Vegetarian"],
    price: "$",
    rating: 4.2,
    reviewCount: 156,
    whyPicked:
      "Emerging gem with potential. Spotted on social media. Limited source confirmation but decent ratings.",
    confidence: "Low",
    sourceCount: 1,
    location: "Tiong Bahru",
    lat: 1.2845,
    lng: 103.8234,
    distance: 0.8,
    reviews: [
      {
        source: "Instagram",
        text: "Cozy seating and latte art was on point.",
      },
      {
        source: "Google Maps",
        text: "Friendly barista and quiet weekday mornings.",
      },
      {
        source: "Reddit",
        text: "Good pit stop for coffee before nearby food centre.",
      },
    ],
    recentBuzz:
      '"Cozy spot for coffee" - Instagram (1 week ago)',
    mapUrl: "https://maps.google.com/?q=Tiny+Kopi+Tiong+Bahru",
  },
];

export const mockRouletteResult = {
  id: 6,
  name: "Lao Ban Soya Beancurd",
  cuisine: "Beancurd",
  dietaryCriteria: ["Vegetarian"],
  price: "$",
  rating: 4.3,
  reviewCount: 892,
  whyPicked:
    "🎲 Roulette Pick: Local favorite that flew under the radar. Perfect comfort food with nostalgic charm.",
  confidence: "Medium",
  sourceCount: 1,
  location: "Alexandra",
  lat: 1.2884,
  lng: 103.8084,
  distance: 1.9,
  reviews: [
    {
      source: "Reddit",
      text: "Silky texture and not overly sweet.",
    },
    {
      source: "Google Maps",
      text: "Queue moves quickly and portions are satisfying.",
    },
    {
      source: "Instagram",
      text: "Classic dessert spot with old-school vibes.",
    },
  ],
  recentBuzz:
    '"Old school charm with modern hygiene" - r/singapore (2 days ago)',
  mapUrl: "https://maps.google.com/?q=Lao+Ban+Soya+Beancurd+Singapore",
};
