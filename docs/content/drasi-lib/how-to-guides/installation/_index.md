---
type: "docs"
title: "Installation"
linkTitle: "Installation"
weight: 10
description: "Add drasi-lib to your Rust project"
---

# Installing drasi-lib

{{< alert title="Coming Soon" color="info" >}}
This documentation is under development. Check back soon for complete installation instructions.
{{< /alert >}}

## Overview

drasi-lib is distributed as a Rust crate via crates.io.

## Requirements

- Rust 1.70 or later
- Cargo package manager

## Installation via Cargo

Add drasi-lib to your `Cargo.toml`:

```toml
[dependencies]
drasi-lib = "0.1"
```

Or use cargo add:

```bash
cargo add drasi-lib
```

## Feature Flags

drasi-lib supports optional feature flags:

```toml
[dependencies]
drasi-lib = { version = "0.1", features = ["..."] }
```

<!-- TODO: Document available feature flags -->

## Verification

Verify the installation by building your project:

```bash
cargo build
```

## Next Steps

- [Getting Started](/drasi-lib/getting-started/) - Run your first continuous query
- [Configure Sources](/drasi-lib/how-to-guides/configure-sources/) - Connect to data
