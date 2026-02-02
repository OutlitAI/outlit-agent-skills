# Troubleshooting Guide

Solutions for common issues when using Outlit MCP tools.

---

## Quick Diagnosis

| Symptom | Likely Cause | Jump to |
|---------|--------------|---------|
| 401 Unauthorized | Authentication issue | [→](#authentication-errors) |
| 404 Not Found | Invalid customer/entity | [→](#not-found-errors) |
| 503 Service Unavailable | ClickHouse offline | [→](#clickhouse-unavailable) |
| Empty results | Filters too narrow | [→](#empty-results) |
| Slow queries | Missing filters | [→](#slow-queries) |
| SQL errors | Syntax or permission | [→](#sql-errors) |

---

## Authentication Errors

### 401 Unauthorized

**Symptoms:**
- "Unauthorized" response
- "Invalid credentials"
- "Authentication required"

**Causes:**
1. MCP connection not authorized
2. OAuth token expired
3. User lacks organization access

**Solutions:**

1. **Re-authorize MCP connection**
   - Disconnect and reconnect the MCP server in your client
   - Complete OAuth flow again

2. **Check user permissions**
   - Verify user has access to the organization
   - Contact admin if permissions are missing

3. **Verify MCP server is running**
   - Check if MCP server is accessible
   - Verify server URL configuration

---

## Not Found Errors

### 404 Customer Not Found

**Symptoms:**
- "Customer not found"
- "Entity does not exist"
- Empty response for known customer

**Causes:**
1. Incorrect customer ID format
2. Customer doesn't exist
3. Customer in different organization

**Solutions:**

1. **Verify customer identifier**
   ```json
   // Try different identifiers
   { "customer": "cust_123" }        // ID
   { "customer": "acme.com" }        // Domain
   { "customer": "Acme Corporation" } // Name
   ```

2. **Search for customer first**
   ```json
   {
     "tool": "outlit_list_customers",
     "search": "acme",
     "limit": 10
   }
   ```

3. **Check organization context**
   - Ensure you're querying the correct organization
   - Customer may exist in different org

---

## ClickHouse Unavailable

### 503 Service Unavailable

**Symptoms:**
- "Service unavailable" on analytics queries
- "ClickHouse not available"
- Timeout on event/feature queries

**Affected Tools:**
- `outlit_query` with types: `event_aggregates`, `event_trends`, `feature_usage`, `session_metrics`, `communication_summary`
- `outlit_sql`
- `outlit_schema`

**Solutions:**

1. **Use Prisma-based alternatives**
   ```json
   // Instead of event_aggregates, use customer-level data
   {
     "tool": "outlit_query",
     "queryType": "customer_cohort",
     "params": { "include": ["revenue"] }
   }
   ```

2. **Check service status**
   - ClickHouse may be temporarily unavailable
   - Retry after a few minutes

3. **Fall back to customer tools**
   - `outlit_list_customers` (Prisma-based, always available)
   - `outlit_get_customer` (Prisma-based)
   - `outlit_get_customer_revenue` (Prisma-based)
   - `outlit_query` with `revenue_*` or `customer_*` types

**Prisma-Based Query Types (always available):**
- `customer_cohort`
- `customer_metrics`
- `contact_journey`
- `revenue_metrics`
- `revenue_attribution`
- `revenue_trends`
- `company_insights`
- `contact_insights`

---

## Empty Results

### No Data Returned

**Symptoms:**
- `"data": []` in response
- `"total": 0`
- `"items": []`

**Causes:**
1. Filters too restrictive
2. Wrong timeframe
3. Data doesn't exist yet
4. Organization has no data

**Solutions:**

1. **Widen filters**
   ```json
   // Too restrictive
   {
     "billingStatus": "PAYING",
     "noActivityInLast": "7d",
     "mrrAbove": 100000
   }

   // Start broader
   {
     "billingStatus": "PAYING"
   }
   ```

2. **Extend timeframe**
   ```json
   // Try longer timeframe
   { "timeframe": "90d" }  // Instead of "7d"
   { "timeframe": "1y" }   // For historical data
   { "timeframe": "all" }  // All available data
   ```

3. **Remove one filter at a time**
   - Remove `mrrAbove`/`mrrBelow` first
   - Then remove activity filters
   - Finally check without status filters

4. **Verify data exists**
   ```json
   // Get total customer count
   {
     "tool": "outlit_query",
     "queryType": "customer_metrics",
     "groupBy": ["billingStatus"]
   }
   ```

---

## Slow Queries

### Queries Taking Too Long

**Symptoms:**
- Long wait times
- Timeout errors
- "Query exceeded time limit"

**Causes:**
1. Missing time filters
2. Too large result set
3. Complex SQL without indexes
4. `timeframe: "all"` on large datasets

**Solutions:**

1. **Add time filters**
   ```json
   // Always include timeframe
   { "timeframe": "30d" }  // Not "all"
   ```

2. **Reduce limit**
   ```json
   { "limit": 25 }  // Instead of 1000
   ```

3. **Add WHERE clauses to SQL**
   ```json
   {
     "tool": "outlit_sql",
     "sql": "SELECT ... FROM events WHERE occurred_at >= now() - INTERVAL 7 DAY ..."
   }
   ```

4. **Filter at the source**
   ```json
   // Filter in query, not after
   {
     "billingStatus": "PAYING",
     "mrrAbove": 5000
   }
   ```

5. **Avoid SELECT ***
   ```sql
   -- Bad
   SELECT * FROM customer_dimensions

   -- Good
   SELECT customer_id, name, mrr_cents FROM customer_dimensions
   WHERE billing_status = 'PAYING'
   LIMIT 50
   ```

---

## SQL Errors

### SYNTAX_ERROR

**Symptoms:**
- "SQL syntax error"
- "Parse error"
- "Unexpected token"

**Solutions:**

1. **Check ClickHouse syntax**
   ```sql
   -- MySQL style (wrong)
   DATE_SUB(NOW(), INTERVAL 30 DAY)

   -- ClickHouse style (correct)
   now() - INTERVAL 30 DAY
   ```

2. **Use correct date functions**
   ```sql
   -- ClickHouse date functions
   toDate(occurred_at)
   toStartOfMonth(occurred_at)
   formatDateTime(occurred_at, '%Y-%m-%d')
   ```

3. **Check column names with schema**
   ```json
   { "tool": "outlit_schema", "table": "events" }
   ```

### TABLE_NOT_FOUND

**Symptoms:**
- "Table 'xxx' is not available"
- "Unknown table"

**Solutions:**

1. **Use only allowed tables**
   - `events`
   - `customer_dimensions`
   - `user_dimensions`
   - `mrr_snapshots`

2. **Check exact table name**
   ```json
   { "tool": "outlit_schema" }
   ```

### FUNCTION_NOT_ALLOWED

**Symptoms:**
- "Function 'xxx' is not allowed"
- "Blocked function"

**Blocked functions:**
- `file()`, `url()`, `remote()`, `s3()` — external access
- `sleep()`, `throwif()` — system manipulation

**Solutions:**

Use standard ClickHouse functions instead:
- Aggregations: `count()`, `sum()`, `avg()`, `min()`, `max()`
- Date: `toDate()`, `toStartOfMonth()`, `now()`
- String: `lower()`, `upper()`, `concat()`
- Conditional: `if()`, `case`, `countIf()`

### QUERY_NOT_ALLOWED

**Symptoms:**
- "Query type not allowed"
- "Only SELECT queries allowed"

**Causes:**
1. Using INSERT, UPDATE, DELETE
2. Using DDL (CREATE, DROP, ALTER)
3. Using SETTINGS clause

**Solutions:**

Only SELECT queries are allowed:
```sql
-- Allowed
SELECT * FROM events LIMIT 10

-- Not allowed
INSERT INTO events VALUES (...)
DELETE FROM events WHERE ...
SELECT * FROM events SETTINGS max_rows = 100
```

### EXECUTION_ERROR

**Symptoms:**
- "Query execution failed"
- "Memory limit exceeded"
- "Timeout"

**Solutions:**

1. **Add more filters**
   ```sql
   WHERE occurred_at >= now() - INTERVAL 7 DAY
   AND billing_status = 'PAYING'
   ```

2. **Reduce result size**
   ```sql
   LIMIT 100  -- Instead of no limit
   ```

3. **Simplify query**
   - Break complex queries into smaller parts
   - Avoid multiple large JOINs

---

## Pagination Issues

### Missing Next Page

**Symptoms:**
- `nextCursor: null` but expect more data
- `hasMore: false` unexpectedly

**Solutions:**

1. **Check total count**
   ```json
   // Response includes total
   {
     "pagination": {
       "hasMore": false,
       "total": 15  // Only 15 records exist
     }
   }
   ```

2. **Increase limit to see more**
   ```json
   { "limit": 100 }  // Default is often 20
   ```

### Invalid Cursor

**Symptoms:**
- "Invalid cursor"
- "Cursor expired"

**Solutions:**

1. **Use fresh cursor**
   - Cursors from previous session may be invalid
   - Start pagination from beginning

2. **Don't modify cursor**
   - Use exact cursor string from response
   - Cursors are encoded, don't decode/modify

---

## Data Format Issues

### Monetary Values

**Problem:** Values like `500000` instead of `$5,000`

**Solution:** All monetary values are in cents

```javascript
// Convert to dollars
const mrr_dollars = mrr_cents / 100;
// 500000 → 5000.00
```

### Timestamps

**Problem:** Unexpected date formats

**Solution:** All dates are ISO 8601

```
2025-01-15T10:30:00Z  // UTC timestamp
```

### IDs

**Problem:** ID format confusion

**Solution:** IDs use prefixes

```
cust_abc123     // Customer ID
contact_xyz456  // Contact ID
evt_789xyz      // Event ID
```

---

## Tool-Specific Issues

### outlit_list_customers

| Issue | Solution |
|-------|----------|
| No risk signals | Only available for paying customers |
| Can't combine hasActivity + noActivity | These are mutually exclusive |
| Search not finding results | Search checks name and domain only |

### outlit_get_customer

| Issue | Solution |
|-------|----------|
| Missing includes | Specify in `include` array |
| behaviorMetrics empty | Depends on timeframe, extend it |
| Slow with all includes | Request only needed sections |

### outlit_get_timeline

| Issue | Solution |
|-------|----------|
| No events | Check channels filter, extend timeframe |
| Too many events | Add channel/eventType filters |
| Missing event details | Check eventTypes parameter |

### outlit_query

| Issue | Solution |
|-------|----------|
| Unknown queryType | Use `outlit_list_query_types` to discover |
| Invalid groupBy | Check allowed fields per query type |
| 503 on event queries | ClickHouse unavailable, use alternatives |

### outlit_sql

| Issue | Solution |
|-------|----------|
| Can't find column | Use `outlit_schema` first |
| Query blocked | Check security restrictions |
| Slow execution | Add WHERE filters, use LIMIT |

---

## Getting Help

If issues persist:

1. **Check error message hints** — Responses include actionable hints
2. **Verify with schema discovery** — Use `outlit_schema` and `outlit_list_query_types`
3. **Start simple** — Build queries incrementally
4. **Check data exists** — Query customer_metrics first to verify data

**Useful diagnostic queries:**

```json
// Verify you have data
{ "tool": "outlit_query", "queryType": "customer_metrics", "groupBy": ["billingStatus"] }

// Check available tables
{ "tool": "outlit_schema" }

// Check available query types
{ "tool": "outlit_list_query_types" }

// Simple customer list
{ "tool": "outlit_list_customers", "limit": 5 }
```
