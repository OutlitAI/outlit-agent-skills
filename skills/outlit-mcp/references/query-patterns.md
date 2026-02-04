# SQL Query Patterns Reference

Comprehensive SQL examples for common analytics use cases using the `outlit_query` tool.

---

## Quick Index

| Analytics Category | Purpose | Jump to |
|-------------------|---------|---------|
| Customer Cohorts | Find customers by filters | [→](#customer-cohorts) |
| Customer Metrics | Count customers by segment | [→](#customer-metrics) |
| Revenue Metrics | MRR, LTV, ARPU, churn | [→](#revenue-metrics) |
| Revenue Attribution | Revenue by channel | [→](#revenue-attribution) |
| Revenue Trends | Revenue over time | [→](#revenue-trends) |
| Event Aggregates | Event counts | [→](#event-aggregates) |
| Event Trends | Event time series | [→](#event-trends) |
| Feature Usage | Feature adoption | [→](#feature-usage) |
| Session Metrics | Sessions, pageviews | [→](#session-metrics) |
| Communication Summary | Email, call, slack activity | [→](#communication-summary) |
| Cohort Analysis | Acquisition cohorts | [→](#cohort-analysis) |
| Cross-Table Analysis | JOINs and complex queries | [→](#cross-table-analysis) |

---

## Available Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `customer_dimensions` | Customer attributes | `customer_id`, `billing_status`, `mrr_cents`, `plan` |
| `events` | Activity events | `event_type`, `event_channel`, `customer_id`, `occurred_at` |
| `user_dimensions` | User attributes | `user_id`, `customer_id`, `email`, `name` |
| `mrr_snapshots` | Daily MRR history | `customer_id`, `snapshot_date`, `mrr_cents` |

Use `outlit_schema` to see full column definitions.

---

## Customer Cohorts

Find and filter customers matching specific criteria.

### At-Risk Paying Customers

Customers who are paying but haven't been active recently.

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_id, name, domain, mrr_cents/100 as mrr_dollars, last_activity_at, dateDiff('day', last_activity_at, now()) as days_inactive FROM customer_dimensions WHERE billing_status = 'PAYING' AND last_activity_at < now() - INTERVAL 30 DAY ORDER BY mrr_cents DESC LIMIT 25"
}
```

### High-Value Enterprise Customers

Top customers by MRR.

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_id, name, domain, mrr_cents/100 as mrr_dollars, plan, billing_status FROM customer_dimensions WHERE billing_status = 'PAYING' AND mrr_cents >= 100000 ORDER BY mrr_cents DESC LIMIT 50"
}
```

### Trial Customers with Recent Activity

Active trial customers who might convert.

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_id, name, domain, first_seen_at, last_activity_at FROM customer_dimensions WHERE billing_status = 'TRIALING' AND last_activity_at >= now() - INTERVAL 7 DAY ORDER BY last_activity_at DESC"
}
```

### Churned Customers by Acquisition Channel

Analyze which channels have highest churn.

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, count(*) as churned_customers, sum(mrr_cents)/100 as lost_mrr FROM customer_dimensions WHERE billing_status = 'CHURNED' AND churned_at >= now() - INTERVAL 90 DAY GROUP BY 1 ORDER BY 2 DESC"
}
```

### Customers by Industry

Segment by company attributes.

```json
{
  "tool": "outlit_query",
  "sql": "SELECT industry, count(*) as customers, sum(mrr_cents)/100 as total_mrr, avg(mrr_cents)/100 as avg_mrr FROM customer_dimensions WHERE billing_status = 'PAYING' AND industry != '' GROUP BY 1 ORDER BY 3 DESC"
}
```

---

## Customer Metrics

Aggregate customer counts by segments.

### Customer Count by Billing Status

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customer_count FROM customer_dimensions GROUP BY 1 ORDER BY 2 DESC"
}
```

### Distribution by Customer Type

```json
{
  "tool": "outlit_query",
  "sql": "SELECT CASE WHEN contact_count = 1 THEN 'INDIVIDUAL' ELSE 'COMPANY' END as customer_type, count(*) as customers, sum(mrr_cents)/100 as total_mrr FROM customer_dimensions WHERE billing_status = 'PAYING' GROUP BY 1"
}
```

### Multi-Dimension Breakdown

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, plan, count(*) as customers FROM customer_dimensions WHERE plan != '' GROUP BY 1, 2 ORDER BY 1, 3 DESC"
}
```

### Customers by Company Size

```json
{
  "tool": "outlit_query",
  "sql": "SELECT company_size, count(*) as customers, avg(mrr_cents)/100 as avg_mrr FROM customer_dimensions WHERE billing_status = 'PAYING' AND company_size != '' GROUP BY 1 ORDER BY 2 DESC"
}
```

---

## Revenue Metrics

Calculate MRR, LTV, ARPU, and churn metrics.

### Total MRR

```json
{
  "tool": "outlit_query",
  "sql": "SELECT sum(mrr_cents)/100 as total_mrr, count(*) as paying_customers FROM customer_dimensions WHERE billing_status = 'PAYING'"
}
```

### MRR by Billing Status

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customers, sum(mrr_cents)/100 as mrr_dollars FROM customer_dimensions GROUP BY 1 ORDER BY 3 DESC"
}
```

### MRR by Plan

```json
{
  "tool": "outlit_query",
  "sql": "SELECT plan, count(*) as customers, sum(mrr_cents)/100 as total_mrr, avg(mrr_cents)/100 as avg_mrr FROM customer_dimensions WHERE billing_status = 'PAYING' AND plan != '' GROUP BY 1 ORDER BY 3 DESC"
}
```

### ARPU Calculation

Average revenue per user.

```json
{
  "tool": "outlit_query",
  "sql": "SELECT sum(mrr_cents)/100 / count(*) as arpu_dollars FROM customer_dimensions WHERE billing_status = 'PAYING' AND mrr_cents > 0"
}
```

### Lifetime Revenue Distribution

```json
{
  "tool": "outlit_query",
  "sql": "SELECT CASE WHEN lifetime_revenue_cents < 100000 THEN 'Under $1K' WHEN lifetime_revenue_cents < 1000000 THEN '$1K-$10K' WHEN lifetime_revenue_cents < 10000000 THEN '$10K-$100K' ELSE 'Over $100K' END as ltv_bucket, count(*) as customers, sum(lifetime_revenue_cents)/100 as total_ltv FROM customer_dimensions WHERE lifetime_revenue_cents > 0 GROUP BY 1 ORDER BY 3 DESC"
}
```

### Churn Analysis

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfMonth(churned_at) as churn_month, count(*) as churned_customers, sum(mrr_cents)/100 as churned_mrr FROM customer_dimensions WHERE churned_at IS NOT NULL AND churned_at >= now() - INTERVAL 12 MONTH GROUP BY 1 ORDER BY 1 DESC"
}
```

---

## Revenue Attribution

Analyze revenue by acquisition channel.

### Revenue by Channel

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, count(*) as customers, sum(mrr_cents)/100 as total_mrr, avg(mrr_cents)/100 as avg_mrr FROM customer_dimensions WHERE billing_status = 'PAYING' AND attribution_channel != '' GROUP BY 1 ORDER BY 3 DESC"
}
```

### Customer Acquisition by Channel

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, toStartOfMonth(first_seen_at) as month, count(*) as new_customers FROM customer_dimensions WHERE attribution_channel != '' AND first_seen_at >= now() - INTERVAL 12 MONTH GROUP BY 1, 2 ORDER BY 2 DESC, 3 DESC"
}
```

### Channel Conversion Efficiency

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, count(*) as total_customers, countIf(billing_status = 'PAYING') as paying_customers, countIf(billing_status = 'PAYING') * 100.0 / count(*) as conversion_rate FROM customer_dimensions WHERE attribution_channel != '' GROUP BY 1 ORDER BY 4 DESC"
}
```

---

## Revenue Trends

Track revenue over time with configurable granularity.

### Monthly MRR Trend

```json
{
  "tool": "outlit_query",
  "sql": "SELECT snapshot_date, sum(mrr_cents)/100 as total_mrr FROM mrr_snapshots WHERE snapshot_date >= today() - 365 GROUP BY 1 ORDER BY 1"
}
```

### Daily MRR (Last 30 Days)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT snapshot_date, sum(mrr_cents)/100 as total_mrr, count(distinct customer_id) as paying_customers FROM mrr_snapshots WHERE snapshot_date >= today() - 30 GROUP BY 1 ORDER BY 1"
}
```

### MRR by Plan Over Time

```json
{
  "tool": "outlit_query",
  "sql": "SELECT snapshot_date, plan, sum(mrr_cents)/100 as mrr FROM mrr_snapshots WHERE snapshot_date >= today() - 90 AND plan != '' GROUP BY 1, 2 ORDER BY 1, 3 DESC"
}
```

### Month-over-Month Growth

```json
{
  "tool": "outlit_query",
  "sql": "WITH monthly AS (SELECT toStartOfMonth(snapshot_date) as month, max(sum(mrr_cents)) as mrr FROM mrr_snapshots GROUP BY month, snapshot_date) SELECT month, mrr/100 as mrr_dollars FROM monthly ORDER BY 1 DESC LIMIT 12"
}
```

### Customer MRR History

```json
{
  "tool": "outlit_query",
  "sql": "SELECT snapshot_date, mrr_cents/100 as mrr, plan, billing_status FROM mrr_snapshots WHERE customer_id = 'cust_123' ORDER BY 1"
}
```

---

## Event Aggregates

Count events by type, channel, or customer.

### Event Counts by Type

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_type, count(*) as event_count FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 2 DESC LIMIT 20"
}
```

### Activity by Channel

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_channel, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 2 DESC"
}
```

### Top Customers by Event Volume

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_id, customer_domain, count(*) as event_count FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 25"
}
```

### Specific Event Types

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_type, count(*) as occurrences FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type IN ('pageview', 'form_submission', 'button_click', 'signup') GROUP BY 1 ORDER BY 2 DESC"
}
```

### Events by Customer and Channel

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_domain, event_channel, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 7 DAY AND event_channel IN ('EMAIL', 'SLACK', 'CALENDAR') GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 50"
}
```

---

## Event Trends

Time-series event data with configurable granularity.

### Daily Event Volume

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toDate(occurred_at) as day, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 1"
}
```

### Hourly Trends (Last 7 Days)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfHour(occurred_at) as hour, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 7 DAY GROUP BY 1 ORDER BY 1"
}
```

### Weekly Event Trends by Channel

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfWeek(occurred_at) as week, event_channel, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 90 DAY GROUP BY 1, 2 ORDER BY 1, 3 DESC"
}
```

### Event Type Distribution Over Time

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toDate(occurred_at) as day, event_type, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 14 DAY AND event_type IN ('pageview', 'signup', 'purchase') GROUP BY 1, 2 ORDER BY 1, 3 DESC"
}
```

---

## Feature Usage

Analyze feature adoption and usage patterns.

### Feature Adoption (Unique Users)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_type as feature, count(DISTINCT user_id) as unique_users, count(*) as total_uses FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type LIKE 'feature_%' GROUP BY 1 ORDER BY 2 DESC"
}
```

### Usage Frequency by Feature

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_type as feature, count(*) as uses, count(DISTINCT customer_id) as customers, count(*) / count(DISTINCT customer_id) as uses_per_customer FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type IN ('dashboard_view', 'export_pdf', 'api_calls', 'report_generated') GROUP BY 1 ORDER BY 2 DESC"
}
```

### Daily/Weekly Active Users

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toDate(occurred_at) as day, count(DISTINCT user_id) as dau, count(DISTINCT customer_id) as dac FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY GROUP BY 1 ORDER BY 1"
}
```

