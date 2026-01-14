---
type: "docs"
title: "Ingress"
linkTitle: "Ingress"
weight: 60
description: >
    Deploy and manage Kubernetes ingress resources for your Drasi resources.
related:
  concepts:
    - title: "Sources"
      url: "/concepts/sources/"
    - title: "Reactions"
      url: "/concepts/reactions/"
  tutorials:
    - title: "Getting Started with Drasi for Kubernetes"
      url: "/drasi-kubernetes/getting-started/"
  howto:
    - title: "Install Drasi on AKS"
      url: "/drasi-kubernetes/how-to-guides/installation/install-on-aks/"
    - title: "Install Drasi on EKS"
      url: "/drasi-kubernetes/how-to-guides/installation/install-on-eks/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

Drasi allows you to deploy and manage Kubernetes ingress resources for your applications easily in your Drasi YAML file, without using `kubectl`. You can use the {{< term "Drasi CLI" >}} to install [Contour](https://projectcontour.io/) as your ingress controller, or use an existing ingress controller that is already deployed in your Kubernetes cluster.

Currently, Drasi only supports deploying ingress resources for Drasi {{< term "Source" "Sources" >}} and {{< term "Reaction" "Reactions" >}}.


### Ingress Initialization

You can initialize ingress in your Drasi environment using the CLI.

{{< read file= "/shared-content/ingress/ingress-init.md" >}}



### Ingress Configuration
You can configure ingress deployment for your Source or Reaction by setting the `gateway` field in your YAML file. To expose an endpoint externally, set the `setting` field to external and specify a port number in the `target` field. This target port will be used for the Kubernetes Service that gets provisioned alongside the Ingress resource.

Below is a sample YAML file for a Debug Reaction. In this example, we are configuring an endpoint called `gateway` to be an external endpoint:
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
        gateway:
          setting: external
          target: "8080"
```

After running `drasi apply`, you can view the Ingress URL by running the `drasi list` command. For example:

```bash
drasi apply -f reaction.yaml
✓ Apply: Reaction/hello-world: complete
drasi list reaction
         ID         | AVAILABLE |                    INGRESS URL                     | MESSAGES  
--------------------+-----------+----------------------------------------------------+-----------
  hello-world-debug | true      | http://hello-world-debug.drasi.x.xxx.xx.xxx.nip.io |         
```

The URL follows the pattern `http://{name}.drasi.{loadbalancer-ip}.nip.io`, where:

- `{name}` is the name of the Ingress resource
- `{loadbalancer-ip}` is the load balancer IP address of the Ingress controller service

If you are using AWS Load Balancer Controller for EKS, the Ingress URL will be different. The controller provisions an Application Load Balancer (ALB) and assigns a DNS name to it. 

### Using Azure Application Gateway Ingress Controller (AGIC) for AKS 
The Application Gateway Ingress Controller (AGIC) is a Kubernetes application that enables AKS customers to leverage Azure's native Application Gateway L7 load-balancer to expose services to the Internet. AGIC monitors your Kubernetes cluster and continuously updates the Application Gateway configuration.

#### Prerequisites
- An AKS cluster with Drasi installed. See this [link](/how-to-guides/installation/install-on-aks/) for installation instructions.
- az CLI


#### AGIC installation
AGIC can be installed on a new AKS cluster either via Helm or as an add-on. This [tutorial](https://learn.microsoft.com/en-us/azure/application-gateway/tutorial-ingress-controller-add-on-new) will guide you through the installation process.

#### Drasi configuration
First, get credentials to the AKS cluster by running the `az aks get-credentials` command:
```bash
az aks get-credentials -n myCluster -g myResourceGroup
```

Set the Drasi context to the AKS cluster:

```bash
drasi env kube
```

Obtain the public IP address of the Application Gateway from the Azure portal; this IP address will be used as the `--ingress-ip-address` when configuring Drasi.

Execute the following command to configure Drasi with the Application Gateway IP address:

```bash
drasi ingress init --use-existing --ingress-class-name azure-application-gateway --ingress-ip-address <ip-address>
```

### Using AWS Load Balancer Controller for EKS
The AWS Load Balancer Controller manages AWS Elastic Load Balancers for Kubernetes clusters, enabling you to expose cluster applications to the internet. It provisions Application Load Balancers (ALBs) for Kubernetes Ingress resources and Network Load Balancers (NLBs) for Kubernetes Service resources with appropriate annotations. The controller monitors your Kubernetes cluster and automatically configures load balancers based on your Kubernetes resource specifications.


#### Prerequisites
- An EKS cluster with Drasi installed. See this [link](/how-to-guides/installation/install-on-eks/) for installation instructions.
- aws CLI

#### ALB Configuration
Please refer to this [guide](https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html) for installing AWS Load Balancer Controller.

#### Drasi configuration
First, get credentials to the EKS cluster by running the `aws eks update-kubeconfig` command:
```bash
aws eks update-kubeconfig --region <region-code> --name <cluster-name>
```

Set the Drasi context to the EKS cluster:

```bash
drasi env kube
```

Unlike Azure Application Gateway which requires a static IP address, ALBs are dynamically provisioned with DNS names rather than fixed IP addresses. Execute the following command to configure Drasi with the appropriate ingress class name and required annotations:
```bash
drasi ingress init --use-existing --ingress-class-name alb --ingress-annotation "alb.ingress.kubernetes.io/scheme=internet-facing" --ingress-annotation "alb.ingress.kubernetes.io/target-type=ip"
```

### Using Ingress in Local Clusters (kind)
When running Drasi in local Kubernetes clusters like [kind](https://kind.sigs.k8s.io/), you need to configure ingress differently since you don't have cloud load balancers available.

#### Prerequisites
- A kind cluster with Drasi installed
- kubectl configured to connect to your kind cluster

#### Setting up Ingress Controller
For local development with kind, you can use the built-in Contour ingress controller that Drasi can install:

```bash
drasi ingress init
```

This will install Contour as the ingress controller in your kind cluster.

#### NodePort Access
There are two ways of using ingress in a local cluster like kind. The examples below are for kind clusters.

You can configure kind to expose ports directly:

1. Create your kind cluster with port mapping:
```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 80
    hostPort: 8080
    protocol: TCP
  - containerPort: 443
    hostPort: 8443
    protocol: TCP
```

2. Create the cluster:
```bash
kind create cluster --config kind-config.yaml
```

3. Install Drasi and configure ingress:
```bash
drasi ingress init
```

With this setup, your ingress resources will be accessible directly via `http://localhost:8080`.

#### Alternative: Port Forwarding for Local Access
Alternatively, since kind clusters don't have external load balancers, you can use port forwarding to access your ingress resources locally:

1. First, find the Contour envoy service:
```bash
kubectl get svc -n projectcontour
```

2. Forward the ingress controller port to your local machine:
```bash
kubectl port-forward -n projectcontour svc/envoy 8080:80
```

3. After applying your Drasi resources with ingress configuration, you can access them via `localhost:8080` with the appropriate Host header:
```bash
curl -H "Host: hello-world-debug.drasi.127.0.0.1.nip.io" http://localhost:8080
```