---
type: "docs"
title: "Continuous Query Syntax"
linkTitle: "Continuous Query Syntax"
weight: 20
description: >
    Writing Continuous Queries
related:
  tutorials:
    - title: "Getting Started (Kubernetes)"
      url: "/drasi-kubernetes/getting-started/"
    - title: "Getting Started (Server)"
      url: "/drasi-server/getting-started/"
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  howto:
    - title: "Write Continuous Queries"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
  reference:
    - title: "Drasi Custom Functions"
      url: "/reference/query-language/drasi-custom-functions/"
---

{{< term "Continuous Query" "Continuous Queries" >}} are written using a subset of the {{< term "openCypher" "Cypher Query Language" >}} or {{< term "GQL" "Graph Query Language" >}} (GQL). These query languages allow you to describe patterns in graph data and specify transformations to detect changes of interest.

## Query Language Documentation

- **[Cypher Query Language](cypher/)** - openCypher subset supported by Drasi
- **[Graph Query Language (GQL)](gql/)** - GQL subset supported by Drasi
- **[Drasi Custom Functions](drasi-custom-functions/)** - Extended functions for continuous query processing

## Learning Resources

If you are new to Cypher, Neo4j provides excellent resources:
  - [Getting Started](https://neo4j.com/docs/getting-started/cypher-intro/)
  - [Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/current/)

Both query languages work with graph patterns using ASCII-art syntax where round brackets represent {{< term "Node" "nodes" >}} and arrows represent {{< term "Relationship" "relationships" >}}. The key difference is that Drasi evaluates these queries continuously against streaming data changes rather than executing them once against static data.