### Feature Usage by Customer Segment

```json
{
  "tool": "outlit_query",
  "sql": "SELECT cd.plan, e.event_type as feature, count(*) as uses FROM events e JOIN customer_dimensions cd ON e.customer_id = cd.customer_id WHERE e.occurred_at >= now() - INTERVAL 30 DAY AND e.event_type LIKE 'feature_%' AND cd.plan != '' GROUP BY 1, 2 ORDER BY 1, 3 DESC"
}
```

---

## Session Metrics

Analyze sessions, pageviews, and engagement.

### Total Pageviews

```json
{
  "tool": "outlit_query",
  "sql": "SELECT count(*) as pageviews, count(DISTINCT session_id) as sessions, count(DISTINCT user_id) as unique_users FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type = 'pageview'"
}
```

### Sessions per Customer

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_domain, count(DISTINCT session_id) as sessions, count(*) as pageviews FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type = 'pageview' GROUP BY 1 ORDER BY 2 DESC LIMIT 25"
}
```

### Session Duration Approximation

```json
{
  "tool": "outlit_query",
  "sql": "SELECT session_id, min(occurred_at) as session_start, max(occurred_at) as session_end, dateDiff('second', min(occurred_at), max(occurred_at)) as duration_seconds, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 7 DAY AND session_id != '' GROUP BY 1 HAVING count(*) > 1 ORDER BY 4 DESC LIMIT 100"
}
```

### Top Pages

```json
{
  "tool": "outlit_query",
  "sql": "SELECT JSONExtractString(properties, 'path') as page_path, count(*) as views FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type = 'pageview' GROUP BY 1 ORDER BY 2 DESC LIMIT 20"
}
```

---

## Communication Summary

Analyze email, call, Slack, and meeting activity.

### Communication Volume by Channel

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_channel, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_channel IN ('EMAIL', 'SLACK', 'CALENDAR', 'CALL') GROUP BY 1 ORDER BY 2 DESC"
}
```

