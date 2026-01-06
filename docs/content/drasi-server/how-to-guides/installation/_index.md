---
type: "docs"
title: "Installation"
linkTitle: "Installation"
weight: 10
description: "Deploy Drasi Server with Docker or as a standalone process"
---

# Installing Drasi Server

{{< alert title="Coming Soon" color="info" >}}
This documentation is under development. Check back soon for complete installation instructions.
{{< /alert >}}

## Overview

Drasi Server can be deployed in several ways:

- **Docker container** - Recommended for most use cases
- **Docker Compose** - For multi-container setups
- **Standalone process** - For direct OS deployment

## Docker Installation

### Pull the Image

```bash
docker pull drasi/drasi-server:latest
```

### Run the Container

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -v drasi-data:/data \
  drasi/drasi-server:latest
```

## Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  drasi-server:
    image: drasi/drasi-server:latest
    ports:
      - "8080:8080"
    volumes:
      - drasi-data:/data

volumes:
  drasi-data:
```

Run with:

```bash
docker-compose up -d
```

## Configuration

<!-- TODO: Document configuration options -->

## Next Steps

- [Getting Started](/drasi-server/getting-started/) - Run your first continuous query
- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to data
