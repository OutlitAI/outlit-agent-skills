# SQL Guide

Complete documentation for `outlit_query` and `outlit_schema` tools for raw SQL access to analytics data.

---

## Quick Start

### 1. Discover Available Tables

```json
{ "tool": "outlit_schema" }
```

### 2. Explore Table Structure

```json
{ "tool": "outlit_schema", "table": "events" }
```

### 3. Write Your Query

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_type, count(*) as cnt FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10"
}
```

---

## Available Tables

### events

Customer activity events from all channels.

| Column | Type | Description |
|--------|------|-------------|
| `event_id` | UUID | Unique event identifier |
| `event_type` | String | Event type (pageview, click, signup, etc.) |
| `event_channel` | String | Source: SDK, EMAIL, SLACK, CALENDAR, CALL, CRM, BILLING, SUPPORT |
| `customer_id` | String | Customer identifier |
| `customer_domain` | String | Customer's domain |
| `user_id` | String | User identifier |
| `user_email` | String | User's email address |
| `occurred_at` | DateTime64(3) | When the event occurred |
| `properties` | JSON | Event-specific properties |
| `session_id` | String | Browser session ID (SDK events) |
| `organization_id` | String | Organization (auto-filtered by row policy) |

**Example Queries:**

```sql
-- Event distribution
SELECT event_type, count(*) as cnt
FROM events
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20

-- Daily activity
SELECT toDate(occurred_at) as day, count(*) as events
FROM events
WHERE occurred_at >= now() - INTERVAL 30 DAY
GROUP BY 1
ORDER BY 1

-- Events by customer
SELECT customer_id, customer_domain, count(*) as events
FROM events
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT 25

-- Channel breakdown
SELECT event_channel, count(*) as events
FROM events
GROUP BY 1
ORDER BY 2 DESC
```

---

### customer_dimensions

Customer attributes, billing status, and revenue metrics.

| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | String | Customer identifier |
| `domain` | String | Customer's domain |
| `name` | String | Customer name |
| `billing_status` | String | NONE, TRIALING, PAYING, CHURNED |
| `plan` | String | Subscription plan name |
| `mrr_cents` | Int64 | Monthly recurring revenue in cents |
| `lifetime_revenue_cents` | Int64 | Total lifetime revenue in cents |
| `created_at` | DateTime | Customer record creation |
| `first_seen_at` | DateTime | First activity timestamp |
| `churned_at` | DateTime | Churn timestamp (null if active) |
| `attribution_channel` | String | How customer was acquired |
| `industry` | String | Company industry |
| `company_size` | String | Size bucket (1-10, 11-50, etc.) |
| `contact_count` | Int32 | Number of contacts |
| `last_activity_at` | DateTime | Most recent activity |
| `organization_id` | String | Organization (auto-filtered) |

**Example Queries:**

```sql
-- Revenue by billing status
SELECT billing_status,
       count(*) as customers,
       sum(mrr_cents)/100 as mrr_dollars
FROM customer_dimensions
GROUP BY 1

-- Top customers by MRR
SELECT customer_id, name, domain, mrr_cents/100 as mrr
FROM customer_dimensions
WHERE billing_status = 'PAYING'
ORDER BY mrr_cents DESC
LIMIT 20

-- Customers by acquisition channel
SELECT attribution_channel,
       count(*) as customers,
       sum(mrr_cents)/100 as total_mrr
FROM customer_dimensions
WHERE billing_status = 'PAYING'
GROUP BY 1
ORDER BY 3 DESC

-- Churned customer analysis
SELECT toStartOfMonth(churned_at) as churn_month,
       count(*) as churned_customers
FROM customer_dimensions
WHERE churned_at IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC
```

---

### user_dimensions

User attributes within customers.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | String | User identifier |
| `customer_id` | String | Parent customer |
| `email` | String | User email |
| `name` | String | User name |
| `created_at` | DateTime | User creation timestamp |
| `last_activity_at` | DateTime | Most recent activity |
| `organization_id` | String | Organization (auto-filtered) |

**Example Queries:**

```sql
-- Users per customer
SELECT customer_id, count(*) as user_count
FROM user_dimensions
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20

-- Recently active users
SELECT user_id, email, name, last_activity_at
FROM user_dimensions
WHERE last_activity_at >= now() - INTERVAL 7 DAY
ORDER BY last_activity_at DESC
LIMIT 50

-- Users by domain
SELECT splitByChar('@', email)[2] as domain, count(*) as users
FROM user_dimensions
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20
```

---

### mrr_snapshots

Daily MRR snapshots for trend analysis.

| Column | Type | Description |
|--------|------|-------------|
| `customer_id` | String | Customer identifier |
| `snapshot_date` | Date | Snapshot date |
| `mrr_cents` | Int64 | MRR on this date |
| `plan` | String | Plan on this date |
| `billing_status` | String | Billing status on this date |
| `organization_id` | String | Organization (auto-filtered) |

**Example Queries:**

```sql
-- Total MRR over time
SELECT snapshot_date, sum(mrr_cents)/100 as total_mrr
FROM mrr_snapshots
GROUP BY 1
ORDER BY 1

