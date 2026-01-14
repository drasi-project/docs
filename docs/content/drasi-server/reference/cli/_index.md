---
type: "docs"
title: "CLI Reference"
linkTitle: "CLI"
weight: 20
description: "Command-line interface reference for Drasi Server"
related:
  howto:
    - title: "Configure Drasi Server"
      url: "/drasi-server/how-to-guides/configuration/configure-drasi-server/"
    - title: "Build from Source"
      url: "/drasi-server/how-to-guides/installation/build-from-source/"
  reference:
    - title: "Configuration Reference"
      url: "/drasi-server/reference/configuration/"
    - title: "REST API Reference"
      url: "/drasi-server/reference/rest-api/"
---

# CLI Reference

{{< term "Drasi Server" >}} command-line interface reference.

## Synopsis

```
drasi-server [OPTIONS] [COMMAND]
```

## Global Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--config <PATH>` | `-c` | `config/server.yaml` | Path to configuration file |
| `--port <PORT>` | `-p` | (from config) | Override server port |
| `--help` | `-h` | | Print help information |
| `--version` | `-V` | | Print version information |

## Commands

### run

Run the server. This is the default command when no subcommand is specified.

```bash
drasi-server run --config config/server.yaml
```

These are equivalent:
```bash
drasi-server --config config/server.yaml
drasi-server run --config config/server.yaml
```

**Options:**

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--config <PATH>` | `-c` | `config/server.yaml` | Path to configuration file |
| `--port <PORT>` | `-p` | (from config) | Override server port |

**Examples:**

```bash
# Basic usage
drasi-server --config config/server.yaml

# Override port
drasi-server --config config/server.yaml --port 9090

# Using environment variables
DB_PASSWORD=secret drasi-server --config config/server.yaml
```

### init

Create a new configuration file interactively.

```bash
drasi-server init --output config/server.yaml
```

**Options:**

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--output <PATH>` | `-o` | `config/server.yaml` | Output path for configuration |
| `--force` | | | Overwrite existing configuration file |

**Examples:**

```bash
# Create new config
drasi-server init --output config/my-config.yaml

# Overwrite existing config
drasi-server init --output config/server.yaml --force
```

### validate

Validate a configuration file without starting the server.

```bash
drasi-server validate --config config/server.yaml
```

**Options:**

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--config <PATH>` | `-c` | `config/server.yaml` | Path to configuration file |
| `--show-resolved` | | | Display config with environment variables expanded |

**Examples:**

```bash
# Basic validation
drasi-server validate --config config/server.yaml

# Show resolved values
drasi-server validate --config config/server.yaml --show-resolved
```

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | Configuration is valid |
| 1 | Configuration is invalid |

**Use in CI/CD:**

```bash
drasi-server validate --config config/server.yaml || exit 1
```

### doctor

Check system dependencies and requirements.

```bash
drasi-server doctor
```

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `--all` | | Include optional dependencies |

**Checked Dependencies:**

| Dependency | Required | Description |
|------------|----------|-------------|
| Rust | Yes | Rust toolchain |
| Git | Yes | Git version control |
| Submodules | Yes | Git submodules initialized |
| Docker | No | Container runtime |
| Docker Compose | No | Multi-container orchestration |
| curl | No | HTTP client |
| psql | No | PostgreSQL client |

**Examples:**

```bash
# Check required dependencies
drasi-server doctor

# Check all dependencies
drasi-server doctor --all
```

**Sample Output:**

```
Checking system dependencies...

Required:
  ✓ Rust 1.75.0
  ✓ Git 2.39.0
  ✓ Submodules initialized

Optional (--all):
  ✓ Docker 24.0.5
  ✓ Docker Compose v2.20.2
  ✓ curl 8.1.2
  ✗ psql (not found)

Status: OK (1 optional dependency missing)
```

## Environment Variables

### RUST_LOG

Control log verbosity:

```bash
# Debug logging
RUST_LOG=debug drasi-server --config config/server.yaml

# Specific component
RUST_LOG=drasi_server=trace drasi-server --config config/server.yaml

# Multiple levels
RUST_LOG=warn,drasi_server=debug drasi-server --config config/server.yaml
```

### Configuration Variables

Any configuration value can reference environment variables:

```bash
# Set database credentials
DB_HOST=localhost DB_PASSWORD=secret drasi-server --config config/server.yaml
```

### .env Files

Drasi Server loads `.env` files from the current directory:

```bash
# .env file
DB_HOST=localhost
DB_PASSWORD=secret
LOG_LEVEL=info
```

## Examples

### Development

```bash
# Build and run
cargo build --release
./target/release/drasi-server --config config/server.yaml

# With debug logging
RUST_LOG=debug ./target/release/drasi-server --config config/server.yaml
```

### Production

```bash
# Validate before starting
drasi-server validate --config /etc/drasi/server.yaml

# Run with specific port
drasi-server --config /etc/drasi/server.yaml --port 8080
```

### Docker

```bash
# Run with config file
docker run -d \
  --name drasi-server \
  -p 8080:8080 \
  -v $(pwd)/config:/config:ro \
  ghcr.io/drasi-project/drasi-server:latest \
  --config /config/server.yaml
```

### CI/CD Pipeline

```bash
#!/bin/bash
set -e

# Validate configuration
drasi-server validate --config config/server.yaml --show-resolved

# Check dependencies
drasi-server doctor

# Start server (in background for testing)
drasi-server --config config/server.yaml &
sleep 5

# Health check
curl -f http://localhost:8080/health || exit 1

# Run tests
# ...
```
