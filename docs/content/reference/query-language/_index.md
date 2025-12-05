---
type: "docs"
title: "Continuous Query Syntax"
linkTitle: "Continuous Query Syntax"
weight: 20
description: >
    Writing Continuous Queries
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/getting-started/"
    - title: "Writing Single-Source Queries"
      url: "/tutorials/write-single-source-continuous-queries/"
  concepts:
    - title: "Continuous Queries"
      url: "/concepts/continuous-queries/"
  howto:
    - title: "Write Continuous Queries"
      url: "/how-to-guides/write-continuous-queries/"
  reference:
    - title: "Drasi Custom Functions"
      url: "/reference/query-language/drasi-custom-functions/"
---

Continuous Queries are written using a subset of the [Cypher Query Language](https://s3.amazonaws.com/artifacts.opencypher.org/openCypher9.pdf) or [Graph Query Language (GQL)](https://www.iso.org/standard/76120.html). These query languages allow you to describe patterns in graph data and specify transformations to detect changes of interest.

## Query Language Documentation

- **[Cypher Query Language](cypher/)** - openCypher subset supported by Drasi
- **[Graph Query Language (GQL)](gql/)** - GQL subset supported by Drasi  
- **[Drasi Custom Functions](drasi-custom-functions/)** - Extended functions for continuous query processing

## Learning Resources

If you are new to Cypher, Neo4j provides excellent resources:
  - [Getting Started](https://neo4j.com/docs/getting-started/cypher-intro/)
  - [Cheat Sheet](https://neo4j.com/docs/cypher-cheat-sheet/current/)

Both query languages work with graph patterns using ASCII-art syntax where round brackets represent nodes and arrows represent relationships. The key difference is that Drasi evaluates these queries continuously against streaming data changes rather than executing them once against static data.

