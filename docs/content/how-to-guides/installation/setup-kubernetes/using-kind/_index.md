---
type: "docs"
title: "Using Kind"
linkTitle: "Using Kind"
weight: 20
description: >
    Hosting Drasi on a Kind Cluster
---

Install `Kind` using the instructions at https://kind.sigs.k8s.io/

Create the `Kind` instance using this command.

```bash
kind create cluster
```

Delete the `Kind` instance using this command.

```bash
kind delete cluster
```

NOTE: If you are running Drasi on a `Kind` instance using Drasi images built from source, you must make sure to load the Drasi images onto the `Kind` cluster by running the `load-images-to-kind.sh` script from the `/devops/build` folder. The source-based deployment is fully described in [Deploying Drasi from Source](/administrator/platform-deployment/from-source)