### Communication by Customer

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_domain, event_channel, count(*) as communications FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_channel IN ('EMAIL', 'SLACK', 'CALENDAR', 'CALL') GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 50"
}
```

### Email Activity Trends

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toDate(occurred_at) as day, event_type, count(*) as emails FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_channel = 'EMAIL' GROUP BY 1, 2 ORDER BY 1, 3 DESC"
}
```

### Meeting Activity

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfWeek(occurred_at) as week, count(*) as meetings, count(DISTINCT customer_id) as customers FROM events WHERE occurred_at >= now() - INTERVAL 90 DAY AND event_channel = 'CALENDAR' GROUP BY 1 ORDER BY 1"
}
```

---

## Cohort Analysis

Analyze customers by acquisition cohort.

### Customers by Acquisition Month

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfMonth(first_seen_at) as cohort_month, count(*) as total_customers, countIf(billing_status = 'PAYING') as paying_customers, sum(mrr_cents)/100 as total_mrr FROM customer_dimensions GROUP BY 1 ORDER BY 1 DESC"
}
```

### Cohort Retention

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfMonth(first_seen_at) as cohort, count(*) as acquired, countIf(billing_status = 'PAYING') as still_paying, countIf(billing_status = 'CHURNED') as churned, countIf(billing_status = 'CHURNED') * 100.0 / count(*) as churn_rate FROM customer_dimensions WHERE first_seen_at >= now() - INTERVAL 12 MONTH GROUP BY 1 ORDER BY 1"
}
```

### Time to First Payment

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfMonth(first_seen_at) as cohort, avg(dateDiff('day', first_seen_at, created_at)) as avg_days_to_payment FROM customer_dimensions WHERE billing_status = 'PAYING' AND first_seen_at >= now() - INTERVAL 12 MONTH GROUP BY 1 ORDER BY 1"
}
```