-- MRR by plan over time
SELECT snapshot_date, plan, sum(mrr_cents)/100 as mrr
FROM mrr_snapshots
GROUP BY 1, 2
ORDER BY 1, 2

-- Customer MRR history
SELECT snapshot_date, mrr_cents/100 as mrr, plan
FROM mrr_snapshots
WHERE customer_id = 'cust_123'
ORDER BY 1

-- MRR change analysis
WITH current AS (
  SELECT sum(mrr_cents) as mrr
  FROM mrr_snapshots
  WHERE snapshot_date = today()
),
previous AS (
  SELECT sum(mrr_cents) as mrr
  FROM mrr_snapshots
  WHERE snapshot_date = today() - 30
)
SELECT
  current.mrr/100 as current_mrr,
  previous.mrr/100 as previous_mrr,
  (current.mrr - previous.mrr)/100 as change
FROM current, previous
```

---

## Advanced Query Patterns

### JOINs Between Tables

```sql
-- Customer activity with revenue
SELECT
  cd.customer_id,
  cd.name,
  cd.mrr_cents/100 as mrr,
  count(DISTINCT e.event_id) as event_count,
  count(DISTINCT e.user_id) as active_users
FROM customer_dimensions cd
LEFT JOIN events e ON cd.customer_id = e.customer_id
  AND e.occurred_at >= now() - INTERVAL 30 DAY
GROUP BY cd.customer_id, cd.name, cd.mrr_cents
ORDER BY event_count DESC
LIMIT 25
```

### Window Functions

```sql
-- MRR with month-over-month change
SELECT
  snapshot_date,
  total_mrr,
  total_mrr - lagInFrame(total_mrr) OVER (ORDER BY snapshot_date) as mrr_change
FROM (
  SELECT snapshot_date, sum(mrr_cents)/100 as total_mrr
  FROM mrr_snapshots
  GROUP BY 1
)
ORDER BY snapshot_date DESC
LIMIT 30
```

### CTEs (Common Table Expressions)

```sql
-- Customers with above-average MRR
WITH avg_mrr AS (
  SELECT avg(mrr_cents) as avg_value
  FROM customer_dimensions
  WHERE billing_status = 'PAYING'
)
SELECT customer_id, name, mrr_cents/100 as mrr
FROM customer_dimensions
WHERE mrr_cents > (SELECT avg_value FROM avg_mrr)
  AND billing_status = 'PAYING'
ORDER BY mrr_cents DESC
```

### Time-Based Analysis

```sql
-- Hourly activity pattern
SELECT
  toHour(occurred_at) as hour_of_day,
  count(*) as events
FROM events
WHERE occurred_at >= now() - INTERVAL 7 DAY
GROUP BY 1
ORDER BY 1

-- Day-of-week analysis
SELECT
  toDayOfWeek(occurred_at) as day_of_week,
  count(*) as events
FROM events
WHERE occurred_at >= now() - INTERVAL 30 DAY
GROUP BY 1
ORDER BY 1
```

### Cohort Analysis

```sql
-- Customers by acquisition month
SELECT
  toStartOfMonth(first_seen_at) as cohort_month,
  count(*) as total_customers,
  countIf(billing_status = 'PAYING') as paying_customers,
  sum(mrr_cents)/100 as total_mrr
FROM customer_dimensions
GROUP BY 1
ORDER BY 1 DESC
```

---

## Security Model

The SQL tool implements multi-layer security:

### What's Allowed

| Feature | Status |
|---------|--------|
| SELECT queries | Allowed |
| JOINs between allowed tables | Allowed |
| Aggregations (COUNT, SUM, AVG, etc.) | Allowed |
| Window functions | Allowed |
| CTEs (WITH clauses) | Allowed |
| Subqueries | Allowed |
| Standard ClickHouse functions | Allowed |
| LIMIT clause | Allowed |
| ORDER BY clause | Allowed |
| GROUP BY clause | Allowed |
| WHERE conditions | Allowed |

### What's Blocked

| Feature | Status | Reason |
|---------|--------|--------|
| INSERT queries | Blocked | Read-only access |
| UPDATE queries | Blocked | Read-only access |
| DELETE queries | Blocked | Read-only access |
| DROP/CREATE/ALTER | Blocked | Schema modification |
| system.* tables | Blocked | System information |
| information_schema.* | Blocked | Database metadata |
| file() function | Blocked | External file access |
| url() function | Blocked | External URL access |
| remote() function | Blocked | Remote server access |
| s3() function | Blocked | Cloud storage access |
| sleep() function | Blocked | DoS prevention |
| Multiple statements (;) | Blocked | Query stacking |
| SETTINGS clause | Blocked | Configuration override |

### Organization Isolation

All queries are automatically filtered to your organization's data via ClickHouse row policies. You cannot access data from other organizations.

---

## Error Handling

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `SYNTAX_ERROR` | SQL doesn't parse | Check ClickHouse SQL syntax |
| `QUERY_NOT_ALLOWED` | Non-SELECT query | Rewrite as SELECT |
| `TABLE_NOT_FOUND` | Table doesn't exist | Use `outlit_schema` to see tables |
| `FUNCTION_NOT_ALLOWED` | Blocked function | Use standard functions |
| `EXECUTION_ERROR` | Runtime error | Add filters, reduce scope |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "TABLE_NOT_FOUND",
    "message": "Table 'users' is not available.",
    "hint": "Available tables: events, customer_dimensions, user_dimensions, mrr_snapshots. Use outlit_schema tool to see column details."
  }
}
```

