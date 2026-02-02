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
  "orderBy": "currentMrr",
  "orderDirection": "desc",
  "limit": 25
}
```

Look for customers with `riskSignal: "critical"` in the response.

### Step 2: Get context for high-value at-risk customers

For each high-MRR customer from Step 1:

```json
{
  "tool": "outlit_get_customer",
  "customer": "<customer_id>",
  "include": ["contacts", "revenue", "behaviorMetrics"],
  "timeframe": "90d"
}
```

Check `behaviorMetrics.activityCount` and `lastEmailAt` / `lastMeetingAt`.

### Step 3: Analyze activity patterns

```json
{
  "tool": "outlit_get_timeline",
  "customer": "<customer_id>",
  "timeframe": "90d",
  "channels": ["EMAIL", "CALENDAR", "CALL"],
  "limit": 100
}
```

Look for:
- When did engagement drop?
- Last meaningful interaction
- Communication frequency changes

### Step 4: Get AI insights (if available)

```json
{
  "tool": "outlit_query",
  "queryType": "company_insights",
  "params": {
    "customerId": "<customer_id>",
    "includeBlocks": ["companyContext", "landmines"]
  }
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

### Step 1: Current MRR by segment

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_metrics",
  "params": { "metric": "mrr" },
  "groupBy": ["billingStatus"]
}
```

### Step 2: Revenue trends over time

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_trends",
  "timeframe": "1y",
  "params": {
    "granularity": "month",
    "metric": "mrr"
  }
}
```

### Step 3: Attribution breakdown

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_attribution",
  "params": { "metric": "revenue" }
}
```

### Step 4: Customer metrics

```json
{
  "tool": "outlit_query",
  "queryType": "customer_metrics",
  "params": { "metric": "count" },
  "groupBy": ["billingStatus"]
}
```

### Step 5: Churn analysis

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_metrics",
  "timeframe": "90d",
  "params": { "metric": "churn" }
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
  "orderBy": "currentMrr",
  "orderDirection": "desc"
}
```

### Trial Customers Ready to Convert

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "TRIALING",
  "hasActivityInLast": "7d",
  "orderBy": "lastActivityAt",
  "orderDirection": "desc"
}
```

### At-Risk Enterprise Accounts

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "noActivityInLast": "14d",
  "mrrAbove": 100000,
  "type": "COMPANY"
}
```

### Customer Distribution Analysis

```json
{
  "tool": "outlit_query",
  "queryType": "customer_metrics",
  "groupBy": ["billingStatus", "type"]
}
```

### Recently Churned

```json
{
  "tool": "outlit_list_customers",
  "status": "CHURNED",
  "billingStatus": "CHURNED",
  "orderBy": "lastActivityAt",
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

### Step 1: Overall activity volume

```json
{
  "tool": "outlit_query",
  "queryType": "event_aggregates",
  "timeframe": "30d",
  "params": { "channels": ["EMAIL", "SLACK", "CALENDAR", "CALL"] },
  "groupBy": ["channel"]
}
```

### Step 2: Activity trends over time

```json
{
  "tool": "outlit_query",
  "queryType": "event_trends",
  "timeframe": "90d",
  "params": { "granularity": "week" },
  "groupBy": ["channel"]
}
```

### Step 3: Feature adoption

```json
{
  "tool": "outlit_query",
  "queryType": "feature_usage",
  "timeframe": "30d",
  "params": { "metric": "adoption" }
}
```

### Step 4: Session metrics

```json
{
  "tool": "outlit_query",
  "queryType": "session_metrics",
  "timeframe": "30d",
  "params": { "metric": "sessions" }
}
```

### Step 5: Communication patterns

```json
{
  "tool": "outlit_query",
  "queryType": "communication_summary",
  "timeframe": "30d",
  "params": {
    "channels": ["email", "slack", "call", "meeting"],
    "metric": "volume"
  }
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
  "include": ["contacts", "revenue", "recentTimeline", "behaviorMetrics"],
  "timeframe": "30d"
}
```

### Step 2: Get detailed activity timeline

```json
{
  "tool": "outlit_get_timeline",
  "customer": "<customer_id>",
  "timeframe": "90d",
  "limit": 100
}
```

### Step 3: Get revenue details

```json
{
  "tool": "outlit_get_customer_revenue",
  "customer": "<customer_id>",
  "includeAttribution": true,
  "includeBillingHistory": true
}
```

### Step 4: Get AI insights

```json
{
  "tool": "outlit_query",
  "queryType": "company_insights",
  "params": {
    "customerId": "<customer_id>",
    "includeBlocks": ["companyContext", "sharpQuestions", "landmines"]
  }
}
```

```json
{
  "tool": "outlit_query",
  "queryType": "contact_insights",
  "params": {
    "customerId": "<customer_id>",
    "includeBlocks": ["personOverview", "dealRelevance", "leveragePoints"]
  }
}
```

### Summary Output

- **Account overview**: Status, MRR, plan, tenure
- **Key contacts**: Decision makers, champions
- **Engagement health**: Activity trends, last touchpoints
- **Revenue history**: Billing events, upgrades/downgrades
- **AI insights**: Company context, conversation starters

---

## Acquisition Analysis

Analyze channel performance and attribution.

### Step 1: Revenue by acquisition channel

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_attribution",
  "params": { "metric": "revenue" }
}
```

