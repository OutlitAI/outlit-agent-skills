# Common Workflows

Multi-step workflows combining Outlit MCP tools for common business analysis tasks.

---

## Quick Index

| Workflow | Purpose |
|----------|---------|
| [Churn Risk Analysis](#churn-risk-analysis) | Identify and investigate at-risk customers |
| [Revenue Dashboard](#revenue-dashboard) | Build comprehensive revenue overview |
| [Customer Segmentation](#customer-segmentation) | Identify and analyze customer segments |
| [Engagement Analysis](#engagement-analysis) | Understand activity patterns |
| [Account Health Check](#account-health-check) | Deep dive on single customer |
| [Acquisition Analysis](#acquisition-analysis) | Channel performance and attribution |
| [Executive Summary](#executive-summary) | High-level business metrics |
| [Custom Analytics](#custom-analytics) | SQL-based exploration |

---

## Churn Risk Analysis

Identify at-risk paying customers and investigate patterns.

### Step 1: Find at-risk customers

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "noActivityInLast": "30d",
  "orderBy": "mrr_cents",
  "orderDirection": "desc",
  "limit": 25
}
```

Filter by `noActivityInLast: "30d"` and sort by `mrr_cents` to prioritize high-value customers.

### Step 2: Get context for high-value at-risk customers

For each high-MRR customer from Step 1:

```json
{
  "tool": "outlit_get_customer",
  "customer": "<customer_id>",
  "include": ["users", "revenue", "behaviorMetrics"],
  "timeframe": "90d"
}
```

Check `behaviorMetrics.activityCount` and `lastEmailAt` / `lastMeetingAt`.

### Step 3: Analyze activity patterns

```json
{
  "tool": "outlit_get_timeline",
  "customer": "<customer_id>",
  "channels": ["EMAIL", "CALL", "CRM"],
  "limit": 100
}
```

Look for:
- When did engagement drop?
- Last meaningful interaction
- Communication frequency changes

### Step 4: Get aggregate churn patterns (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, count(*) as churned_customers, sum(mrr_cents)/100 as lost_mrr FROM customer_dimensions WHERE billing_status = 'CHURNED' AND churned_at >= now() - INTERVAL 90 DAY GROUP BY 1 ORDER BY 3 DESC"
}
```

### Summary Output

Present findings as:
- **At-risk customers**: List with MRR, days inactive, last contact
- **Patterns**: Common drop-off points
- **Recommended actions**: Outreach suggestions per customer

---

## Revenue Dashboard

Build a comprehensive revenue overview.

### Step 1: Current MRR by segment (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customers, sum(mrr_cents)/100 as mrr_dollars FROM customer_dimensions GROUP BY 1 ORDER BY 3 DESC"
}
```

### Step 2: Revenue trends over time (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT snapshot_date, sum(mrr_cents)/100 as total_mrr FROM mrr_snapshots WHERE snapshot_date >= today() - 365 GROUP BY 1 ORDER BY 1"
}
```

### Step 3: Attribution breakdown (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, count(*) as customers, sum(mrr_cents)/100 as total_mrr FROM customer_dimensions WHERE billing_status = 'PAYING' AND attribution_channel != '' GROUP BY 1 ORDER BY 3 DESC"
}
```

### Step 4: Customer metrics (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customer_count FROM customer_dimensions GROUP BY 1 ORDER BY 2 DESC"
}
```

### Step 5: Churn analysis (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfMonth(churned_at) as churn_month, count(*) as churned_customers, sum(mrr_cents)/100 as churned_mrr FROM customer_dimensions WHERE churned_at IS NOT NULL AND churned_at >= now() - INTERVAL 12 MONTH GROUP BY 1 ORDER BY 1 DESC"
}
```

### Summary Output

Present as dashboard metrics:
- **Total MRR**: $X (from Step 1)
- **MRR Trend**: +/-X% month-over-month (from Step 2)
- **Customer Count**: X paying, X trialing (from Step 4)
- **Top Channels**: By revenue contribution (from Step 3)
- **Churn Rate**: X% (from Step 5)

---

## Customer Segmentation

Identify and analyze customer segments.

### High-Value Active Customers

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "hasActivityInLast": "7d",
  "mrrAbove": 50000,
  "orderBy": "mrr_cents",
  "orderDirection": "desc"
}
```

### Trial Customers Ready to Convert

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "TRIALING",
  "hasActivityInLast": "7d",
  "orderBy": "last_activity_at",
  "orderDirection": "desc"
}
```

### At-Risk Enterprise Accounts

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "noActivityInLast": "14d",
  "mrrAbove": 100000
}
```

### Customer Distribution Analysis (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, plan, count(*) as customers, sum(mrr_cents)/100 as total_mrr FROM customer_dimensions WHERE plan != '' GROUP BY 1, 2 ORDER BY 4 DESC"
}
```

### Recently Churned

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "CHURNED",
  "orderBy": "last_activity_at",
  "orderDirection": "desc",
  "limit": 25
}
```

### Summary Output

Present as segment analysis:
- **Enterprise accounts**: Count, total MRR, health status
- **Mid-market**: Count, growth trend
- **Trial pipeline**: Active trials, conversion-ready
- **Risk segments**: Accounts needing attention

---

## Engagement Analysis

Understand customer engagement patterns.

### Step 1: Overall activity volume (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_channel, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_channel IN ('EMAIL', 'SLACK', 'CALL', 'CRM') GROUP BY 1 ORDER BY 2 DESC"
}
```

### Step 2: Activity trends over time (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfWeek(occurred_at) as week, event_channel, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 90 DAY GROUP BY 1, 2 ORDER BY 1, 3 DESC"
}
```

### Step 3: Feature adoption (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_type as feature, count(DISTINCT user_id) as unique_users, count(*) as total_uses FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type LIKE 'feature_%' GROUP BY 1 ORDER BY 2 DESC"
}
```

### Step 4: Session metrics (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT count(*) as pageviews, count(DISTINCT session_id) as sessions, count(DISTINCT user_id) as unique_users FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_type = 'pageview'"
}
```

