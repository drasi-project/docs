---
type: "docs"
title: "Configure SSE Reaction"
linkTitle: "SSE"
weight: 40
description: "Stream query results via Server-Sent Events for real-time dashboards"
---

The SSE (Server-Sent Events) reaction creates an HTTP endpoint that streams query result changes to connected clients. It's ideal for web browsers and applications that need real-time updates.

## Basic Configuration

```yaml
reactions:
  - kind: sse
    id: live-stream
    queries: [my-query]
    host: 0.0.0.0
    port: 8081
    sse_path: /events
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `kind` | string | Required | Must be `sse` |
| `id` | string | Required | Unique reaction identifier |
| `queries` | array | Required | Query IDs to subscribe to |
| `auto_start` | boolean | `true` | Start reaction automatically |
| `host` | string | `0.0.0.0` | Listen address |
| `port` | integer | `8080` | Listen port |
| `sse_path` | string | `/events` | SSE endpoint path |
| `heartbeat_interval_ms` | integer | `30000` | Heartbeat interval in milliseconds |
| `routes` | object | `{}` | Per-query path and template configurations |
| `default_template` | object | None | Default template for all queries |

## Connecting to the SSE Stream

### JavaScript/Browser

```javascript
const eventSource = new EventSource('http://localhost:8081/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Change:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
};
```

### curl

```bash
curl -N http://localhost:8081/events
```

### React Example

```jsx
import { useState, useEffect } from 'react';

function LiveDashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8081/events');

    eventSource.onmessage = (event) => {
      const change = JSON.parse(event.data);

      if (change.op === 'added') {
        setData(prev => [...prev, change.after]);
      } else if (change.op === 'updated') {
        setData(prev => prev.map(item =>
          item.id === change.after.id ? change.after : item
        ));
      } else if (change.op === 'deleted') {
        setData(prev => prev.filter(item => item.id !== change.before.id));
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.name}: {item.value}</li>
      ))}
    </ul>
  );
}
```

## Event Format

Events are sent in Server-Sent Events format:

```
data: {"op":"added","query":"my-query","after":{"id":"1","name":"Test"}}

data: {"op":"updated","query":"my-query","before":{"id":"1","name":"Test"},"after":{"id":"1","name":"Updated"}}

data: {"op":"deleted","query":"my-query","before":{"id":"1","name":"Updated"}}
```

## Custom Templates

### Default Template

Apply to all queries:

```yaml
reactions:
  - kind: sse
    id: custom-stream
    queries: [sensors]
    port: 8081
    default_template:
      added:
        template: '{"event":"new","sensor":{{json after}}}'
      updated:
        template: '{"event":"update","sensor":{{json after}}}'
      deleted:
        template: '{"event":"remove","id":"{{before.id}}"}'
```

### Per-Query Paths

Create separate endpoints for different queries:

```yaml
reactions:
  - kind: sse
    id: multi-stream
    queries: [orders, inventory]
    port: 8081
    sse_path: /events
    routes:
      orders:
        path: /orders/stream
        added:
          template: '{"type":"order","data":{{json after}}}'
      inventory:
        path: /inventory/stream
        updated:
          template: '{"type":"stock","sku":"{{after.sku}}","qty":{{after.quantity}}}'
```

Access at:
- `http://localhost:8081/orders/stream`
- `http://localhost:8081/inventory/stream`
- `http://localhost:8081/events` (all queries)

## Heartbeat Configuration

Keep connections alive with heartbeats:

```yaml
reactions:
  - kind: sse
    id: long-lived-stream
    queries: [events]
    port: 8081
    heartbeat_interval_ms: 15000  # 15 seconds
```

Heartbeats appear as comments in the SSE stream:

```
: heartbeat

data: {"op":"added",...}

: heartbeat
```

## Multiple SSE Endpoints

Run multiple SSE reactions on different ports:

```yaml
reactions:
  - kind: sse
    id: public-stream
    queries: [public-events]
    port: 8081

  - kind: sse
    id: admin-stream
    queries: [all-events, audit-events]
    port: 8082
```

## Docker Configuration

Map SSE ports when running in Docker:

```yaml
# docker-compose.yml
services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"   # REST API
      - "8081:8081"   # SSE endpoint
```

## CORS Configuration

