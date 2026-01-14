---
type: "docs"
title: "Real-time SSE Dashboard"
linkTitle: "Real-time SSE Dashboard"
weight: 30
description: "Build a live dashboard using Server-Sent Events"
related:
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  tutorials:
    - title: "PostgreSQL Change Detection"
      url: "/drasi-server/tutorials/postgresql-change-detection/"
    - title: "Local Development"
      url: "/drasi-server/tutorials/local-development/"
  howto:
    - title: "Configure SSE Reaction"
      url: "/drasi-server/how-to-guides/configuration/configure-reactions/configure-sse-reaction/"
    - title: "Configure PostgreSQL Source"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/configure-postgresql-source/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

# Real-time SSE Dashboard Tutorial

In this tutorial, you'll build a real-time dashboard that displays live data using Server-Sent Events (SSE). The dashboard will automatically update when database changes occur, powered by {{< term "Drasi Server" >}}.

## What You'll Build

- PostgreSQL database with metrics data
- Drasi Server with SSE {{< term "Reaction" >}}
- HTML dashboard with live updates
- Real-time visualizations powered by {{< term "Continuous Query" "Continuous Queries" >}}

## Prerequisites

- Docker and Docker Compose
- A web browser
- curl (for testing)

## Step 1: Create Project Structure

```bash
mkdir drasi-sse-dashboard
cd drasi-sse-dashboard
mkdir -p config public
```

## Step 2: Create Docker Compose File

Create `docker-compose.yaml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: metrics
    ports:
      - "5432:5432"
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    command: >
      postgres
      -c wal_level=logical
      -c max_replication_slots=4
      -c max_wal_senders=4

  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
      - "8081:8081"
    volumes:
      - ./config:/config:ro
    depends_on:
      - postgres
    command: ["--config", "/config/server.yaml"]

  web:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./public:/usr/share/nginx/html:ro
```

## Step 3: Create Database Schema

Create `init.sql`:

```sql
-- Create metrics table
CREATE TABLE metrics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create publication
CREATE PUBLICATION drasi_publication FOR ALL TABLES;

-- Insert initial metrics
INSERT INTO metrics (name, value, unit) VALUES
    ('cpu_usage', 45.5, 'percent'),
    ('memory_usage', 62.3, 'percent'),
    ('disk_usage', 78.1, 'percent'),
    ('network_in', 125.4, 'mbps'),
    ('network_out', 89.2, 'mbps'),
    ('active_connections', 42, 'count'),
    ('request_rate', 1250, 'req/min'),
    ('error_rate', 0.5, 'percent');

-- Insert sample alerts
INSERT INTO alerts (metric_name, severity, message) VALUES
    ('disk_usage', 'warning', 'Disk usage above 75%');
```

## Step 4: Create Drasi Configuration

Create `config/server.yaml`:

```yaml
id: dashboard-server
host: 0.0.0.0
port: 8080
log_level: info

state_store:
  kind: redb
  path: /data/state.redb

sources:
  - kind: postgres
    id: metrics-db
    host: postgres
    port: 5432
    database: metrics
    user: postgres
    password: postgres
    tables:
      - public.metrics
      - public.alerts
    slot_name: drasi_dashboard_slot
    publication_name: drasi_publication
    bootstrap_provider:
      type: postgres

queries:
  - id: current-metrics
    query: |
      MATCH (m:metrics)
      RETURN m.id, m.name, m.value, m.unit, m.updated_at
    sources:
      - source_id: metrics-db
        nodes: [metrics]
    auto_start: true

  - id: active-alerts
    query: |
      MATCH (a:alerts)
      WHERE a.acknowledged = false
      RETURN a.id, a.metric_name, a.severity, a.message, a.created_at
    sources:
      - source_id: metrics-db
        nodes: [alerts]
    auto_start: true

  - id: critical-metrics
    query: |
      MATCH (m:metrics)
      WHERE (m.name = 'cpu_usage' AND m.value > 80)
         OR (m.name = 'memory_usage' AND m.value > 85)
         OR (m.name = 'disk_usage' AND m.value > 90)
         OR (m.name = 'error_rate' AND m.value > 5)
      RETURN m.name, m.value, m.unit
    sources:
      - source_id: metrics-db
        nodes: [metrics]
    auto_start: true

reactions:
  - kind: sse
    id: dashboard-stream
    queries: [current-metrics, active-alerts, critical-metrics]
    host: 0.0.0.0
    port: 8081
    sse_path: /events
    heartbeat_interval_ms: 30000

  - kind: log
    id: metric-logger
    queries: [critical-metrics]
    routes:
      critical-metrics:
        added:
          template: "CRITICAL: {{after.name}} = {{after.value}}{{after.unit}}"
```

