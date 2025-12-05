---
type: "docs"
title: "Reference"
linkTitle: "Reference"
weight: 50
description: >
    Detailed specifications, API documentation, and technical reference material
---

<div class="section-header section-header--reference">
  <p class="section-intro">Reference documentation provides detailed, accurate information about Drasi's APIs, configuration options, and technical specifications. Use it to look up specific details when you need them.</p>
</div>

## How to Use Reference Docs

Reference documentation is designed for **lookup**, not reading cover-to-cover:

- **Comprehensive**: All options and parameters documented
- **Accurate**: Reflects actual system behavior
- **Structured**: Easy to find specific information
- **Technical**: Assumes familiarity with concepts

## Command Line Interface

<div class="card-grid">
  <a href="/reference/command-line-interface/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-terminal"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">CLI Reference</h3>
        <p class="unified-card-summary">Complete reference for the drasi command-line interface including all commands and options.</p>
      </div>
    </div>
  </a>
</div>

## Query Language

<div class="card-grid">
  <a href="/reference/query-language/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-code"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Query Language</h3>
        <p class="unified-card-summary">Cypher, GQL, and Drasi-specific functions for writing continuous queries.</p>
      </div>
    </div>
  </a>
</div>

## APIs and Configuration

<div class="card-grid">
  <a href="/reference/management-api/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-cog"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Management API</h3>
        <p class="unified-card-summary">REST API for managing Drasi resources programmatically.</p>
      </div>
    </div>
  </a>
  <a href="/reference/schema/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-file-code"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Resource Schemas</h3>
        <p class="unified-card-summary">YAML schema definitions for Sources, Queries, and Reactions.</p>
      </div>
    </div>
  </a>
  <a href="/reference/ingress/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-network-wired"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Ingress Configuration</h3>
        <p class="unified-card-summary">Configure network access to Drasi components.</p>
      </div>
    </div>
  </a>
</div>

## Developer Tools

<div class="card-grid">
  <a href="/reference/developer-tools/vscode-extension/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-puzzle-piece"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">VS Code Extension</h3>
        <p class="unified-card-summary">Visual Studio Code extension for Drasi development.</p>
      </div>
    </div>
  </a>
</div>

## Troubleshooting and Data

<div class="card-grid">
  <a href="/reference/troubleshooting/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Troubleshooting</h3>
        <p class="unified-card-summary">Known issues and their solutions.</p>
      </div>
    </div>
  </a>
  <a href="/reference/sample-data/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-database"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Sample Data</h3>
        <p class="unified-card-summary">Sample datasets for testing and experimentation.</p>
      </div>
    </div>
  </a>
  <a href="/reference/glossary/">
    <div class="unified-card unified-card--reference">
      <div class="unified-card-icon">
        <i class="fas fa-book"></i>
      </div>
      <div class="unified-card-content">
        <h3 class="unified-card-title">Glossary</h3>
        <p class="unified-card-summary">Definitions of key Drasi terms and concepts.</p>
      </div>
    </div>
  </a>
</div>

## Quick Lookup

### CLI Commands

| Command | Description |
|---------|-------------|
| `drasi init` | Initialize Drasi in a cluster |
| `drasi apply` | Apply resource configuration |
| `drasi delete` | Delete resources |
| `drasi list` | List resources |
| `drasi describe` | Show resource details |
| `drasi logs` | View component logs |

### Query Functions

| Function | Description |
|----------|-------------|
| `drasi.changeDateTime()` | Timestamp of the change |
| `drasi.trueDuring()` | Temporal condition evaluation |
| `drasi.linearInterpolate()` | Interpolate between values |

### Resource Types

| Type | Description |
|------|-------------|
| `Source` | Database connection |
| `ContinuousQuery` | Query definition |
| `Reaction` | Action handler |
| `QueryContainer` | Query execution environment |

## Related Resources

- **[Concepts](/concepts/)** - Understand the theory behind these specifications
- **[How-to Guides](/how-to-guides/)** - Apply this reference in practice
- **[Patterns](/patterns/)** - Best practices for using these capabilities