### Step 5: Communication patterns (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT event_channel, count(*) as communications FROM events WHERE occurred_at >= now() - INTERVAL 30 DAY AND event_channel IN ('EMAIL', 'SLACK', 'CALL', 'CRM') GROUP BY 1 ORDER BY 2 DESC"
}
```

### Summary Output

- **Engagement trend**: Rising/falling over past 90 days
- **Top channels**: Where customers are most active
- **Feature adoption**: Most/least used features
- **Communication health**: Response patterns

---

## Account Health Check

Deep dive on a single customer account.

### Step 1: Get full customer profile

```json
{
  "tool": "outlit_get_customer",
  "customer": "<customer_id_or_domain>",
  "include": ["users", "revenue", "recentTimeline", "behaviorMetrics"],
  "timeframe": "30d"
}
```

### Step 2: Get detailed activity timeline

```json
{
  "tool": "outlit_get_timeline",
  "customer": "<customer_id>",
  "limit": 100
}
```

### Step 3: Get revenue details

```json
{
  "tool": "outlit_get_customer",
  "customer": "<customer_id>",
  "include": ["revenue"]
}
```

### Step 4: Compare to similar customers (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT customer_id, name, mrr_cents/100 as mrr, last_activity_at FROM customer_dimensions WHERE billing_status = 'PAYING' AND plan = '<customer_plan>' ORDER BY mrr_cents DESC LIMIT 10"
}
```

### Summary Output

- **Account overview**: Status, MRR, plan, tenure
- **Key contacts**: Decision makers, champions
- **Engagement health**: Activity trends, last touchpoints
- **Revenue history**: Billing events, upgrades/downgrades
- **Peer comparison**: How this account compares to similar customers

---

## Acquisition Analysis

Analyze channel performance and attribution.

### Step 1: Revenue by acquisition channel (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, count(*) as customers, sum(mrr_cents)/100 as total_mrr, avg(mrr_cents)/100 as avg_mrr FROM customer_dimensions WHERE billing_status = 'PAYING' AND attribution_channel != '' GROUP BY 1 ORDER BY 3 DESC"
}
```

### Step 2: Customer count by channel (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, toStartOfMonth(first_seen_at) as month, count(*) as new_customers FROM customer_dimensions WHERE attribution_channel != '' AND first_seen_at >= now() - INTERVAL 12 MONTH GROUP BY 1, 2 ORDER BY 2 DESC, 3 DESC"
}
```

