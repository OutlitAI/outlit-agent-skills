---
name: outlit-mcp
description: Use when querying Outlit customer data via MCP tools (outlit_*). Triggers on customer analytics, revenue metrics, activity timelines, cohort analysis, churn risk assessment, SQL queries against analytics data, or any Outlit data exploration task.
---

# Outlit MCP Server

Query customer intelligence data through 8 MCP tools covering customer profiles, user activity, facts, semantic search, revenue metrics, and raw SQL analytics.

## Quick Start — Which Tool to Use

| What you need | Tool |
|---------------|------|
| Browse/filter customers | `outlit_list_customers` |
| Browse/filter users | `outlit_list_users` |
| Single customer deep dive | `outlit_get_customer` |
| What happened with a customer? | `outlit_get_timeline` |
| What do we know about a customer? | `outlit_get_facts` |
| Question about a customer or topic | `outlit_search_customer_context` |
| Custom analytics / aggregations | `outlit_query` (SQL) |
| Discover tables & columns | `outlit_schema` |

### Facts vs Search vs Timeline — When to Use Each

These three tools all surface customer context but serve different purposes:

| Tool | Purpose | Example |
|------|---------|---------|
| `outlit_get_facts` | **List all known facts** about a customer with status/confidence | "Show me everything we know about Acme" |
| `outlit_search_customer_context` | **Find relevant context** for a specific question | "What has Acme said about pricing?" |
| `outlit_get_timeline` | **See what happened** in chronological order | "What happened with Acme last week?" |

**Rule of thumb:** Use `get_facts` to browse, `search_customer_context` to answer questions, `get_timeline` to see chronology.

**Before writing SQL:** Always call `outlit_schema` first to discover available tables and columns.

### Common Patterns

**Find at-risk customers:**
```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "noActivityInLast": "30d",
  "orderBy": "mrr_cents",
  "orderDirection": "desc"
}
```

**Find context about a topic across all customers:**
```json
{
  "tool": "outlit_search_customer_context",
  "query": "data retention compliance concerns"
}
```

**Revenue breakdown (SQL):**
```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customers, sum(mrr_cents)/100 as mrr_dollars FROM customer_dimensions GROUP BY 1 ORDER BY 3 DESC"
}
```

---

## MCP Setup

### Get an API Key

