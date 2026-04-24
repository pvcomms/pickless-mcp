#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PROFILE } from "./profile.js";
import { fetchSnack, fetchPicks } from "./api.js";
import {
  recordShown,
  recordSkip,
  getRecentlyShown,
  getSkips,
} from "./storage.js";
import type { SkipReason } from "./types.js";

const server = new Server(
  { name: "pickless-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "pickless_snack",
      description:
        "Get one decisive food pick — dish, restaurant, price, Swiggy/Zomato link, and a punchy reason. Powered by Param's taste profile (Indiranagar, Bangalore). Use when someone is hungry and needs a pick without deciding.",
      inputSchema: {
        type: "object",
        properties: {
          mood: {
            type: "string",
            description:
              "Optional current mood or context (e.g. 'cozy', 'light', 'celebratory', 'hungover')",
          },
        },
      },
    },
    {
      name: "pickless_skip",
      description:
        "Skip a pick and log the rejection reason. One of: too_pricey, wrong_cuisine, not_feeling_it, not_now. Closes the feedback loop — skipped items won't be re-suggested.",
      inputSchema: {
        type: "object",
        required: ["dish", "restaurant", "reason"],
        properties: {
          dish: {
            type: "string",
            description: "The dish name that was skipped",
          },
          restaurant: {
            type: "string",
            description: "The restaurant name that was skipped",
          },
          reason: {
            type: "string",
            enum: ["too_pricey", "wrong_cuisine", "not_feeling_it", "not_now"],
            description: "Why this pick was rejected",
          },
        },
      },
    },
    {
      name: "pickless_picks",
      description:
        "Get three distinct picks at once — safe (comfort), smart (fits this moment), and wild (adventure). Each from a different restaurant and cuisine. Use when you want options presented side-by-side.",
      inputSchema: {
        type: "object",
        properties: {
          mood: {
            type: "string",
            description: "Optional current mood or context",
          },
        },
      },
    },
    {
      name: "pickless_taste_profile",
      description:
        "Return Param's stored taste profile — archetype, loves, budget band, agent instructions, and skip history summary.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "pickless_snack") {
    const mood = (args as { mood?: string }).mood;
    const pick = await fetchSnack(
      PROFILE,
      getRecentlyShown(),
      getSkips(),
      mood,
    );
    recordShown(pick.dish, pick.restaurant);

    const lines = [
      `**${pick.dish}**`,
      `${pick.restaurant} · ${pick.price}`,
      `"${pick.reason}"`,
      pick.vibe ? `*${pick.vibe}*` : "",
      pick.tags?.length ? `tags: ${pick.tags.join(" · ")}` : "",
      pick.deliveryMins
        ? `delivery: ~${pick.deliveryMins}min via ${pick.platform}`
        : `via ${pick.platform}`,
      "",
      `▶ ${pick.orderUrl}`,
      `copy: "Order ${pick.dish} at ${pick.restaurant}"`,
    ]
      .filter((l) => l !== undefined && l !== null)
      .join("\n");

    return { content: [{ type: "text", text: lines }] };
  }

  if (name === "pickless_skip") {
    const { dish, restaurant, reason } = args as {
      dish: string;
      restaurant: string;
      reason: SkipReason;
    };
    recordSkip(dish, restaurant, reason);
    const label: Record<SkipReason, string> = {
      too_pricey: "Too pricey",
      wrong_cuisine: "Wrong cuisine",
      not_feeling_it: "Not feeling it",
      not_now: "Not now",
    };
    return {
      content: [
        {
          type: "text",
          text: `Skipped: ${dish} @ ${restaurant} — ${label[reason]}. Won't suggest it again this session.`,
        },
      ],
    };
  }

  if (name === "pickless_picks") {
    const mood = (args as { mood?: string }).mood;
    const picks = await fetchPicks(
      PROFILE,
      getRecentlyShown(),
      getSkips(),
      mood,
    );

    picks.forEach((p) => recordShown(p.dish, p.restaurant));

    const angleEmoji: Record<string, string> = {
      safe: "🟢 safe",
      smart: "🔵 smart",
      wild: "🟠 wild",
    };

    const lines = picks
      .map((p) => {
        return [
          `**${angleEmoji[p.angle] ?? p.angle} — ${p.dish}**`,
          `${p.restaurant} · ${p.price}`,
          `"${p.reason}"`,
          p.vibe ? `*${p.vibe}*` : "",
          p.deliveryMins ? `~${p.deliveryMins}min` : "",
          `▶ ${p.orderUrl}`,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n---\n\n");

    return { content: [{ type: "text", text: lines }] };
  }

  if (name === "pickless_taste_profile") {
    const tp = PROFILE.tasteProfile;
    const skips = getSkips();

    const skipSummary =
      skips.length === 0
        ? "no skips yet"
        : Object.entries(
            skips.reduce(
              (acc, s) => {
                acc[s.reason] = (acc[s.reason] ?? 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            ),
          )
            .map(([r, n]) => `${r}: ${n}`)
            .join(", ");

    const out = tp
      ? [
          `**Archetype:** ${tp.archetype}`,
          `**Loves:** ${tp.loves.join(", ")}`,
          `**Avoids:** ${tp.avoids.length ? tp.avoids.join(", ") : "nothing hard"}`,
          `**Budget:** ₹${tp.budgetBand.lo}–₹${tp.budgetBand.hi}`,
          `**Time rhythm:** ${tp.timeRhythm}`,
          `**Weak spots:** ${tp.weakSpots.join(", ")}`,
          `**Agent brief:** ${tp.agentInstructions}`,
          `**Skip history:** ${skipSummary}`,
        ].join("\n")
      : "No taste profile set.";

    return { content: [{ type: "text", text: out }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`pickless-mcp error: ${err}\n`);
  process.exit(1);
});
