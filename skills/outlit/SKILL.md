---
name: outlit
description: Use when accessing Outlit customer intelligence through the `outlit` CLI, Outlit MCP tools, Pi tools, or @outlit/tools, including customer lookups, users, timelines, facts, source evidence, semantic search, revenue, churn, SQL analytics, setup, notifications, or troubleshooting agent access.
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

Use Outlit to ground customer intelligence work in real customer data. Outlit joins product activity, conversations, billing, support, CRM, and web signals into a customer context graph and timeline for agents.

## Choose the Interface

Use the highest-level interface already available:

1. If `outlit_*` MCP/Pi tools are present, use those tools.
2. Else if the `outlit` CLI is installed, use the CLI.
3. Else guide setup:
   - Coding agents: install/use the `outlit` CLI and run `outlit auth login`.
   - Agent skills: run `outlit setup --yes` or `outlit setup skills`.
   - MCP clients: use the workspace MCP URL from **Settings > CLI & MCP**. Remote MCP uses OAuth; do not hardcode shared endpoints, bearer headers, or API keys into MCP config unless the docs/client explicitly require it.

Use the `outlit-sdk` skill instead when the user wants to instrument an application with tracking SDKs.

## Quick Chooser

| Need | MCP/Pi tool | CLI |
|------|-------------|-----|
| Browse customers | `outlit_list_customers` | `outlit customers list` |
| Browse users/contacts | `outlit_list_users` | `outlit users list` |
| Single account profile | `outlit_get_customer` | `outlit customers get` |
| Chronology | `outlit_get_timeline` | `outlit customers timeline` |
| Known structured signals | `outlit_list_facts` | `outlit facts list` |
| Exact fact | `outlit_get_fact` | `outlit facts get` |
| Deterministic source enumeration, when available | `outlit_list_sources` | `outlit sources list` |
| Exact source artifact | `outlit_get_source` | `outlit sources get` |
| Thematic/fuzzy question | `outlit_search_customer_context` | `outlit search` |
| Custom analytics | `outlit_schema` + `outlit_query` | `outlit schema` + `outlit sql` |
| Send/post a notification | `outlit_send_notification` | `outlit notify` |
| Integration status/setup | Use CLI unless explicit tools exist | `outlit integrations list/status/add/remove` |

Use customer lookups before SQL. SQL is for aggregates, cohorts, joins, time-series checks, and custom reporting.

## Working Rules

- Start with the highest-level tool that can answer the question.
- Gather evidence before drawing conclusions.
- Separate evidence from interpretation in the final answer.
- Cite the evidence kind: customer record, user record, timeline event, fact, search result, source record, or SQL result.
- If data is sparse, stale, or inconsistent, say how that affects confidence.
- Request only the fields or include sections needed.
- Results often include timestamps and source attribution; use them.

## Facts vs Search vs Sources vs Timeline

- Use `facts list` to browse known structured intelligence for one account.
- Use `factTypes` for public customer-memory fact classes such as `CHURN_RISK`, `EXPANSION`, `SENTIMENT`, `BUDGET`, `REQUIREMENTS`, `PRODUCT_USAGE`, `CHAMPION_RISK`, or `CONTACT_INFO`.
- Do not request anomaly-detector fact types as public filters, such as `CORE_ACTION_DECAY`, `CADENCE_BREAK`, `QUIET_ACCOUNT`, `ACTIVATION_RATE_DROP`, or `FUNNEL_DROPOFF`.
- Use `facts get` when you already have a fact ID and need the canonical payload or best-effort `evidence`.
- Use `search` for a specific question/theme, including cross-customer questions. Search returns grouped `source` and `fact` artifacts, not raw vector chunks.
- Use `sources list` when you need deterministic enumeration of emails, calls, calendar events, support tickets, or CRM opportunities.
- Use `sources get` when a fact/search/list result points to a concrete source and you need the exact artifact.
- Use `timeline` when order, recency, or sequence matters.

Supported generic source types are `EMAIL`, `CALL`, `CALENDAR_EVENT`, `SUPPORT_TICKET`, and `OPPORTUNITY`. `CRM` and `CRM_OPPORTUNITY` are accepted aliases for opportunity filters.

## Notifications

Notification tools are action tools. Use them only when the user explicitly asks you to send, post, or notify.

