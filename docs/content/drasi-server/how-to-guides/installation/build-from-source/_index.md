---
type: "docs"
title: "Build from Source"
linkTitle: "Build from Source"
weight: 30
description: "Compile Drasi Server from source code"
---

Building Drasi Server from source gives you full control over the build process and allows you to contribute to the project or create custom builds.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) 1.70 or later
- Git with submodule support
- C compiler (for native dependencies)

### Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

Verify installation:

```bash
rustc --version
cargo --version
```

## Clone the Repository

Clone with all submodules:

```bash
git clone --recurse-submodules https://github.com/drasi-project/drasi-server.git
cd drasi-server
```

{{< alert title="Important" color="warning" >}}
The `--recurse-submodules` flag is required. Drasi Server depends on the DrasiLib library which is included as a Git submodule.
{{< /alert >}}

If you already cloned without submodules, initialize them:

```bash
git submodule update --init --recursive
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

### Build with Specific Features

```bash
# Build with all features
cargo build --release --all-features

# Build with specific features
cargo build --release --features "feature-name"
```

## Run the Server

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

## Configuration

### Create Configuration Interactively

Use the `init` command to create a configuration file:

```bash
cargo run --release -- init --output config/server.yaml
```

### Validate Configuration

Check your configuration without starting the server:

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

## Development Workflow

### Run Tests

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name
```

### Format Code

```bash
cargo fmt
```

### Lint Code

```bash
cargo clippy
```

### Watch for Changes

Install cargo-watch for automatic rebuilds:

```bash
cargo install cargo-watch

# Rebuild on changes
cargo watch -x build

# Run tests on changes
cargo watch -x test
```

## Cross-Compilation

### For Linux (from macOS/Windows)

```bash
# Add target
rustup target add x86_64-unknown-linux-gnu

# Build
cargo build --release --target x86_64-unknown-linux-gnu
```

### For macOS (from Linux)

```bash
rustup target add x86_64-apple-darwin
cargo build --release --target x86_64-apple-darwin
```

### For Windows (from Linux/macOS)

```bash
rustup target add x86_64-pc-windows-gnu
cargo build --release --target x86_64-pc-windows-gnu
```

## Build Troubleshooting

### Submodule Errors

If you see errors about missing files in the `lib` directory:

```bash
git submodule update --init --recursive
```

### OpenSSL Errors

On Linux, install OpenSSL development packages:

```bash
# Ubuntu/Debian
sudo apt-get install libssl-dev pkg-config

# Fedora/RHEL
sudo dnf install openssl-devel

# Alpine
apk add openssl-dev
```

### Compilation Errors

Ensure you have the latest Rust toolchain:

```bash
rustup update
```

### Out of Memory During Build

Limit parallel compilation:

```bash
CARGO_BUILD_JOBS=2 cargo build --release
```

### Slow Builds

Use the mold linker for faster linking (Linux):

```bash
# Install mold
sudo apt-get install mold

# Configure Cargo to use mold
# Add to ~/.cargo/config.toml:
[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=mold"]
```

## Project Structure

```
drasi-server/
├── src/
│   ├── main.rs           # Entry point and CLI
│   ├── api/              # REST API implementation
│   │   ├── models/       # API data models
│   │   └── v1/           # API v1 routes and handlers
│   ├── config/           # Configuration loading
│   └── factories.rs      # Component factories
├── lib/                  # DrasiLib submodule
├── config/               # Example configurations
├── Cargo.toml            # Dependencies
└── README.md
```

## Creating a Release

### Build Release Binary

```bash
cargo build --release
```

### Strip Debug Symbols (Linux/macOS)

Reduce binary size:

```bash
strip target/release/drasi-server
```

### Package for Distribution

```bash
# Create tarball
tar -czvf drasi-server-linux-x64.tar.gz -C target/release drasi-server

# Or zip
zip drasi-server-linux-x64.zip target/release/drasi-server
```

## Contributing

When contributing to Drasi Server:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `cargo test`
5. Format code: `cargo fmt`
6. Check lints: `cargo clippy`
7. Submit a pull request

## Next Steps

- [Configuration File Guide](/drasi-server/how-to-guides/installation/configuration-file/) - Learn configuration options
- [Configure Sources](/drasi-server/how-to-guides/configure-sources/) - Connect to data sources
