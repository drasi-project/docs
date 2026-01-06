---
type: "docs"
title: "Getting Started with Drasi Server"
linkTitle: "Getting Started"
weight: 10
description: "Run Drasi Server with Docker in minutes"
---

# Getting Started with Drasi Server

{{< alert title="Coming Soon" color="info" >}}
This documentation is under development. Check back soon for complete instructions on getting started with Drasi Server.
{{< /alert >}}

## Overview

Drasi Server is a standalone deployment that runs as a single process or Docker container. This guide will walk you through running Drasi Server and connecting your first data source.

## Prerequisites

- Docker 20.10 or later (for container deployment)
- Or: A compatible operating system for process deployment

## Quick Start with Docker

```bash
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  drasi/drasi-server:latest
```

## Verify Installation

Check that Drasi Server is running:

```bash
curl http://localhost:8080/health
```

## Next Steps

- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to your data
- [Write Queries](/reference/query-language/) - Learn the query language
- [Explore Concepts](/concepts/) - Understand how Drasi works
