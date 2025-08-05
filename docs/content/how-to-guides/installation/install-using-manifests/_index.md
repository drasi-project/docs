---
type: "docs"
title: "Install using Kubernetes Manifests"
linkTitle: "Install using Kubernetes Manifests"
weight: 50
description: >
    Learn how to install Drasi using generated Kubernetes manifests for offline or controlled deployments
---

The Drasi CLI provides the ability to generate Kubernetes manifests instead of performing a direct installation. This approach is useful for environments where you need to review manifests before deployment, have restricted network access, or prefer to apply manifests manually through your CI/CD pipeline.

## Prerequisites

This guide assumes you are familiar with:
- [Kubernetes](https://kubernetes.io/) and know how to use [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) to manage a Kubernetes cluster
- Basic understanding of Kubernetes manifests and YAML files

You will need:
- Access to a Kubernetes cluster with admin permissions
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl) installed and configured
- [Dapr](https://dapr.io/) pre-installed in your cluster (see [Dapr installation guide](https://docs.dapr.io/getting-started/install-dapr-kubernetes/))

## Get the Drasi CLI

You will generate the manifests using the [Drasi CLI](/reference/command-line-interface/). 

You can get the Drasi CLI for your platform using one of the following options:

{{< tabpane >}}
{{< tab header="macOS" lang="bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
{{< /tab >}}
{{< tab header="Windows PowerShell" lang="powershell" >}}
iwr -useb "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.ps1" | iex
{{< /tab >}}
{{< tab header="Linux" lang="shell" >}}
wget -q "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh" -O - | /bin/bash
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download a specific version of the CLI from the [drasi-platform releases](https://github.com/drasi-project/drasi-platform/releases) page on GitHub. The file to download for your platform is:
- **macOS arm64** - drasi-darwin-arm64
- **macOS x64** - drasi-darwin-x64
- **Windows x64** - drasi-windows-x64.exe
- **Linux x64** - drasi-linux-x64
- **Linux arm64** - drasi-linux-arm64

Once downloaded, rename the file to `drasi` (macOS and Linux) or `drasi.exe` (Windows) and add it to your path.
{{% /tab %}}
{{% tab header="Build from Source" text=true %}}
The Drasi CLI source code is in the [drasi-platform repo](https://github.com/drasi-project/drasi-platform) in the [cli folder](https://github.com/drasi-project/drasi-platform/tree/main/cli).

The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build and install the Drasi CLI on your computer.
{{% /tab %}}
{{< /tabpane >}}

## Generate Drasi Manifests

To generate Kubernetes manifests instead of performing a direct installation, use the `--manifest` flag with the `drasi init` command:

```bash
drasi init --manifest
```

This command will generate two manifest files in the current directory:
- `kubernetes-resources.yaml` - Contains Kubernetes infrastructure components to setup the Drasi control plane
- `drasi-resources.yaml` - Contains Drasi-specific resources (Sources, Reactions, Query Containers, etc.)

You can also specify a custom output directory:

```bash
drasi init --manifest /path/to/manifests
```

### Customizing the Generated Manifests

The `drasi init --manifest` command supports the same configuration flags as the regular installation:

- `-n|--namespace <namespace>`: Specifies the Kubernetes namespace to target. Default is "drasi-system".
- `--registry <registry>`: Address of the container registry to pull Drasi images from. Default is "ghcr.io".
- `--version <tag>`: Container image version tag to use. Default is the CLI version.
- `--observability-level <level>`: Specifies observability infrastructure (`none`, `tracing`, `metrics`, `full`).

Example with custom settings:

```bash
drasi init --manifest ./drasi-manifests --namespace drasi-prod --version 0.1.5 --observability-level metrics
```

## Install Drasi Using the Generated Manifests

Follow these steps to install Drasi using the generated manifests:

### Step 1: Verify Dapr Installation

Ensure Dapr is installed in your cluster:

```bash
kubectl get pods -n dapr-system
```

You should see output similar to:

```
NAME                                     READY   STATUS    RESTARTS   AGE
dapr-dashboard-5cc65d985f-qzqbg          1/1     Running   0          10m
dapr-operator-5d98f57c86-kspwk           1/1     Running   0          10m
dapr-placement-server-0                  1/1     Running   0          10m
dapr-sentry-697bdc6cc4-xprww             1/1     Running   0          10m
dapr-sidecar-injector-56c4c4b485-n48bg   1/1     Running   0          10m
```

If Dapr is not installed, follow the [Dapr installation guide](https://docs.dapr.io/getting-started/install-dapr-kubernetes/).

### Step 2: Apply the Infrastructure Manifest

Apply the Kubernetes infrastructure manifest first:

```bash
kubectl apply -f kubernetes-resources.yaml
```

This will create:
- The Drasi namespace (if it doesn't exist)
- Infrastructure components
- Required ConfigMaps and Secrets
- RBAC resources
- Drasi control plane

Wait for the infrastructure components to be ready:

```bash
kubectl wait --for=condition=available --timeout=300s deployment/drasi-api -n drasi-system
```

### Step 3: Configure Drasi CLI Environment

Configure the Drasi CLI to point to your current Kubernetes context:

```bash
drasi env kube
```

This command will:
- Add your current Kubernetes context as a Drasi environment
- Set it as the active environment for Drasi CLI commands

### Step 4: Apply the Drasi Resources Manifest

Apply the Drasi-specific resources:

```bash
drasi apply -f drasi-resources.yaml
```

This will create:
- Control plane components (API server, resource provider)
- Default query container
- Source providers (PostgreSQL, SQL Server, Cosmos Gremlin, etc.)
- Reaction providers (Debug, SignalR, EventGrid, etc.)

### Step 5: Verify the Installation

Check that all Drasi components are running:

```bash
drasi list querycontainer
```

You should see output similar to:

```
    ID    | AVAILABLE
----------+------------
  default | true
```

## Example: Complete Installation Workflow

Here's a complete example of installing Drasi using manifests:

```bash
# 1. Generate manifests in a specific directory
mkdir drasi-manifests
drasi init --manifest ./drasi-manifests

# 2. Review the generated manifests (optional)
ls drasi-manifests/
# kubernetes-resources.yaml
# drasi-resources.yaml

# 3. Apply infrastructure manifest
kubectl apply -f drasi-manifests/kubernetes-resources.yaml

# 4. Wait for infrastructure to be ready
kubectl wait --for=condition=available --timeout=300s deployment/drasi-api -n drasi-system

# 5. Configure Drasi CLI
drasi env kube

# 6. Apply Drasi resources
drasi apply -f drasi-manifests/drasi-resources.yaml

# 7. Verify installation
drasi list querycontainer -n drasi-production
```

## Benefits of Using Manifests

Installing Drasi using generated manifests provides several advantages:

- **Review and Approval**: You can inspect all resources before applying them
- **Version Control**: Manifests can be stored in Git for tracking changes
- **CI/CD Integration**: Manifests can be applied through automated pipelines
- **Offline Installation**: Generate manifests in one environment and apply in another
- **Customization**: Modify manifests before applying if needed
- **Compliance**: Meet organizational requirements for reviewing infrastructure changes

## Troubleshooting

### Common Issues

**Infrastructure pods not starting:**
- Verify sufficient cluster resources (CPU, memory, storage)
- Check that the namespace exists and has proper permissions
- Review pod logs: `kubectl logs <pod-name> -n drasi-system`

**Drasi API not available:**
- Ensure infrastructure components are fully ready before applying Drasi resources
- Verify Dapr is properly installed and running
- Check that `drasi env kube` was executed successfully

**Resource application failures:**
- Ensure you're using the correct namespace with `-n` flag
- Verify the Drasi CLI is pointing to the correct Kubernetes context
- Check cluster connectivity and permissions

### Getting Help

For additional troubleshooting and support:
- Review the [Drasi CLI Command Reference](/reference/command-line-interface/)
- Check the [Drasi GitHub Issues](https://github.com/drasi-project/drasi-platform/issues)
- Consult the Drasi documentation for specific components

## Deleting Drasi

To remove a Drasi installation deployed via manifests:

```bash
# Delete Drasi resources first
drasi delete -f drasi-manifests/drasi-resources.yaml

# Then delete infrastructure
kubectl delete -f drasi-manifests/drasi-infrastructure.yaml
```