---

## Cross-Table Analysis

Complex queries joining multiple tables.

### Customer Activity with Revenue

```json
{
  "tool": "outlit_query",
  "sql": "SELECT cd.customer_id, cd.name, cd.mrr_cents/100 as mrr, count(DISTINCT e.event_id) as event_count, count(DISTINCT e.user_id) as active_users FROM customer_dimensions cd LEFT JOIN events e ON cd.customer_id = e.customer_id AND e.occurred_at >= now() - INTERVAL 30 DAY WHERE cd.billing_status = 'PAYING' GROUP BY cd.customer_id, cd.name, cd.mrr_cents ORDER BY event_count DESC LIMIT 25"
}
```

### Users per Customer

```json
{
  "tool": "outlit_query",
  "sql": "SELECT cd.customer_id, cd.name, cd.mrr_cents/100 as mrr, count(ud.user_id) as user_count FROM customer_dimensions cd LEFT JOIN user_dimensions ud ON cd.customer_id = ud.customer_id WHERE cd.billing_status = 'PAYING' GROUP BY cd.customer_id, cd.name, cd.mrr_cents ORDER BY 4 DESC LIMIT 25"
}
```

### Revenue vs Engagement Correlation

```json
{
  "tool": "outlit_query",
  "sql": "SELECT CASE WHEN event_count < 10 THEN 'Low (<10)' WHEN event_count < 50 THEN 'Medium (10-50)' WHEN event_count < 200 THEN 'High (50-200)' ELSE 'Very High (200+)' END as engagement_tier, count(*) as customers, avg(mrr) as avg_mrr FROM (SELECT cd.customer_id, cd.mrr_cents/100 as mrr, count(e.event_id) as event_count FROM customer_dimensions cd LEFT JOIN events e ON cd.customer_id = e.customer_id AND e.occurred_at >= now() - INTERVAL 30 DAY WHERE cd.billing_status = 'PAYING' GROUP BY cd.customer_id, cd.mrr_cents) GROUP BY 1 ORDER BY 3 DESC"
}
```