Go to **Settings > MCP Integration** in the Outlit dashboard ([app.outlit.ai](https://app.outlit.ai)).

### Auto-Detection Setup

Detect the current environment and run the appropriate setup command:

1. **Check for Claude Code** — If running inside Claude Code (check if `claude` CLI is available), run:
   ```bash
   claude mcp add outlit https://mcp.outlit.ai/mcp -- --header "Authorization: Bearer API_KEY"
   ```

2. **Check for Cursor** — If `.cursor/mcp.json` exists in the project or home directory, add to that file:
   ```json
   {
     "mcpServers": {
       "outlit": {
         "url": "https://mcp.outlit.ai/mcp",
         "headers": { "Authorization": "Bearer API_KEY" }
       }
     }
   }
   ```

3. **Check for Claude Desktop** — If `claude_desktop_config.json` exists at `~/Library/Application Support/Claude/` (macOS) or `%APPDATA%/Claude/` (Windows), add to that file:
   ```json
   {
     "mcpServers": {
       "outlit": {
         "url": "https://mcp.outlit.ai/mcp",
         "headers": { "Authorization": "Bearer API_KEY" }
       }
     }
   }
   ```

Ask the user for their API key if not provided. Replace `API_KEY` with the actual key.

### Verify Connection

Call `outlit_schema` to confirm the connection is working.

---

## Tool Reference

### outlit_list_customers

Browse and filter customers. Returns paginated list with summary info.

| Key Params | Values |
|------------|--------|
| `billingStatus` | NONE, TRIALING, PAYING, CHURNED |
| `hasActivityInLast` / `noActivityInLast` | 7d, 14d, 30d, 90d (mutually exclusive) |
| `mrrAbove` / `mrrBelow` | cents (10000 = $100) |
| `search` | name or domain |
| `orderBy` | last_activity_at, first_seen_at, name, mrr_cents |
| `limit` | 1-1000 (default: 20) |
| `cursor` | pagination token |

### outlit_list_users

Browse and filter users. Returns paginated list with activity info.

| Key Params | Values |
|------------|--------|
| `journeyStage` | DISCOVERED, SIGNED_UP, ACTIVATED, ENGAGED, INACTIVE |
| `customerId` | filter by customer |
| `hasActivityInLast` / `noActivityInLast` | Nd, Nh, or Nm (e.g., 7d, 24h) — mutually exclusive |
| `search` | email or name |
| `orderBy` | last_activity_at, first_seen_at, email |
| `limit` | 1-1000 (default: 20) |
| `cursor` | pagination token |

### outlit_get_customer

Full details for a single customer. Accepts customer ID, domain, or name.

| Key Params | Values |
|------------|--------|
| `customer` | customer ID, domain, or name (required) |
| `include` | `users`, `revenue`, `recentTimeline`, `behaviorMetrics` |
| `timeframe` | 7d, 14d, 30d, 90d (default: 30d) |

Only request the `include` sections you need — omitting unused ones is faster.

### outlit_get_timeline

Chronological activity timeline for a customer.

| Key Params | Values |
|------------|--------|
| `customer` | customer ID or domain (required) |
| `channels` | SDK, EMAIL, SLACK, CALL, CRM, BILLING, SUPPORT, INTERNAL |
| `eventTypes` | filter by specific event types |
| `timeframe` | 7d, 14d, 30d, 90d, all (default: 30d) |
| `startDate` / `endDate` | ISO 8601 (mutually exclusive with timeframe) |
| `limit` | 1-1000 (default: 50) |
| `cursor` | pagination token |

### outlit_get_facts

List all structured facts known about a customer. Use `outlit_search_customer_context` instead if you have a specific question.

| Key Params | Values |
|------------|--------|
| `customer` | customer ID or domain (required) |
| `timeframe` | 7d, 14d, 30d, 90d, all (default: 30d) |
| `limit` | 1-100 (default: 50) |
| `cursor` | pagination token |

### outlit_search_customer_context

Semantic + full-text search over customer context (facts and emails). Use this to answer specific questions. Omit `customer` to search across all customers.

| Key Params | Values |
|------------|--------|
| `customer` | customer ID, domain, or name (optional — omit for cross-customer search) |
| `query` | natural language question or topic (required) |
| `topK` | 1-50 (default: 20) |
| `occurredAfter` / `occurredBefore` | ISO 8601 datetime bounds |

### outlit_query

Raw SQL against ClickHouse analytics tables. **SELECT only.** See [SQL Reference](references/sql-reference.md) for ClickHouse syntax and security model.

| Key Params | Values |
|------------|--------|
| `sql` | SQL SELECT query (required) |
| `limit` | 1-10000 (default: 1000) |

Available tables: `events`, `customer_dimensions`, `user_dimensions`, `mrr_snapshots`.

### outlit_schema

Discover tables and columns. Call with no params for all tables, or `table: "events"` for a specific table. Always call this before writing SQL.

---

## Data Model

**Billing status:** NONE → TRIALING → PAYING → CHURNED

**Journey stages:** DISCOVERED → SIGNED_UP → ACTIVATED → ENGAGED → INACTIVE

**Data formats:**
- Monetary values in cents (divide by 100 for dollars)
- Timestamps in ISO 8601
- IDs with string prefixes (`cust_`, `contact_`, `evt_`)

**Pagination:** All list endpoints use cursor-based pagination. Check `pagination.hasMore` before requesting more pages. Pass `pagination.nextCursor` as `cursor` for the next page.

---

## Best Practices

1. **Call `outlit_schema` before writing SQL** — discover columns, don't guess
2. **Use customer tools for single lookups** — don't use SQL for individual customer queries
3. **Use search for questions, get_facts for browsing** — search ranks by relevance, facts lists everything
4. **Filter at the source** — use tool params and WHERE clauses, not post-fetch filtering
5. **Only request needed includes** — omit unused `include` options for faster responses
6. **Always add time filters to event SQL** — `WHERE occurred_at >= now() - INTERVAL N DAY`
7. **Convert cents to dollars** — divide monetary values by 100 for display
8. **Use LIMIT in SQL** — cap result sets to avoid large data transfers

## Known Limitations

1. **SQL is read-only** — no INSERT, UPDATE, DELETE
2. **Organization isolation** — cannot query other organizations' data
3. **Timeline requires a customer** — cannot query timeline across all customers
4. **MRR filtering is post-fetch** — may be slower on large datasets in list_customers
5. **Event queries need time filters** — queries without date ranges scan all data
6. **ClickHouse syntax** — uses different functions than MySQL/PostgreSQL (see [SQL Reference](references/sql-reference.md))

---

## Tool Gotchas

| Tool | Gotcha |
|------|--------|
| `outlit_list_customers` | `hasActivityInLast` and `noActivityInLast` are mutually exclusive |
| `outlit_list_customers` | `search` checks name and domain only |
| `outlit_get_customer` | `behaviorMetrics` depends on timeframe — extend it if empty |
| `outlit_get_timeline` | `timeframe` and `startDate`/`endDate` are mutually exclusive |
| `outlit_search_customer_context` | Omit `customer` to search across all customers |
| `outlit_query` | Use ClickHouse date syntax: `now() - INTERVAL 30 DAY`, not `DATE_SUB()` |
| `outlit_query` | `properties` column is JSON — use `JSONExtractString(properties, 'key')` |

---

## References

| Reference | When to Read |
|-----------|--------------|
| [SQL Reference](references/sql-reference.md) | ClickHouse syntax, security model, query patterns |
| [Workflows](references/workflows.md) | Multi-step analysis: churn risk, revenue dashboards, account health |
