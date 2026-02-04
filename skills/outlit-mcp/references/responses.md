# Example Responses

Full response examples for each Outlit MCP tool to understand data shapes and parsing.

---

## Quick Index

| Tool | Jump to |
|------|---------|
| `outlit_list_customers` | [→](#outlit_list_customers) |
| `outlit_get_customer` | [→](#outlit_get_customer-with-all-includes) |
| `outlit_get_timeline` | [→](#outlit_get_timeline) |
| `outlit_get_customer_revenue` | [→](#outlit_get_customer_revenue) |
| `outlit_query` (SQL) | [→](#outlit_query-sql) |
| `outlit_schema` | [→](#outlit_schema) |
| `outlit_list_entities` | [→](#outlit_list_entities) |
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
      "type": "COMPANY",
      "status": "ACTIVE",
      "billingStatus": "PAYING",
      "firstSeenAt": "2024-06-15T10:30:00Z",
      "lastActivityAt": "2025-01-28T14:22:00Z",
      "contactCount": 5,
      "currentMrr": 500000,
      "daysSinceActivity": 3,
      "riskSignal": "healthy"
    },
    {
      "id": "cust_def456",
      "name": "Beta Inc",
      "domain": "beta.io",
      "type": "COMPANY",
      "status": "ACTIVE",
      "billingStatus": "PAYING",
      "firstSeenAt": "2024-09-01T08:00:00Z",
      "lastActivityAt": "2024-12-15T16:45:00Z",
      "contactCount": 3,
      "currentMrr": 250000,
      "daysSinceActivity": 47,
      "riskSignal": "critical"
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
- `riskSignal`: `healthy` (≤7d), `at_risk` (7-30d), `critical` (30d+)
- `daysSinceActivity`: Calculated from `lastActivityAt`

---

## outlit_get_customer (with all includes)

```json
{
  "customer": {
    "id": "cust_abc123",
    "name": "Acme Corp",
    "domain": "acme.com",
    "type": "COMPANY",
    "status": "ACTIVE",
    "billingStatus": "PAYING",
    "firstSeenAt": "2024-06-15T10:30:00Z",
    "lastActivityAt": "2025-01-28T14:22:00Z",
    "owner": "sales@mycompany.com"
  },
  "contacts": [
    {
      "id": "contact_xyz",
      "email": "john@acme.com",
      "name": "John Smith",
      "role": "VP Engineering",
      "journeyStage": "ENGAGED",
      "lastActivityAt": "2025-01-28T14:22:00Z"
    },
    {
      "id": "contact_abc",
      "email": "jane@acme.com",
      "name": "Jane Doe",
      "role": "CTO",
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
    "activeContacts": 3,
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
  "customer": {
    "id": "cust_abc123",
    "name": "Acme Corp"
  },
  "items": [
    {
      "id": "evt_001",
      "type": "EMAIL_RECEIVED",
      "channel": "EMAIL",
      "timestamp": "2025-01-28T14:22:00Z",
      "contact": {
        "email": "john@acme.com",
        "name": "John Smith"
      },
      "metadata": {
        "subject": "Re: Q1 Planning",
        "from": "john@acme.com",
        "to": ["sales@mycompany.com"]
      }
    },
    {
      "id": "evt_002",
      "type": "MEETING_COMPLETED",
      "channel": "CALENDAR",
      "timestamp": "2025-01-20T15:00:00Z",
      "contact": {
        "email": "john@acme.com",
        "name": "John Smith"
      },
      "metadata": {
        "title": "Quarterly Review",
        "duration": 3600,
        "attendees": ["john@acme.com", "jane@acme.com", "sales@mycompany.com"]
      }
    },
    {
      "id": "evt_003",
      "type": "SLACK_MESSAGE",
      "channel": "SLACK",
      "timestamp": "2025-01-18T10:30:00Z",
      "contact": {
        "email": "jane@acme.com",
        "name": "Jane Doe"
      },
      "metadata": {
        "channel": "#acme-support",
        "messagePreview": "Quick question about the API..."
      }
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJ0aW1lc3RhbXAiOiIyMDI1LTAxLTE4VDEwOjMwOjAwWiIsImlkIjoiZXZ0XzAwMyJ9",
    "total": 47
  }
}
```

**Event Types by Channel:**
- EMAIL: `EMAIL_SENT`, `EMAIL_RECEIVED`, `EMAIL_OPENED`, `EMAIL_CLICKED`
- CALENDAR: `MEETING_SCHEDULED`, `MEETING_COMPLETED`, `MEETING_CANCELLED`
- SLACK: `SLACK_MESSAGE`, `SLACK_REACTION`
- CALL: `CALL_COMPLETED`, `CALL_MISSED`

---

## outlit_get_customer_revenue

```json
{
  "customerId": "cust_abc123",
  "customerName": "Acme Corp",
  "domain": "acme.com",
  "billingStatus": "PAYING",
  "revenue": {
    "currentMrr": 500000,
    "currency": "USD",
    "lifetimeRevenue": 3500000,
    "activeSubscriptionCount": 2,
    "lastCalculatedAt": "2025-01-30T00:00:00Z"
  },
  "attribution": {
    "channel": "organic",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "brand-q4",
    "referrer": "https://google.com"
  },
  "recentBillingEvents": [
    {
      "id": "bill_001",
      "eventType": "INVOICE_PAID",
      "amount": 500000,
      "currency": "USD",
      "description": "Monthly subscription",
      "occurredAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "bill_002",
      "eventType": "SUBSCRIPTION_RENEWED",
      "amount": 500000,
      "currency": "USD",
      "description": "Annual renewal",
      "occurredAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Billing Event Types:** `INVOICE_PAID`, `INVOICE_FAILED`, `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_CANCELLED`, `REFUND_ISSUED`

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
        { "name": "event_channel", "type": "String", "description": "Source channel (SDK, EMAIL, SLACK, CALENDAR, CALL)" },
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
    { "name": "event_channel", "type": "String", "description": "Source channel (SDK, EMAIL, SLACK, CALENDAR, CALL)" },
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

## outlit_list_entities

```json
{
  "entities": [
    {
      "name": "customer",
      "description": "Companies and individuals tracked in Outlit",
      "operations": ["list", "get", "query"]
    },
    {
      "name": "contact",
      "description": "Individual contacts associated with customers",
      "operations": ["list", "get"]
    },
    {
      "name": "activity",
      "description": "Timeline events and customer interactions",
      "operations": ["query"]
    },
    {
      "name": "revenue",
      "description": "Subscription and billing data",
      "operations": ["get", "query"]
    }
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
