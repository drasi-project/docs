---
type: "docs"
title: "Getting Started with drasi-lib"
linkTitle: "Getting Started"
weight: 10
description: "Add drasi-lib to your Rust project and run your first continuous query"
related:
  concepts:
    - title: "Why Drasi?"
      url: "/concepts/overview/"
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  reference:
    - title: "Query Language Reference"
      url: "/reference/query-language/"
  external:
    - title: "crates.io"
      url: "https://crates.io/crates/drasi-lib"
    - title: "docs.rs"
      url: "https://docs.rs/drasi-lib"
---

drasi-lib is a Rust crate that brings Drasi's change detection capabilities directly into your Rust applications. Add drasi-lib to your `Cargo.toml` to get started:

```toml
[dependencies]
drasi-lib = "0.1"
```

## Documentation Resources

For complete documentation, examples, and API reference, visit the official Rust documentation sites:

<div class="card-grid card-grid--2">
  <a href="https://crates.io/crates/drasi-lib" target="_blank" rel="noopener">
    <div class="unified-card unified-card--howto">
      <div class="unified-card-icon"><i class="fas fa-box"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">crates.io</h3>
        <p class="unified-card-summary">Package information, version history, dependencies, and installation instructions</p>
      </div>
    </div>
  </a>
  <a href="https://docs.rs/drasi-lib" target="_blank" rel="noopener">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon"><i class="fas fa-book"></i></div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">docs.rs</h3>
        <p class="unified-card-summary">Complete API documentation with examples, type definitions, and usage guides</p>
      </div>
    </div>
  </a>
</div>

## Learn More About Drasi

To understand the concepts behind drasi-lib and how continuous queries work, explore these resources:

- [Continuous Queries](/concepts/continuous-queries/) - Understand how Drasi detects and processes changes
- [Query Language Reference](/reference/query-language/) - Learn the Cypher-based query syntax
- [Drasi Overview](/concepts/overview/) - Get a high-level understanding of the Drasi platform