For browser clients from different origins, you may need to configure CORS. The SSE reaction includes appropriate CORS headers by default.

## Complete Example

### Server Configuration

```yaml
host: 0.0.0.0
port: 8080
log_level: info

sources:
  - kind: postgres
    id: orders-db
    host: ${DB_HOST}
    database: ecommerce
    user: ${DB_USER}
    password: ${DB_PASSWORD}
    tables:
      - public.orders
      - public.order_items

queries:
  - id: live-orders
    query: |
      MATCH (o:orders)
      WHERE o.status IN ['pending', 'processing']
      RETURN o.id, o.customer_name, o.total, o.status, o.created_at
    sources:
      - source_id: orders-db

  - id: order-alerts
    query: |
      MATCH (o:orders)
      WHERE o.total > 1000
      RETURN o.id, o.total, o.customer_name
    sources:
      - source_id: orders-db

reactions:
  - kind: sse
    id: dashboard-stream
    queries: [live-orders, order-alerts]
    host: 0.0.0.0
    port: 8081
    heartbeat_interval_ms: 30000
    routes:
      live-orders:
        path: /orders
      order-alerts:
        path: /alerts
        added:
          template: '{"alert":"high_value_order","order":{{json after}}}'
```

### HTML Dashboard

```html
<!DOCTYPE html>
<html>
<head>
  <title>Order Dashboard</title>
</head>
<body>
  <h1>Live Orders</h1>
  <table id="orders">
    <thead>
      <tr>
        <th>ID</th>
        <th>Customer</th>
        <th>Total</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <h2>Alerts</h2>
  <ul id="alerts"></ul>

  <script>
    const orders = {};
    const tbody = document.querySelector('#orders tbody');
    const alertList = document.getElementById('alerts');

    function updateTable() {
      tbody.innerHTML = Object.values(orders)
        .map(o => `
          <tr>
            <td>${o.id}</td>
            <td>${o.customer_name}</td>
            <td>$${o.total}</td>
            <td>${o.status}</td>
          </tr>
        `).join('');
    }

    // Orders stream
    const orderStream = new EventSource('http://localhost:8081/orders');
    orderStream.onmessage = (event) => {
      const change = JSON.parse(event.data);
      if (change.op === 'added' || change.op === 'updated') {
        orders[change.after.id] = change.after;
      } else if (change.op === 'deleted') {
        delete orders[change.before.id];
      }
      updateTable();
    };

    // Alerts stream
    const alertStream = new EventSource('http://localhost:8081/alerts');
    alertStream.onmessage = (event) => {
      const alert = JSON.parse(event.data);
      const li = document.createElement('li');
      li.textContent = `High value order: #${alert.order.id} - $${alert.order.total}`;
      alertList.insertBefore(li, alertList.firstChild);
    };
  </script>
</body>
</html>
```

## Use Cases

### Real-Time Dashboards

Stream data to browser-based dashboards:

```yaml
reactions:
  - kind: sse
    id: metrics-dashboard
    queries: [system-metrics, user-activity]
    port: 8081
```

### Live Notifications

Push notifications to web applications:

```yaml
reactions:
  - kind: sse
    id: notifications
    queries: [user-notifications]
    port: 8081
    routes:
      user-notifications:
        path: /notifications
```

### IoT Monitoring

Stream sensor data to monitoring interfaces:

```yaml
reactions:
  - kind: sse
    id: iot-stream
    queries: [sensor-readings, device-alerts]
    port: 8081
    heartbeat_interval_ms: 10000
```

## Troubleshooting

### Connection Drops

- Decrease `heartbeat_interval_ms`
- Check for proxy timeouts
- Verify network stability

### CORS Errors

- Ensure the client origin is allowed
- Check browser developer tools for specific errors

### No Events Received

- Verify the query is producing results
- Check source is running and connected
- Review server logs for errors

### High Memory Usage

- Limit the number of concurrent connections
- Consider using multiple SSE reactions for different queries

## Next Steps

- [Configure HTTP Reaction](/drasi-server/how-to-guides/configure-reactions/configure-http-reaction/) - For webhook integrations
- [Configure Platform Reaction](/drasi-server/how-to-guides/configure-reactions/configure-platform-reaction/) - For Redis Streams
