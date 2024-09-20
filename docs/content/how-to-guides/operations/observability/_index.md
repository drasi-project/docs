
---
type: "docs"
title: "Configure Observability"
linkTitle: "Configure Observability"
weight: 50
description: >
    Configuring platform observability
---


## Setup metrics

Custom metrics are collected by [Prometheus](https://prometheus.io/), to enable this, install Prometheus into your Kubernetes cluster.  By default, the operator will configure Prometheus to scrape metrics from the OpenTelemtry collector.
To publish custom metrics, use the [Prometheus client library](https://prometheus.io/docs/instrumenting/clientlibs/), and push them to `http://otel-collector:4317`

- Javascript - https://github.com/siimon/prom-client
- C# - https://github.com/prometheus-net/prometheus-net

### Install Prometheus

```
kubectl create namespace dapr-monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install dapr-prom prometheus-community/prometheus -n dapr-monitoring
```

To explore the metrics, forward a port to the Prometheus server to your local machine.

```
kubectl port-forward services/dapr-prom-prometheus-server 82:80 -n dapr-monitoring
```

In your browser, go to http://localhost:82 and you will see the Prometheus UI.

## Setup tracing

Traces are sent by the Dapr sidecar to Zipkin.  To enable this, install Zipkin in your Kuberenetes cluster.

### Install Zipkin

```
kubectl create deployment zipkin --image openzipkin/zipkin
kubectl expose deployment zipkin --type ClusterIP --port 9411
```

To explore the traces, forward a port to the Zipkin server to your local machine.

```
kubectl port-forward svc/zipkin 9411:9411
```

In your browser, go to http://localhost:9411 and you will see the Zipkin UI.
