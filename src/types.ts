export type SkipReason =
  | "too_pricey"
  | "wrong_cuisine"
  | "not_feeling_it"
  | "not_now";

export interface Pick {
  dish: string;
  restaurant: string;
  restaurantId?: string;
  platform: string;
  price: string;
  order?: string;
  reason: string;
  vibe: string;
  tags?: string[];
  orderUrl: string;
  deliveryMins?: number;
  rating?: number;
  live?: boolean;
  modelUsed?: string;
}

export interface MultiPick extends Pick {
  angle: "safe" | "smart" | "wild";
}

export interface SkipEntry {
  dish: string;
  restaurant: string;
  reason: SkipReason;
  skippedAt: string;
}

export interface ShownEntry {
  dish: string;
  restaurant: string;
  shownAt: string;
}

export interface State {
  recentlyShown: ShownEntry[];
  skips: SkipEntry[];
}

export interface TasteProfile {
  archetype: string;
  loyalRestaurants: string[];
  signatureDishes: string[];
  loves: string[];
  avoids: string[];
  budgetBand: { lo: number; hi: number; currency: string };
  timeRhythm: string;
  weakSpots: string[];
  agentInstructions: string;
}

export interface Profile {
  location: {
    lat: number;
    lng: number;
    city: string;
    neighborhood: string;
    country: string;
    countryCode: string;
  };
  prefs: {
    diet: string;
    vibe: string;
    spice: string;
    budgetMax: number;
    dontEat: string[];
    cuisines: string[];
  };
  platforms: string[];
  userName: string;
  tasteProfile?: TasteProfile;
}
