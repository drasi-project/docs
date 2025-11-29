---
type: "docs"
title: "Concepts"
linkTitle: "Concepts"
weight: 40
description: >
    Understand the architecture and ideas behind Drasi
---

<div class="section-header section-header--concepts">
  <p class="section-intro">Concepts help you understand how Drasi works. This section explains the architecture, design decisions, and mental models that will help you use Drasi effectively.</p>
</div>

## Why Read Concepts?

Unlike tutorials (which teach you to *do*) or reference docs (which tell you *what*), concepts explain *why* and *how*:

- **Build mental models** of how Drasi processes data changes
- **Understand trade-offs** behind different design choices
- **Make better decisions** when designing your solutions
- **Debug more effectively** by understanding system behavior

## Core Concepts

Start here to understand Drasi's fundamental architecture:

<div class="card-grid">
  <a href="/concepts/overview/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-sitemap"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Overview</h3>
        <p class="unified-card-summary">Understand how Sources, Continuous Queries, and Reactions work together.</p>
      </div>
    </div>
  </a>
  <a href="/concepts/sources/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-database"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Sources</h3>
        <p class="unified-card-summary">How Drasi connects to databases and captures changes.</p>
      </div>
    </div>
  </a>
  <a href="/concepts/continuous-queries/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-filter"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Continuous Queries</h3>
        <p class="unified-card-summary">What makes continuous queries different from traditional queries.</p>
      </div>
    </div>
  </a>
  <a href="/concepts/reactions/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-bolt"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Reactions</h3>
        <p class="unified-card-summary">How Drasi takes action when data changes.</p>
      </div>
    </div>
  </a>
</div>

## Architecture Deep Dives

Explore specific aspects of Drasi's architecture:

<div class="card-grid">
  <a href="/concepts/query-container/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-cube"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Query Container</h3>
        <p class="unified-card-summary">How query containers evaluate continuous queries efficiently.</p>
      </div>
    </div>
  </a>
  <a href="/concepts/middleware/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-layer-group"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Middleware</h3>
        <p class="unified-card-summary">The infrastructure components that support Drasi operations.</p>
      </div>
    </div>
  </a>
  <a href="/concepts/solution-design/">
    <div class="unified-card unified-card--concepts">
      <div class="unified-card-icon">
        <i class="fas fa-drafting-compass"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Solution Design</h3>
        <p class="unified-card-summary">Patterns and approaches for designing Drasi-based solutions.</p>
      </div>
    </div>
  </a>
</div>

## Recommended Reading Order

For newcomers to Drasi:

1. **[Overview](/concepts/overview/)** - Start here for the big picture
2. **[Sources](/concepts/sources/)** - Understand data ingestion
3. **[Continuous Queries](/concepts/continuous-queries/)** - Learn about query evaluation
4. **[Reactions](/concepts/reactions/)** - See how actions are triggered
5. **[Query Container](/concepts/query-container/)** - Dive deeper into internals

## Key Mental Models

### The Change Pipeline

```
Database Change → Source Capture → Query Evaluation → Reaction Trigger
```

Think of Drasi as a pipeline that transforms database changes into actions:

1. **Change Detection**: Sources monitor databases for changes
2. **Change Processing**: Queries evaluate changes against your criteria
3. **Action Execution**: Reactions take action when criteria are met

### Continuous vs. Traditional Queries

| Traditional Query | Continuous Query |
|-------------------|------------------|
| Runs once | Runs continuously |
| Returns point-in-time snapshot | Returns change stream |
| You poll for changes | Changes push to you |
| Result is static | Result updates automatically |

### The Three C's

- **Connect** (Sources) - Link to your data
- **Compute** (Queries) - Define what matters
- **Communicate** (Reactions) - Take action

## Related Resources

- **[Tutorials](/tutorials/)** - Apply these concepts hands-on
- **[How-to Guides](/how-to-guides/)** - Accomplish specific tasks
- **[Reference](/reference/)** - Detailed specifications
- **[Patterns](/patterns/)** - Best practices for common scenarios