### Step 2: Customer count by channel

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_attribution",
  "params": { "metric": "customers" }
}
```

### Step 3: Channel conversion rates

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_attribution",
  "timeframe": "90d",
  "params": { "metric": "conversion" }
}
```

### Step 4: MRR by channel over time (SQL)

```json
{
  "tool": "outlit_sql",
  "sql": "SELECT attribution_channel, toStartOfMonth(first_seen_at) as month, sum(mrr_cents)/100 as mrr FROM customer_dimensions WHERE billing_status = 'PAYING' GROUP BY 1, 2 ORDER BY 2, 3 DESC"
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

### Step 1: Current business state

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_metrics",
  "params": { "metric": "mrr" },
  "groupBy": ["billingStatus"]
}
```

### Step 2: Customer counts

```json
{
  "tool": "outlit_query",
  "queryType": "customer_metrics",
  "groupBy": ["billingStatus"]
}
```

### Step 3: MRR trend (last 6 months)

```json
{
  "tool": "outlit_query",
  "queryType": "revenue_trends",
  "timeframe": "90d",
  "params": {
    "granularity": "month",
    "metric": "mrr"
  }
}
```

### Step 4: At-risk revenue

```json
{
  "tool": "outlit_list_customers",
  "billingStatus": "PAYING",
  "noActivityInLast": "30d",
  "orderBy": "currentMrr",
  "orderDirection": "desc",
  "limit": 10
}
```

Sum `currentMrr` from results to get at-risk MRR.

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

### Example: Customer Activity Correlation

```json
{
  "tool": "outlit_sql",
  "sql": "SELECT cd.customer_id, cd.name, cd.mrr_cents/100 as mrr, count(DISTINCT e.event_id) as events_30d, count(DISTINCT e.user_id) as active_users FROM customer_dimensions cd LEFT JOIN events e ON cd.customer_id = e.customer_id AND e.occurred_at >= now() - INTERVAL 30 DAY WHERE cd.billing_status = 'PAYING' GROUP BY cd.customer_id, cd.name, cd.mrr_cents ORDER BY events_30d DESC LIMIT 25"
}
```

### Example: Time-of-Day Analysis

```json
{
  "tool": "outlit_sql",
  "sql": "SELECT toHour(occurred_at) as hour_of_day, count(*) as events FROM events WHERE occurred_at >= now() - INTERVAL 7 DAY GROUP BY 1 ORDER BY 1"
}
```

### Example: Cohort Retention

```json
{
  "tool": "outlit_sql",
  "sql": "SELECT toStartOfMonth(first_seen_at) as cohort, count(*) as total, countIf(billing_status = 'PAYING') as paying, countIf(billing_status = 'CHURNED') as churned FROM customer_dimensions GROUP BY 1 ORDER BY 1 DESC"
}
```

---

## Workflow Best Practices

1. **Start broad, then narrow** — Begin with overview queries, drill into specifics
2. **Check data availability** — ClickHouse queries (events, features) may return 503
3. **Cache early results** — Reference customer IDs from initial queries in follow-ups
4. **Handle empty results** — Some segments may have no data
5. **Convert monetary values** — All MRR/revenue in cents, divide by 100 for display
6. **Summarize for users** — Don't just dump raw responses, synthesize insights
