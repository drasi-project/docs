---
type: "docs"
title: "Using MiniKube"
linkTitle: "Using MiniKube"
weight: 20
description: >
    Hosting Drasi on Minikube
---

Install Minikube using the instructions at:

> https://k8s-docs.netlify.app/en/docs/tasks/tools/install-minikube/

Start the Minikube instance:

```bash
minikube start --cpus 4 --disk-size 50g --memory 6g
```

Starting minikube will also automatically set the kubectl context to minikube.

Feel free to tune the parameters for the instance appropriate for your device, but you will want at least a 50GB allocated as the default ~20GB will run into space limitations for a default deployment.

After the minikube instance is started, redirect your `DOCKER_HOST` environment to minikube's:

```bash
eval $(minikube docker-env)
```

This will set the `DOCKER_HOST`, `DOCKER_TLS_VERIFY`, `DOCKER_CERT_PATH` and `MINIKUBE_ACTIVE_DOCKERD` environment variables to point to minikube's docker daemon.  This causes container builds to build into the minikube docker host in the following steps.  

To revert, clear those environment variables or start a new shell instance without them set.
