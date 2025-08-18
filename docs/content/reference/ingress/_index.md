---
type: "docs"
title: "Ingress"
linkTitle: "Ingress"
weight: 60
description: >
    Deploy and manage Kubernetes ingress resources for your Drasi resources.
---

Drasi allows you to deploy and manage Kubernetes ingress resources for your applications easily in your Drasi YAML file, without using `kubectl`. You can use the Drasi CLI to install [Contour](https://projectcontour.io/) as your ingress controller, or use an existing ingress controller that is already deployed in your Kubernetes cluster.

Currently, Drasi only support deploying ingress resources for Drasi Sources and Reactions.


### Ingress Initialization

You can initialize ingress in your Drasi environment using the CLI.

{{< read file= "/shared-content/ingress/ingress-init.md" >}}

For more information on the `drasi ingress` command, refer to the [Drasi CLI documentation](/reference/command-line-interface/#drasi-ingress).


### Ingress Configuration
You can configure ingress deployment for your Source or Reaction by setting the `gateway` field in your YAML file. To expose an endpoint externally, set the `setting` field to external and specify a port number in the `target` field. This target port will be used for the Kubernetes Service that gets provisioned alongside the Ingress resource.

Below is a sample YAML file for a Debug Reaction. In this example, we are configuring an endpoint called `ingress` to be an external endpoint:
```yaml
apiVersion: v1
kind: Reaction
name: hello-world
spec:
  kind: Debug
  queries:
    query1
  services:
    reaction:
      endpoints:
        ingress:
          setting: external
          target: "8080"
```

When applied using `drasi apply`, the CLI will output a URL for the Ingress resource:
```bash
drasi apply -f reaction.yaml
✓ Apply: Reaction/hello-world: complete
ℹ Ingress URL: http://hello-world.drasi.20.3.25.74.nip.io
```

The URL follows the pattern `http://{name}.drasi.{loadbalancer-ip}.nip.io`, where:

- `{name}` is the name of the Ingress resource
- `{loadbalancer-ip}` is the load balancer IP address of the Ingress controller service
