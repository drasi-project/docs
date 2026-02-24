---
type: "docs"
title: "Build from Source"
linkTitle: "Build from Source"
weight: 40
description: "Compile Drasi Server from source code"
related:
  howto:
    - title: "Docker Installation"
      url: "/drasi-server/how-to-guides/installation/install-with-docker/"
    - title: "Configure Drasi Server"
      url: "/drasi-server/how-to-guides/configuration/configure-drasi-server/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-server/reference/cli/"
---

Building {{< term "Drasi Server" >}} from source gives you full control over the build process and allows you to contribute to the project or create custom builds.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) 1.88 or later
- Git
- C compiler (for native dependencies)

### Install Rust

Install Rust using [rustup](https://www.rust-lang.org/tools/install), the official Rust toolchain installer. Follow the instructions for your platform on the rustup website.

After installation, verify Rust is available:

```bash
rustc --version
cargo --version
```

### Native Dependencies

{{< read file="/shared-content/installation/drasi-server/build-from-source-prereqs.md" >}}

## Clone the Drasi Server Repository

```bash
git clone https://github.com/drasi-project/drasi-server.git
cd drasi-server
```

## Build Options

### Debug Build

For development and debugging (faster compile, slower runtime):

```bash
cargo build
```

The binary will be at `target/debug/drasi-server`.

### Release Build

For production use (optimized, faster runtime):

```bash
cargo build --release
```

The binary will be at `target/release/drasi-server`.

## Configuration

### Create Configuration File

Drasi Server requires a configuration file that defines your sources, queries, and reactions. 

Create a configuration yaml file for Drasi Server. See the [Configuration Reference](/drasi-server/reference/configuration/) for details on all available configuration options.

Alternatively, use the `init` command to create a starter configuration file:

```bash
cargo run --release -- init --output config/server.yaml
```

### Validate Configuration

Check your configuration file without starting the server:

```bash
cargo run --release -- validate --config config/server.yaml

# Show resolved environment variables
cargo run --release -- validate --config config/server.yaml --show-resolved
```

### Check System Dependencies

```bash
cargo run --release -- doctor

# Include optional dependencies
cargo run --release -- doctor --all
```

## Run Drasi Server

### Using Cargo

```bash
# Debug mode
cargo run -- --config config/server.yaml

# Release mode
cargo run --release -- --config config/server.yaml
```

### Using the Binary Directly

```bash
# After building
./target/release/drasi-server --config config/server.yaml
```