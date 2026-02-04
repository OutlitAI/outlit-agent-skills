---
name: outlit-mcp
description: Use when querying Outlit customer data via MCP tools (outlit_*). Triggers on customer analytics, revenue metrics, activity timelines, cohort analysis, churn risk assessment, SQL queries against analytics data, or any Outlit data exploration task.
---

# Outlit MCP Server

Query customer intelligence data through 7 MCP tools covering customer profiles, revenue metrics, activity timelines, and raw SQL analytics access.

## Quick Start

```dot
digraph quickstart {
    rankdir=LR;
    node [shape=box];

    start [label="What data?" shape=diamond];

    customer_list [label="Multiple\ncustomers"];
    customer_single [label="Single\ncustomer"];
    analytics [label="Custom\nanalytics"];
    discover [label="Schema\ndiscovery"];

    list_tool [label="outlit_list_customers" shape=ellipse style=filled fillcolor=lightblue];
    detail_tool [label="outlit_get_customer" shape=ellipse style=filled fillcolor=lightblue];
    query_tool [label="outlit_query" shape=ellipse style=filled fillcolor=lightyellow];
    schema_tool [label="outlit_schema" shape=ellipse style=filled fillcolor=lightgray];

    start -> customer_list -> list_tool;
    start -> customer_single -> detail_tool;
    start -> analytics -> query_tool;
    start -> discover -> schema_tool;
}
```

### First Call: Schema Discovery

Before writing SQL queries, discover available tables and columns:

```json
// Discover SQL tables and columns
{ "tool": "outlit_schema" }

// Discover available data entities
{ "tool": "outlit_list_entities" }
```

### Common Patterns

**Find at-risk customers:**

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "noActivityInLast": "30d",
  "orderBy": "currentMrr",
  "orderDirection": "desc"
}
```

**Revenue breakdown (SQL):**

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customers, sum(mrr_cents)/100 as mrr_dollars FROM customer_dimensions GROUP BY 1 ORDER BY 3 DESC"
}
```

