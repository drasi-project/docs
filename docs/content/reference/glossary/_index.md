---
type: "docs"
title: "Glossary"
linkTitle: "Glossary"
weight: 100
notoc: true
description: >
    Definitions of key Drasi terms and concepts
---

Throughout the documentation, you'll see terms with a <span class="glossary-term-example">dotted underline</span>. Hover over these terms to see a quick definition, or click to navigate to the full glossary entry.

Press **G** on any  page to open a quick glossary lookup.

| Keyboard Shortcut | Action |
|-------------------|--------|
| **G** | Open glossary modal |
| **Escape** | Close glossary modal |
| **/** | Focus search (when modal is open) |


<div class="glossary-controls">
  <div class="glossary-search">
    <i class="fas fa-search"></i>
    <input type="text" id="glossary-search" placeholder="Search terms..." aria-label="Search glossary terms">
  </div>
  <div class="glossary-filters">
    <button class="glossary-filter active" data-category="all">All</button>
    <button class="glossary-filter" data-category="core">Core Concepts</button>
    <button class="glossary-filter" data-category="query">Query Language</button>
    <button class="glossary-filter" data-category="data">Data & Changes</button>
    <button class="glossary-filter" data-category="infrastructure">Infrastructure</button>
  </div>
</div>

<div class="glossary-list" id="glossary-list">
{{< glossary-terms >}}
</div>

<div class="glossary-empty" id="glossary-empty" style="display: none;">
  <i class="fas fa-search"></i>
  <p>No terms match your search.</p>
</div>

<style>
.glossary-term-example {
  border-bottom: 1px dotted var(--color-reference, #9f7aea);
  cursor: help;
}
</style>
