---
type: "docs"
title: "Drasi CLI"
linkTitle: "Drasi CLI"
weight: 50
description: >
    Detailed information of the Drasi CLI
---
```bash
Usage:
  drasi [command]

Available Commands:
  apply       Apply resources
  delete      Delete resources
  describe    Get spec and status of a resource
  help        Help about any command
  init        Install Drasi
  list        Get status of all resources of a type
  namespace   Manage namespaces
  wait        Wait for resources to be ready
  uninstall   Uninstall Drasi

Flags:
  -h, --help               help for drasi
  -n, --namespace string   Kubernetes namespace to install Drasi into (default "drasi-system")

Use "drasi [command] --help" for more information about a command.
```
## Commands

- ### Apply
    - The `apply` command is used to create or update resources from provided manifests. Currently, a `-f` flag is required, and the command takes in a directory of a YAML file.
    - When executed successfully, it will output `Apply operation successful`. Otherwise, it will return the status code of the operation.
      - e.g. `drasi apply -f resources/source.yaml`
    - You can also specify the namespace that you want the component to be applied in using the `-n` or `--namespace` flag:
      - e.g. `drasi apply -f resources/source.yaml -n demo`

- ### Delete
    - The `delete` command is used to delete a specific resource. The command can accept either a combination of the resource type and name intended for deletion, or it can process a directory containing a YAML file.
    - When executed successfully, it will output `Deletion Successful`. Otherwise, it will return the status code of the operation.
    - e.g. 
      - `drasi delete reaction debug-reaction`
      - `drasi delete -f resources/source.yaml`
    - You can also specify the namespace using the `-n` or `--namespace` flag:
      - e.g. `drasi delete -f resources/source.yaml -n demo`

- ### Describe
    - The `describe` command is used to retrieve the spec and status of a resource. The command accept a combination of the resource type and name.
      - e.g. `drasi describe source test-source`
    - You can use describe on a resource that is deployed in a different namespace using the `-n` or `--namespace` flag:
      - e.g. `drasi describe source test-source -n demo`

- ### Init
    - The `init` command is used to install Drasi to a kubernetes cluster. By default, Drasi components will be installed to the `drasi-system` namespace and this could be overridden.
    - **Flags:**
      - `--dapr-runtime-verison` (string): Dapr runtime version to install (default "1.10.0")
      - `--dapr-sidecar-version` (string): Dapr sidecar (daprd) version to install (default "1.9.0")
      - `--local`: When set, the CLI will use locally available images to install Drasi instead of pulling from a registry
      - `--namespace`, `-n` (string): Kubernetes namespace to install Drasi into (default "drasi-system")
      - `--registry` (string): Container registry to pull images from (default "drasi.azurecr.io")
      - `version` (string):  Container image version tag (default "latest")
    - e.g.
      - `drasi init --local -n demo`
      - `drasi init --registry coolregistry.azurecr.io --version preview.1 --dapr-sidecar-version 1.10.0`

- ### List
    - This command retrieves and displays the status of all resources of the specified type. The status includes various fields that provide information about the current state of the resource.
    - Available types of resources:
      - Continuousquery (or query for short)
      - QueryContainer
      - Reaction
      - Source
      - SourceProvider 

    - e.g.
      - `drasi list source`
      - `drasi list continuousquery`
      - `drasi list query`
      - `drasi list sourceprovider`
    - You can list the resources that are deployed in a different namespace using the `-n` or `--namespace` flag:
      - e.g. `drasi list source -n demo`

- ### Namespace
    - This command has three subcommands: `set`, `get` and `list`.
    - `set`:
      - It is used to set the current Drasi namespace. Useful if you work with multiple instances of Drasi that are installed in different namespace. This command assumes that the namespace is already created and that Drasi has been installed.
      - Additionally, you can also specify the namespace using the `-n` or `--namespace` flags. If both an argument and a flag value are provided, the value from the namespace flag will have a higher precedence.
        - e.g. 
          - `drasi namespace set demo` will set the current Drasi namespace to `demo`. 
          - `drasi namespace set ns1 -n ns2` will set the current Drasi namespace to `ns2`.
    - `get`:
      - Retrieves the current namespace in the Drasi config
      - Usage: `drasi namespace get`
    - `list`
      - Retrieves all namespaces that have an instance of Drasi installed
      - Usage: `drasi namespace list`

- ### Wait
    - The `wait` is used when you want to wait for a resource to be ready. The command can accept either a combination of the resource type and name intended for deletion, or it can process a directory containing a YAML file.
    - e.g.
      - `drasi wait resources/reaction.yaml`
      - `drasi wait source postgres-demo`

- ### Uninstall
    - The `uninstall` command will uninstall the Drasi instance from the current namespace by deleting the namespace. 
    - If the namespace flag is not set, the current namespace in the Drasi config will be deleted.
    - If the `uninstall-dapr` flag is set, then the `dapr-system` namespace will be removed and `dapr` will be uninstalled from the cluster
    - e.g.
      - `drasi uninstall`
      - `drasi uninstall -y` (Skips the confirmation prompt for verifying the namespace to be deleted)
      - `drasi uninstall -n <namespace>`