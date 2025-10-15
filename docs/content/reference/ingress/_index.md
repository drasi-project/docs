---
type: "docs"
title: "Ingress"
linkTitle: "Ingress"
weight: 60
description: >
    Deploy and manage Kubernetes ingress resources for your Drasi resources.
---

Drasi allows you to deploy and manage Kubernetes ingress resources for your applications easily in your Drasi YAML file, without using `kubectl`. You can use the Drasi CLI to install [Contour](https://projectcontour.io/) as your ingress controller, or use an existing ingress controller that is already deployed in your Kubernetes cluster.

Currently, Drasi only supports deploying ingress resources for Drasi Sources and Reactions.


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

### Using Ingress in Local Clusters
When running Drasi in local Kubernetes clusters like [kind](https://kind.sigs.k8s.io/) or [k3d](https://k3d.io/), you need to configure ingress differently since you don't have cloud load balancers available.

#### Using Ingress with kind

##### Option 1: Direct Port Access
You can configure kind to expose ports directly by creating your cluster with port mapping. This would require you to create a custom kind configuration file and then create the cluster using that configuration:

1. Create your kind cluster with port mapping:
```yaml
# kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 30080  # Maps to contour-envoy NodePort 30080
    hostPort: 8001
    listenAddress: "0.0.0.0"
  - containerPort: 30443  # Maps to contour-envoy NodePort 30443
    hostPort: 443
    listenAddress: "0.0.0.0"
```

2. Create the cluster:
```bash
kind create cluster --config kind-config.yaml
```

3. Install Drasi by following the [installation guide](/how-to-guides/installation/install-on-kind/).


4. Initialize ingress with the `--local-cluster` flag:
```bash
drasi ingress init --local-cluster
```

With this setup, access your ingress resources by appending `:8001` to the INGRESS URL shown in `drasi list`.

**Example:**

If you've deployed a Drasi Reaction called `hello-world-debug`, running `drasi list reaction` will show:
```bash
            ID          | AVAILABLE |                    INGRESS URL                    | MESSAGES
  ----------------------+-----------+---------------------------------------------------+-----------
    hello-world-debug   | true      | http://hello-world-debug.drasi.127.0.0.1.nip.io   |
```

You can then access this Reaction at:
```
http://hello-world-debug.drasi.127.0.0.1.nip.io:8001
```


##### Option 2: Port Forwarding for Local Access
If you didn't configure port mapping during cluster creation, you can use port forwarding to access your ingress resources. 

1. Install Drasi by following the [installation guide](/how-to-guides/installation/install-on-kind/).
2. Initialize ingress with the `--local-cluster` flag:
```bash
drasi ingress init --local-cluster
```

3. Forward the Contour service to localhost:
```bash
kubectl port-forward -n projectcontour svc/contour-envoy 8080:80
```

There are two ways to access your ingress resources.

**Method A: Browser Access (requires hosts file entries)**

Add entries to your hosts file for each of your ingress resources:

On **Linux/macOS**:
```bash
echo "127.0.0.1 <reaction/source name>.drasi.127.0.0.1.nip.io" | sudo tee -a /etc/hosts
```

On **Windows** (run PowerShell as Administrator):
```powershell
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 <reaction/source name>.drasi.127.0.0.1.nip.io"
```

Then access in your browser:
```
http://<reaction/source name>.drasi.127.0.0.1.nip.io:8080
```

**Method B: Using curl with Host header (no /etc/hosts needed)**

This method is simpler and doesn't require modifying system files:
```bash
curl http://localhost:8080 -H "Host: <reaction/source name>.drasi.127.0.0.1.nip.io"
```

#### Using Ingress with k3s/k3d


##### About k3s and k3d
[k3d](https://k3d.io/) is a lightweight wrapper to run [k3s](https://k3s.io/) (Rancher's minimal Kubernetes distribution) in Docker. k3s comes with Traefik as the default ingress controller, but you can disable it and use Contour instead for consistency with other environments.

##### Option 1: Using k3d with Contour

1. Create your k3d cluster with Traefik disabled and port mapping:
```bash
k3d cluster create -p '8081:30080@server:0' --k3s-arg '--disable=traefik@server:0'

# **Note:** The `--k3s-arg` parameter is optional. You can omit it if you want to keep Traefik enabled.
```

2. Install Drasi by following the [installation guide](/how-to-guides/installation/install-on-k3d/).
3. Initialize ingress with the `--local-cluster` and Contour websocket annotation:
```bash
drasi ingress init --local-cluster --ingress-annotation "projectcontour.io/websocket-routes=/"
```

With this setup, access your ingress resources by appending `:8081` to the INGRESS URL shown in `drasi list`.
**Example:**
If you've deployed a Drasi Reaction called `hello-world-debug`, running `drasi list reaction` will show:
```bash
            ID          | AVAILABLE |                    INGRESS URL                    | MESSAGES
  ----------------------+-----------+---------------------------------------------------+-----------
    hello-world-debug   | true      | http://hello-world-debug.drasi.127.0.0.1.nip.io   |
```

You can then access this Reaction at:
```
http://hello-world-debug.drasi.127.0.0.1.nip.io:8081
```


##### Option 2: Using k3d with Traefik

If you prefer to use the built-in Traefik ingress controller:

1. Create your k3d cluster with port mapping (Traefik enabled by default):
```bash
k3d cluster create my-cluster \
  --port 8080:80@loadbalancer \
  --port 8443:443@loadbalancer
```

2. Configure Drasi to use the existing Traefik ingress controller:
```bash
drasi ingress init --use-existing --ingress-class-name traefik --local-cluster
```

With this setup, access your ingress resources by appending `:8080` to the INGRESS URL shown in `drasi list`.
**Example:**
If you've deployed a Drasi Reaction called `hello-world-debug`, running `drasi list reaction will show:
```bash
            ID          | AVAILABLE |                    INGRESS URL                    | MESSAGES
  ----------------------+-----------+---------------------------------------------------+-----------
    hello-world-debug   | true      | http://hello-world-debug.drasi.127.0.0.1.nip.io  |
```
You can then access this Reaction at:
```
http://hello-world-debug.drasi.127.0.0.1.nip.io:8080
```

##### Option 3: Port Forwarding for Local Access

Similar to kind, you can use port forwarding if you didn't configure port mapping during cluster creation:


1. Install Drasi by following the [installation guide](/how-to-guides/installation/install-on-kind/).
2. Initialize ingress with the `--local-cluster` flag:
```bash
# For Contour
drasi ingress init --local-cluster --ingress-annotation "projectcontour.io/websocket-routes=/"

# For Traefik
drasi ingress init --use-existing --ingress-class-name traefik --ingress-ip-address 127.0.0.1
```

3. Forward the ingress controller port to your local machine:
```bash
# For Contour
kubectl port-forward -n projectcontour svc/envoy 8080:80

# For Traefik
kubectl port-forward -n kube-system svc/traefik 8080:80
```


There are two ways to access your ingress resources.

**Method A: Browser Access (requires hosts file entries)**

Add entries to your hosts file for each of your ingress resources:

On **Linux/macOS**:
```bash
echo "127.0.0.1 <reaction/source name>.drasi.127.0.0.1.nip.io" | sudo tee -a /etc/hosts
```

On **Windows** (run PowerShell as Administrator):
```powershell
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "127.0.0.1 <reaction/source name>.drasi.127.0.0.1.nip.io"
```

Then access in your browser:
```
http://<reaction/source name>.drasi.127.0.0.1.nip.io:8080
```

**Method B: Using curl with Host header (no /etc/hosts needed)**

This method is simpler and doesn't require modifying system files:
```bash
curl http://localhost:8080 -H "Host: <reaction/source name>.drasi.127.0.0.1.nip.io"
```