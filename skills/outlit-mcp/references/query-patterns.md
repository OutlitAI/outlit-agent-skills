# Query Patterns Reference

Comprehensive examples and parameter documentation for all 13 `outlit_query` types.

---

## Quick Index

| Query Type | Purpose | Jump to |
|-----------|---------|---------|
| `customer_cohort` | Find customers by filters | [→](#customer_cohort) |
| `customer_metrics` | Count customers by segment | [→](#customer_metrics) |
| `contact_journey` | Journey stage analysis | [→](#contact_journey) |
| `revenue_metrics` | MRR, LTV, ARPU, churn | [→](#revenue_metrics) |
| `revenue_attribution` | Revenue by channel | [→](#revenue_attribution) |
| `revenue_trends` | Revenue over time | [→](#revenue_trends) |
| `event_aggregates` | Event counts | [→](#event_aggregates) |
| `event_trends` | Event time series | [→](#event_trends) |
| `feature_usage` | Feature adoption | [→](#feature_usage) |
| `session_metrics` | Sessions, pageviews | [→](#session_metrics) |
| `communication_summary` | Email, call, slack activity | [→](#communication_summary) |
| `company_insights` | AI company analysis | [→](#company_insights) |
| `contact_insights` | AI contact analysis | [→](#contact_insights) |

---

## Global Parameters

All query types accept these parameters:

| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| `queryType` | string | Required - see table above | — |
| `timeframe` | enum | 7d, 14d, 30d, 90d, 1y, all | 30d |
| `params` | object | Query-specific parameters | {} |
| `groupBy` | array | Dimension fields to group by | [] |
| `limit` | number | 1-1000 | 100 |
| `cursor` | string | Pagination token | null |

---

## Prisma-Based Queries

### customer_cohort

Find and filter customers with optional data includes.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.filters.status` | array | PROVISIONAL, ACTIVE, CHURNED, MERGED |
| `params.filters.billingStatus` | array | NONE, TRIALING, PAYING, CHURNED |
| `params.filters.type` | array | COMPANY, INDIVIDUAL |
| `params.filters.hasActivityInLast` | enum | 7d, 14d, 30d, 90d |
| `params.filters.noActivityInLast` | enum | 7d, 14d, 30d, 90d |
| `params.filters.mrrAbove` | number | Min MRR in cents |
| `params.filters.mrrBelow` | number | Max MRR in cents |
| `params.filters.attributionChannel` | array | Channel names |
| `params.include` | array | revenue, contacts |
| `params.orderBy` | string | Sort field |
| `params.orderDirection` | enum | asc, desc |

**GroupBy Options:** `status`, `billingStatus`, `type`

**Example 1 - At-risk paying customers:**
```json
{
  "queryType": "customer_cohort",
  "timeframe": "90d",
  "params": {
    "filters": {
      "billingStatus": ["PAYING"],
      "noActivityInLast": "30d"
    },
    "include": ["revenue", "contacts"]
  }
}
```

**Example 2 - High-value enterprise customers:**
```json
{
  "queryType": "customer_cohort",
  "params": {
    "filters": {
      "billingStatus": ["PAYING"],
      "type": ["COMPANY"],
      "mrrAbove": 100000
    },
    "include": ["revenue"],
    "orderBy": "currentMrr",
    "orderDirection": "desc"
  },
  "limit": 50
}
```

**Example 3 - Churned customers by acquisition channel:**
```json
{
  "queryType": "customer_cohort",
  "timeframe": "1y",
  "params": {
    "filters": {
      "status": ["CHURNED"],
      "billingStatus": ["CHURNED"]
    },
    "include": ["revenue"]
  },
  "groupBy": ["status"]
}
```

**Example 4 - Trial customers with recent activity:**
```json
{
  "queryType": "customer_cohort",
  "params": {
    "filters": {
      "billingStatus": ["TRIALING"],
      "hasActivityInLast": "7d"
    },
    "include": ["contacts"]
  }
}
```

---

### customer_metrics

Aggregate customer counts by segments.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.metric` | enum | count, distribution |

**GroupBy Options:** `status`, `billingStatus`, `type`, `attributionChannel`

**Example 1 - Customer count by billing status:**
```json
{
  "queryType": "customer_metrics",
  "params": { "metric": "count" },
  "groupBy": ["billingStatus"]
}
```

**Example 2 - Distribution by customer type:**
```json
{
  "queryType": "customer_metrics",
  "timeframe": "90d",
  "params": { "metric": "distribution" },
  "groupBy": ["type"]
}
```

**Example 3 - Multi-dimension breakdown:**
```json
{
  "queryType": "customer_metrics",
  "params": { "metric": "count" },
  "groupBy": ["billingStatus", "type"]
}
```

---

### contact_journey

Analyze contact journey stages and conversions.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.metric` | enum | distribution, funnel, conversion |
| `params.stages` | array | Journey stage names |
| `params.groupBy` | enum | channel, source |

**GroupBy Options:** `journeyStage`

**Journey Stages:** DISCOVERED, SIGNED_UP, ACTIVATED, ENGAGED, INACTIVE

**Example 1 - Journey stage distribution:**
```json
{
  "queryType": "contact_journey",
  "params": { "metric": "distribution" }
}
```

**Example 2 - Funnel analysis:**
```json
{
  "queryType": "contact_journey",
  "params": {
    "metric": "funnel",
    "stages": ["DISCOVERED", "SIGNED_UP", "ACTIVATED", "ENGAGED"]
  }
}
```

**Example 3 - Stage conversion rates:**
```json
{
  "queryType": "contact_journey",
  "timeframe": "90d",
  "params": { "metric": "conversion" }
}
```

---

### revenue_metrics

Calculate MRR, LTV, ARPU, and churn metrics.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.metric` | enum | mrr, ltv, arpu, churn |
| `params.segmentBy` | enum | billingStatus, attributionChannel, customerType |

**GroupBy Options:** `billingStatus`

**Example 1 - Total MRR:**
```json
{
  "queryType": "revenue_metrics",
  "params": { "metric": "mrr" }
}
```

**Example 2 - MRR by billing status:**
```json
{
  "queryType": "revenue_metrics",
  "params": { "metric": "mrr" },
  "groupBy": ["billingStatus"]
}
```

**Example 3 - ARPU calculation:**
```json
{
  "queryType": "revenue_metrics",
  "params": { "metric": "arpu" }
}
```

**Example 4 - MRR by acquisition channel:**
```json
{
  "queryType": "revenue_metrics",
  "params": {
    "metric": "mrr",
    "segmentBy": "attributionChannel"
  }
}
```

**Example 5 - Churn rate:**
```json
{
  "queryType": "revenue_metrics",
  "timeframe": "90d",
  "params": { "metric": "churn" }
}
```

---

### revenue_attribution

Analyze revenue by acquisition channel.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.metric` | enum | revenue, customers, conversion |

**GroupBy Options:** `attributionChannel`

**Example 1 - Revenue by channel:**
```json
{
  "queryType": "revenue_attribution",
  "params": { "metric": "revenue" }
}
```

**Example 2 - Customer acquisition by channel:**
```json
{
  "queryType": "revenue_attribution",
  "params": { "metric": "customers" }
}
```

**Example 3 - Channel conversion efficiency:**
```json
{
  "queryType": "revenue_attribution",
  "timeframe": "1y",
  "params": { "metric": "conversion" }
}
```

---

### revenue_trends

Track revenue over time with configurable granularity.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.metric` | enum | mrr, revenue, customers |
| `params.granularity` | enum | day, week, month |

**GroupBy Options:** `period`

**Example 1 - Monthly MRR trend:**
```json
{
  "queryType": "revenue_trends",
  "timeframe": "1y",
  "params": {
    "metric": "mrr",
    "granularity": "month"
  }
}
```

**Example 2 - Daily customer acquisition:**
```json
{
  "queryType": "revenue_trends",
  "timeframe": "30d",
  "params": {
    "metric": "customers",
    "granularity": "day"
  }
}
```

**Example 3 - Weekly revenue:**
```json
{
  "queryType": "revenue_trends",
  "timeframe": "90d",
  "params": {
    "metric": "revenue",
    "granularity": "week"
  }
}
```

---

## ClickHouse-Based Queries

> **Note:** These queries require ClickHouse to be available. They return 503 if the analytics service is unavailable.

### event_aggregates

Count events by type, channel, or customer.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params.eventTypes` | array | Filter by event types |
| `params.channels` | array | Filter by channels |

**GroupBy Options:** `eventType`, `channel`, `customerId`

**Channels:** EMAIL, SLACK, INTERCOM, CALENDAR, CALL, DOCUMENT

**Example 1 - Event counts by type:**
```json
{
  "queryType": "event_aggregates",
  "timeframe": "30d",
  "groupBy": ["eventType"]
}
```

**Example 2 - Activity by channel:**
```json
{
  "queryType": "event_aggregates",
  "timeframe": "7d",
  "params": {
    "channels": ["EMAIL", "SLACK", "CALENDAR"]
  },
  "groupBy": ["channel"]
}
```

**Example 3 - Top customers by event volume:**
```json
{
  "queryType": "event_aggregates",
  "timeframe": "30d",
  "groupBy": ["customerId"],
  "limit": 25
}
```

**Example 4 - Specific event types:**
```json
{
  "queryType": "event_aggregates",
  "timeframe": "30d",
  "params": {
    "eventTypes": ["pageview", "form_submission", "button_click"]
  },
  "groupBy": ["eventType"]
}
```

---

### event_trends

Time-series event data with configurable granularity.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.granularity` | enum | hour, day, week, month |
| `params.eventTypes` | array | Event type names |
| `params.channels` | array | Channel names |

**GroupBy Options:** `period`, `channel`, `eventType`

**Example 1 - Daily event volume:**
```json
{
  "queryType": "event_trends",
  "timeframe": "30d",
  "params": {
    "granularity": "day"
  }
}
```

**Example 2 - Hourly trends by channel:**
```json
{
  "queryType": "event_trends",
  "timeframe": "7d",
  "params": {
    "granularity": "hour",
    "channels": ["EMAIL", "SLACK"]
  },
  "groupBy": ["channel"]
}
```

**Example 3 - Weekly event type distribution:**
```json
{
  "queryType": "event_trends",
  "timeframe": "90d",
  "params": {
    "granularity": "week",
    "eventTypes": ["pageview", "signup", "purchase"]
  },
  "groupBy": ["eventType"]
}
```

---

### feature_usage

Analyze feature adoption and usage frequency.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.features` | array | Feature names to analyze |
| `params.metric` | enum | adoption, frequency, retention, dau, mau |

**GroupBy Options:** `feature`, `customerId`

**Example 1 - Feature adoption rates:**
```json
{
  "queryType": "feature_usage",
  "timeframe": "30d",
  "params": {
    "features": ["dashboard_view", "export_pdf", "api_calls"],
    "metric": "adoption"
  }
}
```

**Example 2 - Usage frequency:**
```json
{
  "queryType": "feature_usage",
  "timeframe": "90d",
  "params": {
    "metric": "frequency"
  },
  "limit": 20
}
```

**Example 3 - Feature retention:**
```json
{
  "queryType": "feature_usage",
  "timeframe": "90d",
  "params": {
    "features": ["dashboard_view"],
    "metric": "retention"
  }
}
```

**Example 4 - Daily/Monthly active users:**
```json
{
  "queryType": "feature_usage",
  "timeframe": "30d",
  "params": {
    "metric": "dau"
  }
}
```

---

### session_metrics

Analyze sessions, pageviews, bounce rate, and engagement.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.metric` | enum | sessions, pageviews, bounce_rate, avg_session_duration |

**GroupBy Options:** `customerId`, `path`, `source`

**Example 1 - Pageview analysis:**
```json
{
  "queryType": "session_metrics",
  "timeframe": "30d",
  "params": { "metric": "pageviews" }
}
```

**Example 2 - Session duration:**
```json
{
  "queryType": "session_metrics",
  "timeframe": "7d",
  "params": { "metric": "avg_session_duration" }
}
```

**Example 3 - Bounce rate:**
```json
{
  "queryType": "session_metrics",
  "timeframe": "30d",
  "params": { "metric": "bounce_rate" }
}
```

**Example 4 - Sessions by source:**
```json
{
  "queryType": "session_metrics",
  "timeframe": "30d",
  "params": { "metric": "sessions" },
  "groupBy": ["source"]
}
```

---

### communication_summary

Analyze email, call, Slack, and meeting activity.

**Parameters:**

| Parameter | Type | Values |
|-----------|------|--------|
| `params.channels` | array | email, slack, call, meeting |
| `params.metric` | enum | volume, response_time, participants |

**GroupBy Options:** `channel`, `customerId`, `contactId`

**Example 1 - Communication volume by channel:**
```json
{
  "queryType": "communication_summary",
  "timeframe": "30d",
  "params": {
    "channels": ["email", "slack", "call", "meeting"],
    "metric": "volume"
  }
}
```

**Example 2 - Response time analysis:**
```json
{
  "queryType": "communication_summary",
  "timeframe": "30d",
  "params": {
    "channels": ["email"],
    "metric": "response_time"
  }
}
```

**Example 3 - Communication by customer:**
```json
{
  "queryType": "communication_summary",
  "params": {
    "metric": "volume"
  },
  "groupBy": ["customerId"],
  "limit": 30
}
```

---

## AI-Powered Queries

### company_insights

Retrieve AI-generated company analysis from enrichment data.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params.customerId` | string | Specific customer ID |
| `params.includeBlocks` | array | Insight sections to include |
| `params.hasInsights` | boolean | Filter to companies with insights |

**Include Blocks:** `companyContext`, `positioningPlaybook`, `sharpQuestions`, `landmines`, `citations`

**Example 1 - All company insights:**
```json
{
  "queryType": "company_insights",
  "limit": 25
}
```

**Example 2 - Specific company:**
```json
{
  "queryType": "company_insights",
  "params": {
    "customerId": "cust_123",
    "includeBlocks": ["companyContext", "sharpQuestions", "landmines"]
  }
}
```

**Example 3 - Only companies with insights:**
```json
{
  "queryType": "company_insights",
  "params": {
    "hasInsights": true
  },
  "limit": 50
}
```

---

### contact_insights

Retrieve AI-generated contact analysis from enrichment data.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `params.customerId` | string | Filter by customer |
| `params.contactId` | string | Specific contact |
| `params.includeBlocks` | array | Insight sections to include |
| `params.hasInsights` | boolean | Filter to contacts with insights |

**Include Blocks:** `personOverview`, `dealRelevance`, `whoTheyAre`, `productPositioning`, `leveragePoints`, `socialSignal`, `citations`

**Example 1 - Contacts with insights:**
```json
{
  "queryType": "contact_insights",
  "params": { "hasInsights": true },
  "limit": 30
}
```

**Example 2 - Customer's key contacts:**
```json
{
  "queryType": "contact_insights",
  "params": {
    "customerId": "cust_123",
    "includeBlocks": ["personOverview", "dealRelevance", "leveragePoints"]
  }
}
```

**Example 3 - Specific contact:**
```json
{
  "queryType": "contact_insights",
  "params": {
    "contactId": "contact_456",
    "includeBlocks": ["personOverview", "whoTheyAre", "socialSignal"]
  }
}
```

---

## Response Parsing

### Standard Response Structure

```json
{
  "queryType": "revenue_metrics",
  "timeframe": "30d",
  "executedAt": "2025-01-30T10:00:00Z",
  "results": {
    "data": [
      { "billingStatus": "PAYING", "mrr": 12500000, "customerCount": 45 }
    ],
    "aggregates": {
      "totalMrr": 12500000
    },
    "pagination": {
      "cursor": "eyJpZCI6...",
      "hasMore": false,
      "total": 3
    }
  },
  "metadata": {
    "rowCount": 3,
    "queryDurationMs": 145,
    "dataSource": "prisma"
  }
}
```

### Key Fields

| Field | Description |
|-------|-------------|
| `results.data` | Array of result rows |
| `results.aggregates` | Summary statistics (varies by query) |
| `results.pagination.hasMore` | Whether more pages exist |
| `results.pagination.cursor` | Token for next page |
| `metadata.dataSource` | "prisma", "clickhouse", or "hybrid" |

### Empty Results

```json
{
  "queryType": "customer_cohort",
  "timeframe": "30d",
  "results": {
    "data": [],
    "pagination": { "hasMore": false, "total": 0 }
  },
  "metadata": { "rowCount": 0, "queryDurationMs": 12, "dataSource": "prisma" }
}
```

---

## Common Patterns

### Combining Multiple Queries

For complex analysis, chain multiple queries:

```
1. customer_cohort → Find target segment
2. revenue_metrics → Get financial metrics for segment
3. event_aggregates → Understand engagement patterns
4. company_insights → Get AI analysis
```

### Timeframe Selection Guide

| Timeframe | Use Case |
|-----------|----------|
| 7d | Recent activity, immediate trends |
| 14d | Short-term patterns |
| 30d | Standard period, monthly reports |
| 90d | Quarterly analysis, cohort studies |
| 1y | Annual trends, long-term patterns |
| all | Historical analysis (use sparingly - slow) |

### Performance Tips

1. **Start narrow** — Use specific filters before broadening
2. **Limit results** — Don't fetch more than needed
3. **Avoid `all` timeframe** — Use specific ranges when possible
4. **Use groupBy** — Aggregate server-side instead of client-side
5. **Check data source** — ClickHouse queries may be unavailable