### Step 3: Channel conversion rates (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, count(*) as total_customers, countIf(billing_status = 'PAYING') as paying_customers, countIf(billing_status = 'PAYING') * 100.0 / count(*) as conversion_rate FROM customer_dimensions WHERE attribution_channel != '' GROUP BY 1 ORDER BY 4 DESC"
}
```

### Step 4: MRR by channel over time (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT attribution_channel, toStartOfMonth(first_seen_at) as month, sum(mrr_cents)/100 as mrr FROM customer_dimensions WHERE billing_status = 'PAYING' AND attribution_channel != '' GROUP BY 1, 2 ORDER BY 2, 3 DESC"
}
```

### Summary Output

- **Top channels by MRR**: Which channels drive most revenue
- **CAC efficiency**: Revenue per customer by channel
- **Conversion trends**: Channel performance over time
- **Recommendations**: Where to invest acquisition spend

---

## Executive Summary

High-level business metrics overview.

### Step 1: Current business state (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customers, sum(mrr_cents)/100 as mrr_dollars FROM customer_dimensions GROUP BY 1 ORDER BY 3 DESC"
}
```

### Step 2: Customer counts (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT billing_status, count(*) as customer_count FROM customer_dimensions GROUP BY 1 ORDER BY 2 DESC"
}
```

### Step 3: MRR trend (last 6 months) (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT snapshot_date, sum(mrr_cents)/100 as total_mrr FROM mrr_snapshots WHERE snapshot_date >= today() - 180 GROUP BY 1 ORDER BY 1"
}
```

### Step 4: At-risk revenue

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "noActivityInLast": "30d",
  "orderBy": "mrr_cents",
  "orderDirection": "desc",
  "limit": 10
}
```

Sum `mrr_cents` from results to get at-risk MRR.

### Summary Output

Present as executive brief:
- **MRR**: $X (+X% MoM)
- **Paying customers**: X
- **Trial pipeline**: X customers
- **At-risk MRR**: $X (X customers)
- **Key insight**: One-sentence health summary

---

## Custom Analytics

SQL-based exploration for ad-hoc analysis.

### Workflow: Schema Discovery First

```json
{ "tool": "outlit_schema" }
```

```json
{ "tool": "outlit_schema", "table": "events" }
```

### Example: Customer Activity Correlation (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT cd.customer_id, cd.name, cd.mrr_cents/100 as mrr, count(DISTINCT e.event_id) as events_30d, count(DISTINCT e.user_id) as active_users FROM customer_dimensions cd LEFT JOIN events e ON cd.customer_id = e.customer_id AND e.occurred_at >= now() - INTERVAL 30 DAY WHERE cd.billing_status = 'PAYING' GROUP BY cd.customer_id, cd.name, cd.mrr_cents ORDER BY events_30d DESC LIMIT 25"
}
```

### Example: Time-of-Day Analysis (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toHour(occurred_at) as hour_of_day, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 7 DAY GROUP BY 1 ORDER BY 1"
}
```

### Example: Cohort Retention (SQL)

```json
{
  "tool": "outlit_query",
  "sql": "SELECT toStartOfMonth(first_seen_at) as cohort, count(*) as total, countIf(billing_status = 'PAYING') as paying, countIf(billing_status = 'CHURNED') as churned FROM customer_dimensions GROUP BY 1 ORDER BY 1 DESC"
}
```

---

## Workflow Best Practices

1. **Start broad, then narrow** — Begin with overview queries, drill into specifics
2. **Use customer tools for single lookups** — Don't use SQL for individual customer data
3. **Cache early results** — Reference customer IDs from initial queries in follow-ups
4. **Handle empty results** — Some segments may have no data
5. **Convert monetary values** — All MRR/revenue in cents, divide by 100 for display
6. **Summarize for users** — Don't just dump raw responses, synthesize insights