## Step 5: Create the Dashboard

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drasi Real-time Dashboard</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a2e;
            color: #eee;
            padding: 20px;
        }
        h1 {
            color: #00d4aa;
            margin-bottom: 20px;
        }
        .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        .status.connected { background: #00d4aa; color: #000; }
        .status.disconnected { background: #ff6b6b; }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .card {
            background: #16213e;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #0f3460;
        }
        .card h2 {
            color: #00d4aa;
            margin-bottom: 15px;
            font-size: 16px;
            text-transform: uppercase;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #0f3460;
        }
        .metric:last-child { border-bottom: none; }
        .metric-name { color: #aaa; }
        .metric-value {
            font-weight: bold;
            font-size: 18px;
        }
        .metric-value.warning { color: #ffd93d; }
        .metric-value.critical { color: #ff6b6b; }
        .alert {
            background: #0f3460;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 10px;
            border-left: 4px solid;
        }
        .alert.warning { border-color: #ffd93d; }
        .alert.critical { border-color: #ff6b6b; }
        .alert-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .alert-severity {
            font-size: 12px;
            text-transform: uppercase;
            padding: 2px 8px;
            border-radius: 4px;
        }
        .alert.warning .alert-severity { background: #ffd93d; color: #000; }
        .alert.critical .alert-severity { background: #ff6b6b; color: #fff; }
        .alert-message { color: #ccc; font-size: 14px; }
        .no-alerts { color: #00d4aa; text-align: center; padding: 20px; }
        .events-log {
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
        .event {
            padding: 8px;
            border-bottom: 1px solid #0f3460;
        }
        .event-time { color: #666; }
        .event-type {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            margin-left: 8px;
        }
        .event-type.added { background: #00d4aa; color: #000; }
        .event-type.updated { background: #ffd93d; color: #000; }
        .event-type.deleted { background: #ff6b6b; }
    </style>
</head>
<body>
    <h1>System Metrics Dashboard <span id="status" class="status disconnected">Disconnected</span></h1>

    <div class="dashboard">
        <div class="card">
            <h2>System Metrics</h2>
            <div id="metrics">Loading...</div>
        </div>

        <div class="card">
            <h2>Active Alerts</h2>
            <div id="alerts">Loading...</div>
        </div>

        <div class="card">
            <h2>Critical Thresholds</h2>
            <div id="critical">No critical metrics</div>
        </div>

        <div class="card">
            <h2>Event Log</h2>
            <div id="events" class="events-log"></div>
        </div>
    </div>

    <script>
        const metrics = {};
        const alerts = {};
        const critical = {};

        function updateMetricsUI() {
            const container = document.getElementById('metrics');
            const html = Object.values(metrics)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(m => {
                    let valueClass = '';
                    if (m.name.includes('usage') && m.value > 80) valueClass = 'warning';
                    if (m.name.includes('usage') && m.value > 90) valueClass = 'critical';
                    if (m.name === 'error_rate' && m.value > 2) valueClass = 'warning';
                    if (m.name === 'error_rate' && m.value > 5) valueClass = 'critical';
                    return `
                        <div class="metric">
                            <span class="metric-name">${m.name.replace(/_/g, ' ')}</span>
                            <span class="metric-value ${valueClass}">${m.value} ${m.unit || ''}</span>
                        </div>
                    `;
                }).join('');
            container.innerHTML = html || 'No metrics';
        }

        function updateAlertsUI() {
            const container = document.getElementById('alerts');
            const alertList = Object.values(alerts);
            if (alertList.length === 0) {
                container.innerHTML = '<div class="no-alerts">No active alerts</div>';
                return;
            }
            container.innerHTML = alertList.map(a => `
                <div class="alert ${a.severity}">
                    <div class="alert-header">
                        <span>${a.metric_name}</span>
                        <span class="alert-severity">${a.severity}</span>
                    </div>
                    <div class="alert-message">${a.message}</div>
                </div>
            `).join('');
        }

        function updateCriticalUI() {
            const container = document.getElementById('critical');
            const criticalList = Object.values(critical);
            if (criticalList.length === 0) {
                container.innerHTML = '<div class="no-alerts">All metrics within normal range</div>';
                return;
            }
            container.innerHTML = criticalList.map(m => `
                <div class="metric">
                    <span class="metric-name">${m.name.replace(/_/g, ' ')}</span>
                    <span class="metric-value critical">${m.value} ${m.unit || ''}</span>
                </div>
            `).join('');
        }

        function addEvent(type, queryId, data) {
            const container = document.getElementById('events');
            const time = new Date().toLocaleTimeString();
            const event = document.createElement('div');
            event.className = 'event';
            event.innerHTML = `
                <span class="event-time">${time}</span>
                <span class="event-type ${type}">${type}</span>
                <span>${queryId}: ${JSON.stringify(data).substring(0, 50)}...</span>
            `;
            container.insertBefore(event, container.firstChild);
            // Keep only last 50 events
            while (container.children.length > 50) {
                container.removeChild(container.lastChild);
            }
        }

        function connect() {
            const eventSource = new EventSource('http://localhost:8081/events');

            eventSource.onopen = () => {
                document.getElementById('status').className = 'status connected';
                document.getElementById('status').textContent = 'Connected';
            };

            eventSource.onerror = () => {
                document.getElementById('status').className = 'status disconnected';
                document.getElementById('status').textContent = 'Disconnected';
                setTimeout(connect, 5000);
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    processEvent(data);
                } catch (e) {
                    console.error('Failed to parse event:', e);
                }
            };
        }

        function processEvent(event) {
            const queryId = event.queryId || event.query_id;

            if (event.added) {
                event.added.forEach(item => {
                    const record = item.after || item;
                    if (queryId === 'current-metrics') {
                        metrics[record.id] = record;
                        updateMetricsUI();
                    } else if (queryId === 'active-alerts') {
                        alerts[record.id] = record;
                        updateAlertsUI();
                    } else if (queryId === 'critical-metrics') {
                        critical[record.name] = record;
                        updateCriticalUI();
                    }
                    addEvent('added', queryId, record);
                });
            }

            if (event.updated) {
                event.updated.forEach(item => {
                    const record = item.after || item;
                    if (queryId === 'current-metrics') {
                        metrics[record.id] = record;
                        updateMetricsUI();
                    } else if (queryId === 'active-alerts') {
                        alerts[record.id] = record;
                        updateAlertsUI();
                    } else if (queryId === 'critical-metrics') {
                        critical[record.name] = record;
                        updateCriticalUI();
                    }
                    addEvent('updated', queryId, record);
                });
            }

            if (event.deleted) {
                event.deleted.forEach(item => {
                    const record = item.before || item;
                    if (queryId === 'current-metrics') {
                        delete metrics[record.id];
                        updateMetricsUI();
                    } else if (queryId === 'active-alerts') {
                        delete alerts[record.id];
                        updateAlertsUI();
                    } else if (queryId === 'critical-metrics') {
                        delete critical[record.name];
                        updateCriticalUI();
                    }
                    addEvent('deleted', queryId, record);
                });
            }
        }

        // Load initial data
        async function loadInitialData() {
            try {
                const metricsResp = await fetch('http://localhost:8080/api/v1/queries/current-metrics/results');
                const metricsData = await metricsResp.json();
                if (metricsData.data?.results) {
                    metricsData.data.results.forEach(m => metrics[m.id] = m);
                    updateMetricsUI();
                }

                const alertsResp = await fetch('http://localhost:8080/api/v1/queries/active-alerts/results');
                const alertsData = await alertsResp.json();
                if (alertsData.data?.results) {
                    alertsData.data.results.forEach(a => alerts[a.id] = a);
                    updateAlertsUI();
                }

                const criticalResp = await fetch('http://localhost:8080/api/v1/queries/critical-metrics/results');
                const criticalData = await criticalResp.json();
                if (criticalData.data?.results) {
                    criticalData.data.results.forEach(m => critical[m.name] = m);
                    updateCriticalUI();
                }
            } catch (e) {
                console.error('Failed to load initial data:', e);
            }
        }

        loadInitialData();
        connect();
    </script>
</body>
</html>
```

## Step 6: Start the Environment

```bash
docker compose up -d
sleep 10
```

## Step 7: Open the Dashboard

Open your browser to: **http://localhost:3000**

You should see the dashboard with initial metrics and alerts.

## Step 8: Generate Live Updates

Connect to PostgreSQL and make changes:

```bash
docker compose exec postgres psql -U postgres -d metrics
```

Try these updates and watch the dashboard:

```sql
-- Update CPU usage (watch the metrics panel)
UPDATE metrics SET value = 85.5, updated_at = NOW()
WHERE name = 'cpu_usage';

-- Trigger a critical threshold
UPDATE metrics SET value = 95.0, updated_at = NOW()
WHERE name = 'disk_usage';

-- Add a new alert
INSERT INTO alerts (metric_name, severity, message)
VALUES ('cpu_usage', 'critical', 'CPU usage exceeded 85%');

-- Update request rate
UPDATE metrics SET value = 2500, updated_at = NOW()
WHERE name = 'request_rate';

-- Acknowledge an alert (removes from active)
UPDATE alerts SET acknowledged = true
WHERE metric_name = 'disk_usage';

-- Create high error rate
UPDATE metrics SET value = 8.5, updated_at = NOW()
WHERE name = 'error_rate';
```

## Step 9: Simulate Continuous Updates

Create a script to simulate real metrics:

```bash
# In a separate terminal
docker compose exec postgres psql -U postgres -d metrics -c "
DO \$\$
DECLARE
    cpu_val DECIMAL;
    mem_val DECIMAL;
BEGIN
    FOR i IN 1..20 LOOP
        cpu_val := 40 + random() * 50;
        mem_val := 50 + random() * 40;

        UPDATE metrics SET value = cpu_val, updated_at = NOW()
        WHERE name = 'cpu_usage';

        UPDATE metrics SET value = mem_val, updated_at = NOW()
        WHERE name = 'memory_usage';

        UPDATE metrics SET value = 1000 + random() * 1000, updated_at = NOW()
        WHERE name = 'request_rate';

        PERFORM pg_sleep(2);
    END LOOP;
END \$\$;
"
```

## Understanding SSE Events

The SSE reaction sends events in this format:

```json
{
  "queryId": "current-metrics",
  "added": [{"after": {"id": 1, "name": "cpu_usage", "value": 85.5}}],
  "updated": [],
  "deleted": []
}
```

Your JavaScript code processes these events and updates the UI accordingly.

## Cleanup

```bash
docker compose down -v
```

## Next Steps

- [Configure SSE Reaction](/drasi-server/how-to-guides/configure-reactions/configure-sse-reaction/) - Advanced SSE options
- [Write Continuous Queries](/drasi-server/how-to-guides/write-continuous-queries/) - Complex queries
- [Operations](/drasi-server/how-to-guides/operations/) - Production deployment

## Troubleshooting

### Dashboard Not Updating

1. Check SSE connection in browser DevTools (Network tab)
2. Verify SSE reaction is running:
   ```bash
   curl http://localhost:8080/api/v1/reactions/dashboard-stream
   ```

### CORS Errors

If running on different ports, you may need to configure CORS. The SSE reaction serves from port 8081 by default.

### Events Not Appearing

1. Check Drasi Server logs:
   ```bash
   docker compose logs -f drasi-server
   ```
2. Verify queries are returning data:
   ```bash
   curl http://localhost:8080/api/v1/queries/current-metrics/results
   ```
