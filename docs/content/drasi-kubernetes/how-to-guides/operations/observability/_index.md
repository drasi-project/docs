---
type: "docs"
title: "Configure Observability"
linkTitle: "Configure Observability"
weight: 50
description: >
    Configuring platform observability
related:
  howto:
    - title: "Install Drasi"
      url: "/drasi-kubernetes/how-to-guides/installation/"
    - title: "Monitoring"
      url: "/drasi-kubernetes/how-to-guides/operations/monitoring/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

The `--observability-level` flag in [drasi init](/reference/command-line-interface/#drasi-init) simplifies setting up various types of observability infrastructure in a Drasi environment. This page describes the different components that can be installed using this flag and explains how to use them.

## Observability Level: None
No observability infrastructure will be deployed if `--observability-level` is set to `none`. This is the default value for this flag.

You can deploy observability tools using `kubectl`. The Drasi system sends metrics and traces to `http://otel-collector:4317`, assuming the OpenTelemetry Collector pod is in the same Kubernetes namespace as Drasi and is exposed through a Kubernetes Service named `otel-collector`.

## Observability Level: Tracing

When `--observability-level` is set to `tracing`, [Grafana Tempo](https://github.com/organizations/drasi-project/settings/actions/runners), a [Grafana Dashboard](https://grafana.com/grafana/dashboards/) and the OpenTelemetry Collector are deployed to the namespace where you installed Drasi.

To explore the traces, forward a port to the Grafana dashboard to your local machine using the command: 

```bash
kubectl port-forward svc/grafana -n drasi-system 3000:3000
```

In your browser, navigate to `http://localhost:3000` to use the Grafana UI. To login to the dashboard, use `drasi` as both the username and the password.

Navigate to the `Explore` tab in the left sidebar and select `Tempo` in the main screen. You can now execute TraceQL queries against Tempo to retrieve the traces for Drasi. You can also utilize the `Search` tab to navigate and build your query.

## Observability Level: Metrics

When `--observability-level` is set to `metrics`, [Prometheus](https://prometheus.io/), a [Grafana Dashboard](https://grafana.com/grafana/dashboards/) and the OpenTelemetry Collector are deployed to the namespace where you installed Drasi.

To explore the metrics, forward a port to the Grafana dashboard to your local machine using the command: 

```bash
kubectl port-forward svc/grafana -n drasi-system 3000:3000
```

In your browser, navigate to `http://localhost:3000` to use the Grafana UI. To login to the dashboard, use `drasi` as both the username and the password.

Navigate to the `Explore` tab in the left sidebar and select `Prometheus` in the main screen. You can now execute queries against Prometheus using the query builder.

## Observability Level: Full

When `--observability-level` is set to `metrics`, [Grafana Tempo](https://github.com/organizations/drasi-project/settings/actions/runners), [Prometheus](https://prometheus.io/), a [Grafana Dashboard](https://grafana.com/grafana/dashboards/) and the OpenTelemetry Collector are deployed to the namespace where you installed Drasi. Refer to the sections above for details on using each component.