**Event analytics (SQL):**

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_type, count(*) FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 2 DESC LIMIT 10"
}
```

---

## Tool Selection Guide

```dot
digraph tool_selection {
    rankdir=TB;
    node [shape=box fontsize=10];
    edge [fontsize=9];

    start [label="What do you need?" shape=diamond];

    // First level decisions
    list [label="Browse/filter customers"];
    single [label="Single customer deep dive"];
    aggregate [label="Aggregated metrics"];
    discover [label="Explore schema"];

    // Tool outcomes
    list_customers [label="outlit_list_customers" shape=ellipse style=filled fillcolor=lightblue];
    get_customer [label="outlit_get_customer" shape=ellipse style=filled fillcolor=lightblue];
    get_timeline [label="outlit_get_timeline" shape=ellipse style=filled fillcolor=lightblue];
    get_revenue [label="outlit_get_customer_revenue" shape=ellipse style=filled fillcolor=lightblue];
    query [label="outlit_query (SQL)" shape=ellipse style=filled fillcolor=lightyellow];
    schema [label="outlit_schema" shape=ellipse style=filled fillcolor=lightgray];
    list_entities [label="outlit_list_entities" shape=ellipse style=filled fillcolor=lightgray];

    start -> list [label="segments, at-risk lists"];
    start -> single [label="specific customer"];
    start -> aggregate [label="reports, dashboards, SQL"];
    start -> discover [label="what's available?"];

    list -> list_customers;

    single -> get_customer [label="overview + contacts"];
    single -> get_timeline [label="activity history"];
    single -> get_revenue [label="billing data"];

    aggregate -> query [label="write SQL"];
    aggregate -> schema [label="see columns first"];

    discover -> list_entities;
    discover -> schema;
}
```

### Quick Reference

| Tool | Purpose | Key Params |
|------|---------|------------|
| `outlit_list_customers` | Filter/paginate customers | `billingStatus`, `noActivityInLast`, `mrrAbove` |
| `outlit_get_customer` | Single customer details | `customer`, `include[]`, `timeframe` |
| `outlit_get_timeline` | Activity history | `customer`, `channels[]`, `eventTypes[]` |
| `outlit_get_customer_revenue` | Revenue + attribution | `customer`, `includeAttribution` |
| `outlit_query` | Raw SQL queries | `sql`, `limit` |
| `outlit_schema` | SQL table schemas | `table` (optional) |
| `outlit_list_entities` | Available entities | (none) |

---

## References

| Reference | When to Read |
|-----------|--------------|
| [Query Patterns](references/query-patterns.md) | SQL examples for common analytics: MRR, cohorts, events, churn |
| [SQL Guide](references/sql-guide.md) | Complete table schemas, security model, ClickHouse tips |
| [Workflows](references/workflows.md) | Multi-step analysis: churn risk, revenue dashboards, segmentation |
| [Troubleshooting](references/troubleshooting.md) | Error codes, common issues, debugging strategies |
| [Responses](references/responses.md) | Full response examples, parsing guidance |

---

## Core Tools

### outlit_list_customers

Filter and paginate customers with risk signal indicators.

| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| `status` | enum | PROVISIONAL, ACTIVE, CHURNED, MERGED | (all) |
| `billingStatus` | enum | NONE, TRIALING, PAYING, CHURNED | (all) |
| `type` | enum | COMPANY, INDIVIDUAL | (all) |
| `hasActivityInLast` | enum | 7d, 14d, 30d, 90d | (none) |
| `noActivityInLast` | enum | 7d, 14d, 30d, 90d | (none) |
| `mrrAbove` | number | cents (e.g., 10000 = $100) | (none) |
| `mrrBelow` | number | cents | (none) |
| `search` | string | name or domain | (none) |
| `orderBy` | enum | lastActivityAt, firstSeenAt, name, currentMrr | lastActivityAt |
| `orderDirection` | enum | asc, desc | desc |
| `limit` | number | 1-100 | 20 |
| `cursor` | string | pagination token | (none) |

**Risk Signals** (returned in response): `healthy` (≤7d), `at_risk` (7-30d), `critical` (30d+)

**Example - High-value at-risk:**

```json
{
  "billingStatus": "PAYING",
  "noActivityInLast": "30d",
  "mrrAbove": 50000,
  "orderBy": "currentMrr",
  "orderDirection": "desc",
  "limit": 25
}
```

### outlit_get_customer

Get complete customer profile with optional includes.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `customer` | string | Customer ID, domain, or name | Yes |
| `include` | array | Data sections to fetch | No |
| `timeframe` | enum | 7d, 30d, 90d | No (30d) |

**Include Options:** `contacts` (journey stages), `revenue` (MRR, LTV), `recentTimeline` (activity events), `behaviorMetrics` (activity counts)

**Example - Full profile:**

```json
{
  "customer": "acme.com",
  "include": ["contacts", "revenue", "recentTimeline", "behaviorMetrics"],
  "timeframe": "30d"
}
```

### outlit_get_timeline

Get activity timeline for a customer.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `customer` | string | Customer ID or domain | Yes |
| `channels` | array | Filter by channel | No |
| `eventTypes` | array | Filter by event type | No |
| `startDate` | string | ISO 8601 timestamp | No |
| `endDate` | string | ISO 8601 timestamp | No |
| `limit` | number | 1-100 | No (50) |
| `cursor` | string | Pagination token | No |

**Channels:** `EMAIL`, `SLACK`, `INTERCOM`, `CALENDAR`, `CALL`, `DOCUMENT`

**Example - Email and meeting activity:**

```json
{
  "customer": "cust_123",
  "channels": ["EMAIL", "CALENDAR"],
  "limit": 50
}
```

### outlit_get_customer_revenue

Get revenue metrics and attribution for a customer.

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `customer` | string | Customer ID or domain | Yes |
| `timeframe` | enum | 30d, 90d, 12m, all | No (12m) |
| `includeAttribution` | boolean | Include UTM/channel data | No (true) |
| `includeBillingHistory` | boolean | Include billing events | No (true) |

**Example:**

```json
{
  "customer": "acme.com",
  "includeAttribution": true,
  "includeBillingHistory": true
}
```

---

## Raw SQL: outlit_query

Execute custom SQL queries against analytics data with built-in security.

### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `sql` | string | SQL SELECT query | Yes |
| `limit` | number | Max rows (1-10000) | No (1000) |

**Available tables:** `events`, `customer_dimensions`, `user_dimensions`, `mrr_snapshots`

Use `outlit_schema` to discover columns before writing queries.

**Security:** Only SELECT queries allowed. Organization data isolated via row policies. External access functions blocked.

### Quick SQL Examples

**MRR by billing status:**
```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customers, sum(mrr_cents)/100 as mrr FROM customer_dimensions GROUP BY 1"
}
```

**Daily event volume:**
```json
{
  "tool": "outlit_query",
  "sql": "SELECT toDate(occurred_at) as day, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 1"
}
```

**Top customers by activity:**
```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_id, customer_domain, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 25"
}
```

See [Query Patterns](references/query-patterns.md) for comprehensive SQL examples covering all common analytics use cases.

See [SQL Guide](references/sql-guide.md) for complete table schemas, security model, and error handling.

---

## Schema Discovery

### outlit_schema

Get table schemas for SQL queries.

```json
// All tables
{ "tool": "outlit_schema" }

