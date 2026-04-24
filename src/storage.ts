import fs from "fs";
import os from "os";
import path from "path";
import type { State, ShownEntry, SkipEntry, SkipReason } from "./types.js";

const STATE_DIR = path.join(os.homedir(), ".pickless-mcp");
const STATE_FILE = path.join(STATE_DIR, "state.json");
const MAX_SHOWN = 20;
const MAX_SKIPS = 50;

function ensureDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function loadState(): State {
  ensureDir();
  if (!fs.existsSync(STATE_FILE)) return { recentlyShown: [], skips: [] };
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) as State;
  } catch {
    return { recentlyShown: [], skips: [] };
  }
}

function saveState(state: State): void {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function recordShown(dish: string, restaurant: string): void {
  const state = loadState();
  const entry: ShownEntry = {
    dish,
    restaurant,
    shownAt: new Date().toISOString(),
  };
  state.recentlyShown = [entry, ...state.recentlyShown].slice(0, MAX_SHOWN);
  saveState(state);
}

export function recordSkip(
  dish: string,
  restaurant: string,
  reason: SkipReason,
): void {
  const state = loadState();
  const entry: SkipEntry = {
    dish,
    restaurant,
    reason,
    skippedAt: new Date().toISOString(),
  };
  // Move to front of recentlyShown too so it won't be re-suggested
  const shown: ShownEntry = {
    dish,
    restaurant,
    shownAt: new Date().toISOString(),
  };
  state.recentlyShown = [shown, ...state.recentlyShown].slice(0, MAX_SHOWN);
  state.skips = [entry, ...state.skips].slice(0, MAX_SKIPS);
  saveState(state);
}

export function getRecentlyShown(): ShownEntry[] {
  return loadState().recentlyShown;
}

export function getSkips(): SkipEntry[] {
  return loadState().skips;
}