- CLI: `outlit notify --title "..." --markdown "..."`.
- File input: `--payload-file <path>`, `--markdown-file <path>`.
- Optional context: `--message`, `--severity low|medium|high`, `--source`, `--subject`.
- Destination format: `--destination slack[:channelId]`. Omit destination to use the organization's default notifier, usually Slack.
- Markdown is the preferred human-readable body; payload can carry JSON-serializable context.

Do not notify by default just because an analysis found risk.

## SQL Rules

Call schema before writing SQL.

- Use public analytics views, not backend table names: `activity`, `customers`, `users`, `revenue`.
- Add explicit time filters to event/activity SQL.
- Use `LIMIT`.
- Divide money fields in cents by `100` for display.
- Inspect JSON/trait column shapes before filtering nested values.
- Keep SQL read-only.

For ClickHouse syntax and query patterns, read [references/sql-reference.md](references/sql-reference.md).

## CLI Setup

Fast install:

```bash
curl -fsSL https://outlit.ai/install.sh | bash
```

Alternative installs:

```bash
npm install -g @outlit/cli
brew install outlitai/tap/outlit
```

Auth resolution order is `--api-key`, `OUTLIT_API_KEY`, then stored credentials.

```bash
outlit auth login
outlit auth login --key ok_your_api_key
outlit auth status
outlit auth whoami
```

Agent setup:

```bash
outlit setup --yes
outlit setup codex
outlit setup claude-code
outlit setup gemini
outlit setup droid
outlit setup opencode
outlit setup pi
outlit setup openclaw
outlit setup skills
outlit doctor
```

`outlit setup skills` opens the interactive Skills installer for `outlit` and optional extras like `outlit-sdk`.

## CLI Output Behavior

- Interactive terminal: readable tables, spinners, colors.
- Piped stdout, `--json`, CI, or dumb terminal: JSON.
- Force JSON: `--json`.

AI agents commonly receive JSON automatically because stdout is piped.

## MCP Setup

Get the workspace URL from **Settings > CLI & MCP** in Outlit. It looks like:

```text
https://mcp.outlit.ai/w/<workspace-slug>/mcp
```

Add that URL directly to the MCP client and complete OAuth in the client. Verify with `outlit_schema` or by asking for available analytics views.

## Pi and Tool Packages

For Pi agents:

```bash
pi install npm:@outlit/pi
export OUTLIT_API_KEY=ok_your_api_key
pi
```

`@outlit/pi` registers default customer intelligence tools and notification action tools. SQL tools are available but not enabled by default; use analytical/custom toolsets only for agents that should run read-only SQL.

For custom TypeScript tool clients, use `@outlit/tools` and its exported `customerToolContracts`, `defaultAgentToolNames`, `actionToolNames`, `sqlToolNames`, and `allCustomerToolNames`.

## Integrations

Use integration commands only when the user asks to inspect or manage connected data sources.

```bash
outlit integrations list
outlit integrations status
outlit integrations add
outlit integrations remove
```

Be careful with `remove`: it can disconnect an integration and remove synced data. Confirm intent before using destructive integration-management commands.

## Troubleshooting

- Missing API key: tell the user to set `OUTLIT_API_KEY` or run `outlit auth login`.
- Setup issues: run `outlit doctor`.
- Stale CLI: run `outlit upgrade`; set `OUTLIT_NO_UPDATE_NOTIFIER=1` to suppress update notices.
- MCP auth issues: use the workspace MCP URL and OAuth flow; do not assume API-key-only auth for remote MCP.
- Empty data: check integrations and sync status before concluding the customer has no activity.

## Docs

- Docs home: https://docs.outlit.ai/
- CLI overview: https://docs.outlit.ai/cli/overview
- CLI commands: https://docs.outlit.ai/cli/commands
- CLI integrations: https://docs.outlit.ai/cli/integrations
- AI agent setup: https://docs.outlit.ai/cli/ai-agents
- Agent skills: https://docs.outlit.ai/ai-integrations/skills
- MCP integration: https://docs.outlit.ai/ai-integrations/mcp
- Pi agents: https://docs.outlit.ai/ai-integrations/pi
- Public tools API: https://docs.outlit.ai/api-reference/tools
- Customer context graph: https://docs.outlit.ai/concepts/customer-context-graph

## Common Prompts

- "What changed for this customer this week?"
- "Who is paying but inactive for 30 days?"
- "What pricing objections show up in conversations?"
- "List recent opportunity sources for Acme."
- "Which channels are driving revenue?"
- "Notify Slack with the high-confidence expansion candidates."
