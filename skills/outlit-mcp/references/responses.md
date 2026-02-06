# Example Responses

Full response examples for each Outlit MCP tool to understand data shapes and parsing.

---

## Quick Index

| Tool | Jump to |
|------|---------|
| `outlit_list_customers` | [→](#outlit_list_customers) |
| `outlit_list_users` | [→](#outlit_list_users) |
| `outlit_get_customer` | [→](#outlit_get_customer-with-all-includes) |
| `outlit_get_timeline` | [→](#outlit_get_timeline) |
| `outlit_query` (SQL) | [→](#outlit_query-sql) |
| `outlit_schema` | [→](#outlit_schema) |
| Empty Results | [→](#empty-results) |
| Parsing Tips | [→](#parsing-tips) |

---

## outlit_list_customers

```json
{
  "items": [
    {
      "id": "cust_abc123",
      "name": "Acme Corp",
      "domain": "acme.com",
      "billingStatus": "PAYING",
      "firstSeenAt": "2024-06-15T10:30:00Z",
      "lastActivityAt": "2025-01-28T14:22:00Z",
      "contactCount": 5,
      "currentMrr": 500000,
      "daysSinceActivity": 3
    },
    {
      "id": "cust_def456",
      "name": "Beta Inc",
      "domain": "beta.io",
      "billingStatus": "PAYING",
      "firstSeenAt": "2024-09-01T08:00:00Z",
      "lastActivityAt": "2024-12-15T16:45:00Z",
      "contactCount": 3,
      "currentMrr": 250000,
      "daysSinceActivity": 47
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJsYXN0QWN0aXZpdHlBdCI6IjIwMjQtMTItMTVUMTY6NDU6MDBaIiwiaWQiOiJjdXN0X2RlZjQ1NiJ9",
    "total": 156
  }
}
```

**Key Fields:**
- `currentMrr`: In cents (500000 = $5,000)
- `daysSinceActivity`: Calculated from `lastActivityAt` (null if never active)

---

## outlit_list_users

```json
{
  "items": [
    {
      "id": "user_abc123",
      "email": "john@acme.com",
      "name": "John Smith",
      "customerId": "cust_abc123",
      "customerDomain": "acme.com",
      "journeyStage": "ENGAGED",
      "firstSeenAt": "2024-06-15T10:30:00Z",
      "lastActivityAt": "2025-01-28T14:22:00Z",
      "daysSinceActivity": 3
    },
    {
      "id": "user_def456",
      "email": "jane@acme.com",
      "name": "Jane Doe",
      "customerId": "cust_abc123",
      "customerDomain": "acme.com",
      "journeyStage": "ACTIVATED",
      "firstSeenAt": "2024-09-01T08:00:00Z",
      "lastActivityAt": "2025-01-20T11:00:00Z",
      "daysSinceActivity": 12
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJsYXN0X2FjdGl2aXR5X2F0IjoiMjAyNS0wMS0yMFQxMTowMDowMFoiLCJ1c2VyX2lkIjoidXNlcl9kZWY0NTYifQ==",
    "total": 89
  }
}
```

**Key Fields:**
- `journeyStage`: DISCOVERED, SIGNED_UP, ACTIVATED, ENGAGED, INACTIVE
- `daysSinceActivity`: Calculated from `lastActivityAt` (null if never active)
- `customerDomain`: Domain of the parent customer

---

## outlit_get_customer (with all includes)

```json
{
  "customer": {
    "id": "cust_abc123",
    "name": "Acme Corp",
    "domain": "acme.com",
    "billingStatus": "PAYING",
    "firstSeenAt": "2024-06-15T10:30:00Z",
    "lastActivityAt": "2025-01-28T14:22:00Z"
  },
  "users": [
    {
      "id": "user_xyz",
      "email": "john@acme.com",
      "name": "John Smith",
      "journeyStage": "ENGAGED",
      "lastActivityAt": "2025-01-28T14:22:00Z"
    },
    {
      "id": "user_abc",
      "email": "jane@acme.com",
      "name": "Jane Doe",
      "journeyStage": "ACTIVATED",
      "lastActivityAt": "2025-01-20T11:00:00Z"
    }
  ],
  "revenue": {
    "currentMrr": 500000,
    "lifetimeRevenue": 3500000,
    "activeSubscriptions": 2
  },
  "recentTimeline": [
    {
      "type": "EMAIL_RECEIVED",
      "title": "Re: Q1 Planning",
      "contact": "john@acme.com",
      "occurredAt": "2025-01-28T14:22:00Z"
    },
    {
      "type": "MEETING_COMPLETED",
      "title": "Quarterly Review",
      "contact": "john@acme.com",
      "occurredAt": "2025-01-20T15:00:00Z"
    }
  ],
  "behaviorMetrics": {
    "activityCount": 47,
    "activeUsers": 3,
    "lastEmailAt": "2025-01-27T09:15:00Z",
    "lastMeetingAt": "2025-01-20T15:00:00Z"
  }
}
```

**Journey Stages:** `DISCOVERED`, `SIGNED_UP`, `ACTIVATED`, `ENGAGED`, `INACTIVE`

---

## outlit_get_timeline

```json
{
  "events": [
    {
      "id": "evt_001",
      "eventType": "EMAIL_RECEIVED",
      "channel": "EMAIL",
      "title": "Re: Q1 Planning",
      "summary": null,
      "occurredAt": "2025-01-28T14:22:00Z",
      "contact": "john@acme.com",
      "metadata": "{\"subject\": \"Re: Q1 Planning\"}"
    },
    {
      "id": "evt_002",
      "eventType": "MEETING_COMPLETED",
      "channel": "CALL",
      "title": "Quarterly Review",
      "summary": null,
      "occurredAt": "2025-01-20T15:00:00Z",
      "contact": "john@acme.com",
      "metadata": "{\"duration\": 3600}"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJvY2N1cnJlZEF0IjoiMjAyNS0wMS0yMFQxNTowMDowMFoiLCJldmVudElkIjoiZXZ0XzAwMiJ9"
  }
}
```

**Event Types by Channel:**
- EMAIL: `EMAIL_SENT`, `EMAIL_RECEIVED`, `EMAIL_OPENED`, `EMAIL_CLICKED`
- CALL: `CALL_COMPLETED`, `CALL_MISSED`
- SLACK: `SLACK_MESSAGE`, `SLACK_REACTION`
- CRM: `CRM_DEAL_CREATED`, `CRM_DEAL_UPDATED`
- BILLING: `SUBSCRIPTION_STARTED`, `SUBSCRIPTION_CANCELLED`

---

## outlit_query (SQL)

### Successful Query

```json
{
  "success": true,
  "data": [
    { "event_type": "pageview", "cnt": 45123 },
    { "event_type": "click", "cnt": 23456 },
    { "event_type": "form_submission", "cnt": 8901 },
    { "event_type": "signup", "cnt": 1234 }
  ],
  "metadata": {
    "rowsReturned": 4,
    "executionTimeMs": 47,
    "truncated": false
  }
}
```

### Aggregation Query

```json
{
  "success": true,
  "data": [
    { "billing_status": "PAYING", "customers": 45, "mrr_dollars": 125000 },
    { "billing_status": "TRIALING", "customers": 12, "mrr_dollars": 0 },
    { "billing_status": "CHURNED", "customers": 8, "mrr_dollars": 0 }
  ],
  "metadata": {
    "rowsReturned": 3,
    "executionTimeMs": 34,
    "truncated": false
  }
}
```

### Truncated Results

```json
{
  "success": true,
  "data": [
    // ... 1000 rows
  ],
  "metadata": {
    "rowsReturned": 1000,
    "executionTimeMs": 234,
    "truncated": true
  }
}
```

### Error Response

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

---

## outlit_schema

### All Tables

```json
{
  "tables": [
    {
      "name": "events",
      "description": "Customer activity events from all channels (SDK, email, Slack, etc.)",
      "columns": [
        { "name": "event_id", "type": "UUID", "description": "Unique event identifier" },
        { "name": "event_type", "type": "String", "description": "Event type (pageview, click, signup, etc.)" },
        { "name": "event_channel", "type": "String", "description": "Source channel (SDK, EMAIL, SLACK, CALL, CRM, BILLING, SUPPORT, INTERNAL)" },
        { "name": "customer_id", "type": "String", "description": "Customer identifier" },
        { "name": "occurred_at", "type": "DateTime64(3)", "description": "When the event occurred" }
      ],
      "exampleQueries": [
        "SELECT event_type, count(*) FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10"
      ]
    },
    {
      "name": "customer_dimensions",
      "description": "Customer attributes and revenue metrics",
      "columns": [
        { "name": "customer_id", "type": "String", "description": "Customer identifier" },
        { "name": "billing_status", "type": "String", "description": "NONE, TRIALING, PAYING, CHURNED" },
        { "name": "mrr_cents", "type": "Int64", "description": "Monthly recurring revenue in cents" }
      ],
      "exampleQueries": [
        "SELECT billing_status, sum(mrr_cents)/100 as mrr FROM customer_dimensions GROUP BY 1"
      ]
    }
  ]
}
```

### Single Table

```json
{
  "name": "events",
  "description": "Customer activity events from all channels (SDK, email, Slack, etc.)",
  "columns": [
    { "name": "event_id", "type": "UUID", "description": "Unique event identifier" },
    { "name": "event_type", "type": "String", "description": "Event type (pageview, click, signup, etc.)" },
    { "name": "event_channel", "type": "String", "description": "Source channel (SDK, EMAIL, SLACK, CALL, CRM, BILLING, SUPPORT, INTERNAL)" },
    { "name": "customer_id", "type": "String", "description": "Customer identifier" },
    { "name": "customer_domain", "type": "String", "description": "Customer's domain" },
    { "name": "user_id", "type": "String", "description": "User identifier" },
    { "name": "user_email", "type": "String", "description": "User's email address" },
    { "name": "occurred_at", "type": "DateTime64(3)", "description": "When the event occurred" },
    { "name": "properties", "type": "String", "description": "JSON blob of event properties" },
    { "name": "session_id", "type": "String", "description": "Browser session ID (SDK events)" },
    { "name": "organization_id", "type": "String", "description": "Organization (auto-filtered by row policy)" }
  ],
  "exampleQueries": [
    "SELECT event_type, count(*) as cnt FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 10",
    "SELECT toDate(occurred_at) as day, count(*) FROM events GROUP BY 1 ORDER BY 1"
  ]
}
```

---

## Empty Results

### List Endpoints

```json
{
  "items": [],
  "pagination": {
    "hasMore": false,
    "nextCursor": null,
    "total": 0
  }
}
```

### SQL Results

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

## Parsing Tips

### Converting Monetary Values

```javascript
// All monetary values are in cents
const displayMrr = (mrr_cents / 100).toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD'
});
// 500000 → "$5,000.00"
```

### Handling Pagination

```javascript
let allItems = [];
let cursor = null;

do {
  const response = await query({ ...params, cursor });
  allItems.push(...response.items);
  cursor = response.pagination.nextCursor;
} while (response.pagination.hasMore);
```

### Checking SQL Truncation

```javascript
if (response.metadata.truncated) {
  // Add more WHERE filters or increase limit (max 10000)
  console.log('Results were truncated, consider refining query');
}
```
