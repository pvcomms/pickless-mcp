import type { Profile } from "./types.js";

// Param's taste profile — Indiranagar, Bangalore
export const PROFILE: Profile = {
  location: {
    lat: 12.9716,
    lng: 77.6411,
    city: "Bangalore",
    neighborhood: "Indiranagar",
    country: "India",
    countryCode: "IN",
  },
  prefs: {
    diet: "any",
    vibe: "treat",
    spice: "medium",
    budgetMax: 600,
    dontEat: [],
    cuisines: [],
  },
  platforms: ["swiggy", "zomato"],
  userName: "Param",
  tasteProfile: {
    archetype:
      "indiranagar adventurer — street-rooted comfort palate with occasional binge mode",
    loyalRestaurants: [],
    signatureDishes: ["biryani", "chole bhature", "dosa", "burger"],
    loves: [
      "South Indian",
      "North Indian",
      "Indo-Chinese",
      "burgers",
      "biryani",
    ],
    avoids: [],
    budgetBand: { lo: 150, hi: 600, currency: "INR" },
    timeRhythm:
      "weekday lunches fast + filling under ₹350, weekend dinners generous 400-600",
    weakSpots: ["biryani at midnight", "chole bhature on a slow morning"],
    agentInstructions:
      "pick something rooted and real — not chain-restaurant generic. indiranagar has great options; lean local. he responds to punchy single-item recommendations, not menus. if it's late, go comfort carbs. if it's hot out, go lighter. if it's a weekend, go generous.",
  },
};
