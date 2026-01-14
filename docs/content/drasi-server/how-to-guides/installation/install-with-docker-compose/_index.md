---
type: "docs"
title: "Install with Docker Compose"
linkTitle: "Docker Compose"
weight: 30
description: "Deploy Drasi Server with Docker Compose for multi-service environments"
related:
  tutorials:
    - title: "Getting Started"
      url: "/drasi-server/getting-started/"
    - title: "Local Development"
      url: "/drasi-server/tutorials/local-development/"
  howto:
    - title: "Docker Installation"
      url: "/drasi-server/how-to-guides/installation/install-with-docker/"
    - title: "Configure Sources"
      url: "/drasi-server/how-to-guides/configuration/configure-sources/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
---

Docker Compose simplifies deploying {{< term "Drasi Server" >}} alongside related services like databases. This guide covers common Docker Compose configurations.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10 or later
- [Docker Compose](https://docs.docker.com/compose/install/) v2.0 or later

Verify installation:

```bash
docker compose version
```

## Basic Setup

### Minimal docker-compose.yml

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - drasi-data:/data
    restart: unless-stopped

volumes:
  drasi-data:
```

Start the services:

```bash
docker compose up -d
```

## Development Environment

A complete development setup with PostgreSQL:

### docker-compose.yml

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./config:/config:ro
      - drasi-data:/data
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=devpassword
    command: ["--config", "/config/server.yaml"]
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d:ro
    command:
      - "postgres"
      - "-c"
      - "wal_level=logical"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  drasi-data:
  postgres-data:
```

### Configuration File (config/server.yaml)

```yaml
host: 0.0.0.0
port: 8080
log_level: info

state_store:
  kind: redb
  path: /data/state.redb

sources:
  - kind: postgres
    id: app-db
    host: ${DB_HOST}
    port: 5432
    database: myapp
    user: postgres
    password: ${DB_PASSWORD}
    ssl: false
    tables:
      - public.orders
      - public.customers

queries:
  - id: new-orders
    query: |
      MATCH (o:orders)
      WHERE o.status = 'pending'
      RETURN o.id, o.customer_id, o.total, o.created_at
    sources:
      - source_id: app-db

reactions:
  - kind: log
    id: order-log
    queries: [new-orders]
```

### Database Initialization Script (init-scripts/01-init.sql)

```sql
-- Enable logical replication
ALTER SYSTEM SET wal_level = 'logical';

-- Create tables
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- Create publication for Drasi
CREATE PUBLICATION drasi_publication FOR TABLE orders, customers;
```

## Production Configuration

A production-ready setup with resource limits and security:

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./config:/config:ro
      - drasi-data:/data
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    command: ["--config", "/config/server.yaml"]
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: production
    secrets:
      - db_password
    command:
      - "postgres"
      - "-c"
      - "wal_level=logical"
      - "-c"
      - "max_replication_slots=10"
      - "-c"
      - "max_wal_senders=10"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

volumes:
  drasi-data:
  postgres-data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## Multi-Instance Configuration

Run multiple Drasi Server instances for different workloads:

```yaml
version: '3.8'

services:
  drasi-analytics:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./config/analytics.yaml:/config/server.yaml:ro
      - analytics-data:/data
    restart: unless-stopped

  drasi-alerts:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8081:8080"
    volumes:
      - ./config/alerts.yaml:/config/server.yaml:ro
      - alerts-data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: password
    command: ["postgres", "-c", "wal_level=logical"]
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  analytics-data:
  alerts-data:
  postgres-data:
```

## With Redis (for Platform Source/Reaction)

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - ./config:/config:ro
      - drasi-data:/data
    environment:
      - REDIS_URL=redis://redis:6379
    command: ["--config", "/config/server.yaml"]
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  drasi-data:
  redis-data:
```

## With SSE Reaction

When using SSE reactions, expose the SSE port:

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"   # REST API
      - "8081:8081"   # SSE endpoint
    volumes:
      - ./config:/config:ro
    command: ["--config", "/config/server.yaml"]
    restart: unless-stopped
```

Configuration with SSE reaction:

```yaml
reactions:
  - kind: sse
    id: events-stream
    host: 0.0.0.0
    port: 8081
    sse_path: /events
    queries: [my-query]
```

## Environment File

Use a `.env` file for environment variables:

### .env

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secretpassword

# Drasi
LOG_LEVEL=info
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  drasi-server:
    image: ghcr.io/drasi-project/drasi-server:latest
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - ./config:/config:ro
    command: ["--config", "/config/server.yaml"]
```

## Common Commands

### Start Services

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d drasi-server

# Start with build
docker compose up -d --build
```

### View Logs

```bash
# All services
docker compose logs

# Follow logs
docker compose logs -f

# Specific service
docker compose logs -f drasi-server
```

### Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart drasi-server
```

### Update Images

```bash
# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d --pull always
```

### View Status

```bash
docker compose ps
```

## Troubleshooting

### Services Won't Start

Check service logs:

```bash
docker compose logs drasi-server
```

### Database Connection Issues

1. Ensure PostgreSQL is healthy:
   ```bash
   docker compose exec postgres pg_isready
   ```

2. Check network connectivity:
   ```bash
   docker compose exec drasi-server ping postgres
   ```

3. Verify WAL level:
   ```bash
   docker compose exec postgres psql -U postgres -c "SHOW wal_level;"
   ```

### Configuration Errors

Validate your configuration before starting:

```bash
docker compose run --rm drasi-server validate --config /config/server.yaml
```

### Reset Everything

```bash
docker compose down -v
docker compose up -d
```

## Next Steps

- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to your data sources
- [Configuration File Guide](/drasi-server/how-to-guides/installation/configuration-file/) - Learn configuration options
