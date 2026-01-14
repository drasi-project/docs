---
type: "docs"
title: "Install with Docker"
linkTitle: "Docker"
weight: 20
description: "Run Drasi Server as a Docker container"
---

This guide covers deploying Drasi Server as a standalone Docker container.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10 or later

Verify Docker is installed:

```bash
docker --version
```

## Basic Installation

### Pull the Image

```bash
docker pull ghcr.io/drasi-project/drasi-server:latest
```

### Run the Container

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  ghcr.io/drasi-project/drasi-server:latest
```

### Verify Installation

```bash
curl http://localhost:8080/health
```

Expected response:

```json
{"status":"healthy"}
```

## Configuration Options

### Using a Custom Configuration File

Mount your configuration file into the container:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -v $(pwd)/config/server.yaml:/config/server.yaml:ro \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/server.yaml
```

### Using Environment Variables

Drasi Server configuration supports environment variable interpolation. Pass environment variables to the container:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -e DB_HOST=postgres.example.com \
  -e DB_PASSWORD=secret \
  -v $(pwd)/config:/config:ro \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/server.yaml
```

Your configuration file can reference these variables:

```yaml
sources:
  - kind: postgres
    id: my-db
    host: ${DB_HOST}
    password: ${DB_PASSWORD}
```

### Persistent Data Storage

For state persistence across container restarts, mount a volume for the data directory:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -v drasi-data:/data \
  -v $(pwd)/config:/config:ro \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/server.yaml
```

Configure the state store in your configuration:

```yaml
state_store:
  kind: redb
  path: /data/state.redb
```

## Port Mapping

### Default Port

The default REST API port is 8080:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  ghcr.io/drasi-project/drasi-server:latest
```

### Custom Port

To use a different host port:

```bash
docker run -d \
  --name drasi-server \
  -p 9090:8080 \
  ghcr.io/drasi-project/drasi-server:latest
```

### Multiple Ports

If using SSE or HTTP source reactions, map those ports as well:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -p 8081:8081 \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/server.yaml
```

## Network Configuration

### Connect to Host Network

To connect to services running on the host machine:

```bash
docker run -d \
  --name drasi-server \
  --network host \
  ghcr.io/drasi-project/drasi-server:latest
```

### Connect to Docker Network

To connect to other containers:

```bash
# Create a network
docker network create drasi-network

# Run PostgreSQL
docker run -d \
  --name postgres \
  --network drasi-network \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

# Run Drasi Server
docker run -d \
  --name drasi-server \
  --network drasi-network \
  -p 8080:8080 \
  ghcr.io/drasi-project/drasi-server:latest
```

In your configuration, reference containers by their Docker name:

```yaml
sources:
  - kind: postgres
    id: my-db
    host: postgres  # Docker container name
    port: 5432
    database: mydb
    user: postgres
    password: secret
```

## Health Checks

Add a health check to the container:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  --health-cmd="curl -f http://localhost:8080/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  ghcr.io/drasi-project/drasi-server:latest
```

## Resource Limits

Set memory and CPU limits:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  --memory=2g \
  --cpus=2 \
  ghcr.io/drasi-project/drasi-server:latest
```

## Logging

### View Logs

```bash
docker logs drasi-server
```

### Follow Logs

```bash
docker logs -f drasi-server
```

### Change Log Level

Set the log level in your configuration or via environment variable:

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -e RUST_LOG=debug \
  ghcr.io/drasi-project/drasi-server:latest
```

Or in the configuration file:

```yaml
log_level: debug  # trace, debug, info, warn, error
```

## Container Management

### Stop the Container

```bash
docker stop drasi-server
```

### Start the Container

```bash
docker start drasi-server
```

### Remove the Container

```bash
docker rm drasi-server
```

### Restart the Container

```bash
docker restart drasi-server
```

## Updating

### Pull Latest Image

```bash
docker pull ghcr.io/drasi-project/drasi-server:latest
```

### Replace Running Container

```bash
docker stop drasi-server
docker rm drasi-server
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -v drasi-data:/data \
  -v $(pwd)/config:/config:ro \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/server.yaml
```

## Complete Example

Here's a production-ready Docker run command:

```bash
docker run -d \
  --name drasi-server \
  --restart unless-stopped \
  -p 8080:8080 \
  -v drasi-data:/data \
  -v $(pwd)/config:/config:ro \
  -e DB_PASSWORD="${DB_PASSWORD}" \
  --memory=2g \
  --cpus=2 \
  --health-cmd="curl -f http://localhost:8080/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/server.yaml
```

## Troubleshooting

### Container Won't Start

Check the logs:

```bash
docker logs drasi-server
```

Common issues:
- Port already in use: Change the host port mapping
- Configuration file not found: Check volume mount paths
- Invalid configuration: Run `drasi-server validate` first

### Cannot Connect to Database

If connecting to a database on the host:

```bash
# Use host.docker.internal on Mac/Windows
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  ghcr.io/drasi-project/drasi-server:latest
```

Then use `host.docker.internal` as the database host in your configuration.

### Permission Denied on Volume Mounts

Ensure the mounted directories have appropriate permissions:

```bash
chmod 755 $(pwd)/config
chmod 644 $(pwd)/config/server.yaml
```

## Next Steps

- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to your data
- [Docker Compose Installation](/drasi-server/how-to-guides/installation/install-with-docker-compose/) - Multi-container setups
