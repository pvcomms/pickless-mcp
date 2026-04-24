import type {
  Pick,
  MultiPick,
  Profile,
  ShownEntry,
  SkipEntry,
} from "./types.js";

const BASE = "https://picklessai.vercel.app";

function getContext() {
  const now = new Date();
  const hour = now.getHours();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeOfDay =
    hour < 6
      ? "late-night"
      : hour < 11
        ? "breakfast"
        : hour < 15
          ? "lunch"
          : hour < 18
            ? "snack"
            : "dinner";
  return {
    timeOfDay,
    dayOfWeek: dayNames[now.getDay()],
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
    hour,
  };
}

// Build skip-aware "recently shown" list — skipped items are included so they
// won't be re-suggested, and the skip reason is appended to their name so the
// model picks up the rejection signal.
function mergeShownAndSkips(
  recentlyShown: ShownEntry[],
  skips: SkipEntry[],
): Array<{ dish: string; restaurant: string }> {
  const skipMap = new Map(
    skips.map((s) => [`${s.dish}|${s.restaurant}`, s.reason]),
  );
  const all: Array<{ dish: string; restaurant: string }> = recentlyShown.map(
    (s) => ({
      dish: skipMap.has(`${s.dish}|${s.restaurant}`)
        ? `${s.dish} [skip:${skipMap.get(`${s.dish}|${s.restaurant}`)}]`
        : s.dish,
      restaurant: s.restaurant,
    }),
  );
  return all;
}

export async function fetchSnack(
  profile: Profile,
  recentlyShown: ShownEntry[],
  skips: SkipEntry[],
  mood?: string,
): Promise<Pick> {
  const body = {
    platforms: profile.platforms,
    location: profile.location,
    prefs: profile.prefs,
    tasteProfile: profile.tasteProfile,
    context: getContext(),
    mood: mood ?? null,
    warmth: "returning",
    recentlyShown: mergeShownAndSkips(recentlyShown, skips),
    history: [],
    trends: null,
    weather: null,
    device: null,
  };

  const res = await fetch(`${BASE}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `picklessai API error ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  return res.json() as Promise<Pick>;
}

export async function fetchPicks(
  profile: Profile,
  recentlyShown: ShownEntry[],
  skips: SkipEntry[],
  mood?: string,
): Promise<MultiPick[]> {
  const body = {
    platforms: profile.platforms,
    location: profile.location,
    prefs: profile.prefs,
    tasteProfile: profile.tasteProfile,
    context: getContext(),
    mood: mood ?? null,
    warmth: "returning",
    recentlyShown: mergeShownAndSkips(recentlyShown, skips),
    history: [],
    trends: null,
    weather: null,
  };

  const res = await fetch(`${BASE}/api/predict-picks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(18000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `picklessai API error ${res.status}: ${text.slice(0, 200)}`,
    );
  }

  const data = (await res.json()) as { picks: MultiPick[] };
  return data.picks;
}
