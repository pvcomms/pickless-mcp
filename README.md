# pickless-mcp

Param's taste profile as an MCP tool. Any Claude session — Claude.ai, Claude Code, anywhere — can call `pickless_snack()` and get his pick.

## Tools

| Tool                     | What it does                                                                    |
| ------------------------ | ------------------------------------------------------------------------------- |
| `pickless_snack`         | One decisive pick — dish, restaurant, price, order link                         |
| `pickless_skip`          | Skip with reason: `too_pricey` / `wrong_cuisine` / `not_feeling_it` / `not_now` |
| `pickless_picks`         | Three picks at once: safe · smart · wild                                        |
| `pickless_taste_profile` | Param's full taste profile + skip history                                       |

## Skip feedback

Every skip is stored in `~/.pickless-mcp/state.json` with its reason. Skipped items are injected into future calls as `recentlyShown` with skip annotations — so the model learns from rejections, not just orders.

## Install

```bash
npx pickless-mcp
```

Or global:

```bash
npm i -g pickless-mcp
```

## Claude Code config

```json
{
  "mcpServers": {
    "pickless": {
      "command": "npx",
      "args": ["-y", "pickless-mcp"]
    }
  }
}
```

## Stack

- MCP stdio transport via `@modelcontextprotocol/sdk`
- API: [picklessai.vercel.app](https://picklessai.vercel.app) (Gemini 2.5 + live Swiggy data)
- State: `~/.pickless-mcp/state.json`
- Same playbook as [whoop-mcp](https://github.com/paramxclaudedev/whoop-mcp)
