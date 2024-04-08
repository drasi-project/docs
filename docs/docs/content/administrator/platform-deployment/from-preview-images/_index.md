---
type: "docs"
title: "Deploying Drasi from Preview Images"
linkTitle: "From Images"
weight: 10
description: >
    Self-hosting Drasi on Kubernetes from Preview Images
---

## Prerequisites

- You need to be member of the **Project Drasi Preview Users** security group. Email [The Drasi Team](mailto:projectdrasiteam@service.microsoft.com) to request access.
- On the computer where you will run the install process:
  - [Kubectl](https://kubernetes.io/docs/tasks/tools/)
  - [Azure CLI](https://learn.microsoft.com//cli/azure/install-azure-cli) if you are deploying to AKS.
- A Kubernetes cluster. Common options include:
  - Cloud:
    - [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-portal?tabs=azure-cli)
  - Local (for dev/test):
    - [Kind](https://kind.sigs.k8s.io/)
    - [Minikube](https://minikube.sigs.k8s.io/docs/)
    - [Docker Desktop](https://www.docker.com/products/docker-desktop/) with [Kubernetes enabled](https://docs.docker.com/desktop/kubernetes/)
    - [k3s](https://k3s.io/) (If you have a linux machine or WSL instance on Windows)

**If you are deploying to an AKS cluster**, you can use the following `az cli` commands to pull the cluster credentials into your list of `kubectl` contexts:

```bash
az login
az account set --subscription <your subscription id>
az aks get-credentials --resource-group <your resource group> --name <your cluster name>
```

**If you are using Linux or a WSL distro**, you can install k3s which is very light weight and has zero dependencies.
```bash
curl -sfL https://get.k3s.io | sh -
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
sudo chown $(whoami) /etc/rancher/k3s/k3s.yaml
```

## Installing Drasi
Download the CLI for your platform
{{< tabpane >}}
{{< tab header="MacOS" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs/install-drasi-cli.sh" | /bin/bash
{{< /tab >}}
{{< tab header="Linux" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs/install-drasi-cli.sh" | /bin/bash
{{< /tab >}}
{{% tab header="Windows" text=true %}}
Please download the CLI through this [link]("https://drasi.blob.core.windows.net/installs/windows-x64/drasi.exe") and then add it to your system path.
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download the CLI for your platform, and add it to your system path:
- [MacOS arm64](https://drasi.blob.core.windows.net/installs/darwin-arm64/drasi)
- [MacOS x64](https://drasi.blob.core.windows.net/installs/darwin-x64/drasi)
- [Windows x64](https://drasi.blob.core.windows.net/installs/windows-x64/drasi.exe)
- [Linux x64](https://drasi.blob.core.windows.net/installs/linux-x64/drasi)
{{% /tab %}}
{{< /tabpane >}}


Make sure the current `kubectl` context is set to the Kubernetes cluster where you want to install Drasi:

```bash
kubectl config use-context <your cluster name>
```


For deploying Drasi within your Kubernetes cluster, execute the following command based on your cluster configuration:

```bash
drasi init --version preview.1
```

Dapr should be automatically installed to your cluster. You can verify this by running the command `kubectl get pods -n dapr-system`. 

## Optional: Testing the Deployment
To test that Drasi has been correctly deployed to your Kubernetes cluster, you can deploy a quick [smoke test](/reference/smoke-test) workload.