---

## Response Parsing

### Standard SQL Response

```json
{
  "success": true,
  "data": [
    { "billing_status": "PAYING", "customers": 45, "mrr": 125000 },
    { "billing_status": "TRIALING", "customers": 12, "mrr": 0 }
  ],
  "metadata": {
    "rowsReturned": 2,
    "executionTimeMs": 47,
    "truncated": false
  }
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `data` | Array of result rows |
| `metadata.rowsReturned` | Number of rows returned |
| `metadata.truncated` | Whether results were limited |
| `metadata.executionTimeMs` | Query execution time |

### Empty Results

```json
{
  "success": true,
  "data": [],
  "metadata": {
    "rowsReturned": 0,
    "executionTimeMs": 8,
    "truncated": false
  }
}
```

---

## Performance Tips

1. **Always add time filters** — Queries without date ranges scan all data
2. **Start narrow** — Use specific filters before broadening
3. **Limit results** — Don't fetch more than needed
4. **Avoid SELECT *** — Specify columns explicitly
5. **Use groupBy** — Aggregate server-side instead of client-side
6. **Check truncation** — If `truncated: true`, add more filters

### Good Patterns

```sql
-- Filtered by date, limited results
SELECT event_type, count(*)
FROM events
WHERE occurred_at >= now() - INTERVAL 7 DAY
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20
```

### Patterns to Avoid

```sql
-- No date filter (scans all data)
SELECT * FROM events

-- No LIMIT on large result
SELECT customer_id, occurred_at FROM events
```

---

## Timeframe Selection Guide

| Timeframe | Use Case |
|-----------|----------|
| 7 days | Recent activity, immediate trends |
| 14 days | Short-term patterns |
| 30 days | Standard period, monthly reports |
| 90 days | Quarterly analysis, cohort studies |
| 365 days | Annual trends, long-term patterns |
