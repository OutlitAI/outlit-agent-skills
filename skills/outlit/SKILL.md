---
name: outlit
description: Use when accessing Outlit customer intelligence through the `outlit` CLI or Outlit MCP tools, including customer lookups, timelines, facts, semantic search, revenue or churn analysis, SQL analytics, setup, or troubleshooting agent access to Outlit data.
metadata:
  homepage: "https://outlit.ai"
  emoji: "🔦"
  openclaw:
    requires:
      bins: [outlit]
      env: [OUTLIT_API_KEY]
    primaryEnv: OUTLIT_API_KEY
    install:
      - kind: node
        package: "@outlit/cli"
        bins: [outlit]
      - kind: brew
        formula: outlitai/tap/outlit
        bins: [outlit]
---

# Outlit

Use the highest-level Outlit interface already available.

Outlit joins product activity, conversations, billing, and web signals into a unified customer context graph and timeline for agents.

## Choose the interface

1. If `outlit_*` MCP tools are present, use MCP.
2. Else if the `outlit` CLI is installed, use the CLI.
3. Else guide setup:
   - Coding agents: prefer the `outlit` CLI plus `outlit auth login`. Prefer this over MCP for terminal agents.
   - MCP clients: use the workspace MCP URL from **Settings > CLI & MCP**. Auth may use OAuth or an API key depending on the client. Do not assume a shared hardcoded endpoint.

## Quick chooser

- Browse customers: `outlit_list_customers` or `outlit customers list`
- Browse users: `outlit_list_users` or `outlit users list`
- Single account deep dive: `outlit_get_customer` or `outlit customers get`
- Chronology: `outlit_get_timeline` or `outlit customers timeline`
- Known signals for an account: `outlit_get_facts` or `outlit facts list`
- Exact fact by id: `outlit facts get`
- Exact source behind a fact or search hit: `outlit sources get`
- Specific question or topic: `outlit_search_customer_context` or `outlit search`
- Custom analytics: `outlit_schema` + `outlit_query`, or `outlit schema` + `outlit sql`

Use customer lookups before SQL. SQL is for aggregates, joins, cohorts, and custom reporting.

## Working rules

- Use `facts list` to browse known intelligence for one account.
- Use `facts get` when you already have a fact id and need the canonical fact payload.
- Use `sources get` when a fact or search result points to a specific source and you need the exact artifact.
- Use `search` to answer a specific question, and `timeline` to inspect chronology.
- Call schema before writing SQL.
- Add explicit time filters to event SQL.
- Divide money fields by `100` for display.
- Request only the fields or `include` sections you need.

For ClickHouse syntax and query patterns, read [references/sql-reference.md](references/sql-reference.md).

## Output behavior

- Interactive CLI: readable tables
- Piped CLI output: automatic JSON
- Force JSON: `--json`
- Results include timestamps and source attribution when available

## Facts vs Search vs Timeline

- Use `facts list` to list what Outlit already knows about an account.
- Use `facts get` when you already have a fact id and need that exact fact.
- Use `search` for a specific question or theme, including cross-customer questions.
- Use `sources get` when you need the exact email, call, calendar event, or ticket behind a fact or search hit.
- Use `timeline` when order and sequence matter.

## Setup

### Coding agents

```bash
npm install -g @outlit/cli   # or: brew install outlitai/tap/outlit
outlit auth login
outlit customers get acme.com --include users,revenue
```

Auth resolution order: `--api-key`, `OUTLIT_API_KEY`, stored credentials.

### MCP clients

Get the workspace URL from **Settings > CLI & MCP** in Outlit.

MCP clients can authenticate with OAuth or an API key, depending on the client. Do not assume API key-only auth or OAuth-only auth.

Verify the connection with `outlit_schema` or `outlit schema`.

## Docs

- Docs home: https://docs.outlit.ai/
- Agent skills: https://docs.outlit.ai/ai-integrations/skills
- CLI overview: https://docs.outlit.ai/cli/overview
- CLI commands: https://docs.outlit.ai/cli/commands
- AI agent setup: https://docs.outlit.ai/cli/ai-agents
- MCP integration: https://docs.outlit.ai/ai-integrations/mcp
- Customer context graph: https://docs.outlit.ai/concepts/customer-context-graph

## Common prompts

- "What changed for this customer this week?"
- "Who is paying but inactive for 30 days?"
- "What pricing objections show up in conversations?"
- "Which channels are driving revenue?"