// Specific table with columns
{ "tool": "outlit_schema", "table": "events" }
```

**Response includes:** Column names, types, descriptions, and example queries.

### outlit_list_entities

List all queryable data entities.

```json
{ "tool": "outlit_list_entities" }
```

### outlit_get_entity_schema

Get detailed schema for a specific entity.

```json
{ "tool": "outlit_get_entity_schema", "entity": "customer" }
```

---

## Data Model

### Customer States

**`status`:** PROVISIONAL (new), ACTIVE (active customer), CHURNED (no longer active), MERGED (combined with another)

**`billingStatus`:** NONE (no billing), TRIALING (trial period), PAYING (active subscription), CHURNED (cancelled)

### Contact Journey Stages

```text
DISCOVERED → SIGNED_UP → ACTIVATED → ENGAGED → INACTIVE
```

### Data Formats

- **Monetary values:** Cents (100 = $1.00)
- **Timestamps:** ISO 8601 (`2025-01-15T10:30:00Z`)
- **IDs:** String prefixes (`cust_`, `contact_`, `evt_`)

---

## Pagination

All list endpoints use cursor-based pagination:

```json
// First request
{ "tool": "outlit_list_customers", "limit": 25 }

// Response
{
  "items": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJsYXN0QWN0aXZpdHlBdCI6Li4ufQ==",
    "total": 156
  }
}

// Next page
{ "tool": "outlit_list_customers", "limit": 25, "cursor": "eyJsYXN0QWN0aXZpdHlBdCI6Li4ufQ==" }
```

**Always check `pagination.hasMore` before requesting more pages.**

---

## Best Practices

1. **Start with schema discovery** — Call `outlit_schema` before writing SQL
2. **Use filters at the source** — Filter in the query, not after fetching
3. **Request only needed includes** — Omit `include` options you don't need
4. **Prefer customer tools for single lookups** — Don't use SQL for single customer queries
5. **Add time filters to SQL** — Always include `WHERE occurred_at >= ...` for event queries
6. **Convert cents to dollars** — Divide monetary values by 100 for display
7. **Use LIMIT in SQL** — Cap result sets to avoid large data transfers

## Known Limitations

1. **SQL is read-only**: No INSERT, UPDATE, DELETE operations
2. **Organization isolation**: Cannot query data from other organizations
3. **Timeline requires customer**: Cannot query timeline across all customers
4. **MRR filtering is post-fetch**: May be slower on large datasets in list_customers
5. **Event queries require time filters**: Queries without date ranges scan all data

---

## Troubleshooting

See [Troubleshooting Guide](references/troubleshooting.md) for detailed solutions.

**Quick fixes:**

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check authentication, re-authorize MCP connection |
| 404 Not Found | Verify customer ID/domain exists |
| Empty results | Widen filters, check timeframe |
| Slow queries | Add filters, reduce limit, add time constraints |
| SQL table not found | Use `outlit_schema` to see available tables |
| SQL syntax error | Check ClickHouse syntax (not MySQL/PostgreSQL) |