### Common Issues

**"Table not found"**
- Use only: `events`, `customer_dimensions`, `user_dimensions`, `mrr_snapshots`
- Run `outlit_schema` to see all available tables

**"Function not allowed"**
- Avoid: `file()`, `url()`, `remote()`, `s3()`, `sleep()`
- Use standard aggregation and transformation functions

**"Syntax error"**
- ClickHouse uses different syntax than MySQL/PostgreSQL
- Date functions: `toDate()`, `toStartOfMonth()`, `now()`
- Use `INTERVAL 30 DAY` instead of `DATE_SUB()`

**Query timeout**
- Add WHERE clauses to filter data
- Use LIMIT to cap results
- Avoid `SELECT *` on large tables

---

## ClickHouse SQL Tips

### Date/Time Functions

```sql
-- Current time
now()

-- Date extraction
toDate(occurred_at)
toStartOfMonth(occurred_at)
toStartOfWeek(occurred_at)
toHour(occurred_at)
toDayOfWeek(occurred_at)

-- Date arithmetic
occurred_at >= now() - INTERVAL 30 DAY
occurred_at BETWEEN '2025-01-01' AND '2025-01-31'

-- Date formatting
formatDateTime(occurred_at, '%Y-%m-%d')
```

### Conditional Aggregation

```sql
-- Count with conditions
countIf(billing_status = 'PAYING') as paying_count
sumIf(mrr_cents, billing_status = 'PAYING') as paying_mrr

-- CASE expressions
CASE
  WHEN mrr_cents > 100000 THEN 'Enterprise'
  WHEN mrr_cents > 10000 THEN 'Mid-Market'
  ELSE 'SMB'
END as segment
```

### Array Operations

```sql
-- Split string to array
splitByChar('@', email)[2] as domain

-- Array contains
has(arrayOfTags, 'important')
```

### NULL Handling

```sql
-- Null checks
WHERE churned_at IS NULL
WHERE churned_at IS NOT NULL

-- Coalesce
coalesce(name, 'Unknown')

-- Null-safe equality
customer_id = 'cust_123'  -- Works with NULLs
```

---

## Performance Best Practices

1. **Always add time filters** — Queries without date ranges scan all data
2. **Use LIMIT** — Avoid returning millions of rows
3. **Filter early** — Put WHERE conditions before aggregations
4. **Select specific columns** — Avoid `SELECT *`
5. **Use appropriate granularity** — Don't over-aggregate

### Good Patterns

```sql
-- Filtered by date, limited results
SELECT event_type, count(*)
FROM events
WHERE occurred_at >= now() - INTERVAL 7 DAY
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20

-- Specific columns only
SELECT customer_id, name, mrr_cents
FROM customer_dimensions
WHERE billing_status = 'PAYING'
```

### Patterns to Avoid

```sql
-- No date filter (scans all data)
SELECT * FROM events

-- No LIMIT on large result
SELECT customer_id, occurred_at FROM events

-- Overly complex without filters
SELECT * FROM events e
JOIN customer_dimensions cd ON e.customer_id = cd.customer_id
JOIN user_dimensions ud ON e.user_id = ud.user_id
```

---

## Response Format

### Successful Query

```json
{
  "success": true,
  "data": [
    { "event_type": "pageview", "cnt": 45123 },
    { "event_type": "click", "cnt": 23456 }
  ],
  "metadata": {
    "rowsReturned": 2,
    "executionTimeMs": 47,
    "truncated": false
  }
}
```

### Truncated Results

When results exceed the limit:

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "rowsReturned": 1000,
    "executionTimeMs": 234,
    "truncated": true
  }
}
```

If `truncated: true`, add more WHERE filters or increase the limit (max 10000).

---

## When to Use SQL vs Customer Tools

| Use Case | Recommended Tool |
|----------|------------------|
| Single customer lookup | `outlit_get_customer` |
| Customer list with filters | `outlit_list_customers` |
| Activity timeline | `outlit_get_timeline` |
| Revenue for one customer | `outlit_get_customer_revenue` |
| Aggregate metrics (MRR, churn) | `outlit_query` (SQL) |
| Custom aggregations | `outlit_query` (SQL) |
| Complex JOINs | `outlit_query` (SQL) |
| Ad-hoc exploration | `outlit_query` (SQL) |
| Time-series analysis | `outlit_query` (SQL) |
| Cross-table analysis | `outlit_query` (SQL) |

**Rule of thumb:** Use dedicated customer tools for single-entity lookups. Use `outlit_query` with SQL for aggregations, trends, and custom analytics.
