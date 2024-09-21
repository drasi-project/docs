---
type: "docs"
title: "Command Line Interface"
linkTitle: "Command Line Interface"
weight: 20
description: >
    Managing Drasi using the Drasi Command Line Interface (CLI)
---

The Drasi Command Line Interface (CLI) is a tool designed to streamline the installation of Drasi and the management of Drasi environments. This section provides comprehensive instructions on how to use the CLI to apply, delete, describe, and manage resources within your Drasi environment. Whether you are installing Drasi for the first time or managing existing resources, the CLI commands and flags detailed here will help you perform these tasks efficiently and effectively.

> The Drasi CLI is a convenient command line interface that wraps the [Drasi Management API](/reference/management-api/). Anything you can do through the Drasi CLI you can do programatically through the Managemnt API.

## Drasi Resources
In Drasi, a `resource` is a user-definable component that is created and managed using the Drasi CLI. There are currently six types of resource:


| Type | CLI Name | Description |
|------|----------|-------------|
| Continuous Query | continuousquery or query | A Continuous Query |
| Query Container | querycontainer | TODO |
| Reaction | reaction | A Reaction |
| Reaction Provider | reactionprovider | The definition of a specific type of Reaction that Drasi uses when users create new instances of that Reaction. Drasi comes with a number of predefined [Reaction providers](/how-to-guides/configure-reactions/) and developers can extend the capabilities of Drasi by [creating custom Reaction providers](/docs/content/how-to-guides/extend-drasi/implement-a-reaction.md). |
| Source | source | A Source |
| Source Provider | sourceprovider | The definition of a specific type of Source that Drasi uses when users create new instances of that Source. Drasi comes with a number of predefined [Source providers](/how-to-guides/configure-sources/) and developers can extend the capabilities of Drasi by [creating custom Source providers](/docs/content/how-to-guides/extend-drasi/implement-a-source.md). |

Throughout the Drasi CLI documentation and help text, where it refers to a `resource`, it usually means any of these resource types, unless otherwise specified. Where you need to specifiy a resource type, such as in the `drasi list` command, you use the **CLI Name** of the type listed in the table above. For example to list all Sources, use the command:

```
drasi list source
```

And to list all Continuous Queries, use the command:

```
drasi list query
```

## Get the Drasi CLI
You can download pre-built Drasi CLI binaries for your platform using the following commands / links:

{{< tabpane >}}
{{< tab header="MacOS" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs-ghcr/install-drasi-cli-github.sh" | /bin/bash -s -- $GITHUB_TOKEN
{{< /tab >}}
{{< tab header="Linux" lang="Bash" >}}
curl -fsSL "https://drasi.blob.core.windows.net/installs-ghcr/install-drasi-cli-github.sh" | /bin/bash -s -- $GITHUB_TOKEN
{{< /tab >}}
{{% tab header="Windows" text=true %}}
Please download the CLI through this [link](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-windows-x64.exe) and then add it to your system path.
{{< /tab >}}
{{% tab header="Binaries" text=true %}}
Download the CLI for your platform, and add it to your system path:
- [MacOS arm64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-darwin-arm64)
- [MacOS x64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-darwin-x64)
- [Windows x64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-windows-x64.exe)
- [Linux x64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-linux-x64)
- [Linux arm64](https://github.com/project-drasi/drasi-platform/releases/download/v0.1.0/drasi-linux-arm64)
{{% /tab %}}
{{< /tabpane >}}

Alternatively, you can build the Drasi CLI from source; to do this see the [Drasi CLI Source](#drasi-cli-source) section below.

## Get Help
The Drasi CLI provides online help for the different commands it supports and the arguments each command accepts. If you run `drasi` from the command line, you will see the following output providing a high level overview of all the commands supported by the Drasi CLI:

```
Usage:
  drasi [command]

Available Commands:
  apply       Apply resources
  completion  Generate the autocompletion script for the specified shell
  delete      Delete resources
  describe    Get spec and status of a resource
  help        Help about any command
  init        Install Drasi
  list        Get status of all resources of a type
  namespace   Manage namespaces
  uninstall   Uninstall Drasi
  version     Get Drasi CLI version
  wait        Wait for resources to be ready

Flags:
  -h, --help               help for drasi
  -n, --namespace string   Kubernetes namespace to install Drasi into (default "drasi-system")

Use "drasi [command] --help" for more information about a command.
```

If you want help on a specific command, you can run the command:

```bash
drasi help <command>
```

For example, to get help for the `apply` command, run:

```bash
drasi help apply
```

And you will see the following output, detailing the flags the `apply` command takes:

```
Creates or updates resources from provided manifests

Usage:
  drasi apply -f [files] [flags]

Flags:
  -f, --files   apply -f file1.yaml file2.yaml
  -h, --help    help for apply

Global Flags:
  -n, --namespace string   Kubernetes namespace to install Drasi into (default "drasi-system")
```

Equivalently, you can use the `-h` or `--help` flags after the command name, like this:

```bash
drasi apply -h
```

## Target the Drasi Environment
The Drasi CLI will target commands at the Drasi environment running on the Kubernetes cluster that is configured as the **current context** in `kubectl`. To check the current context use this command:

```bash
kubectl config current-context
```

To change the current context, use this command:

```bash
kubectl config use-context <drasi_cluster_name>
```

Drasi can be installed in the namespace of your choice on a Kubernetes cluster and can also be installed multiple times in different namespaces on the same cluster. The Drasi CLI provides the `drasi namespace` command to configure the current default namespace and each command supports the `-n` or `--namespace` flag to enable you to specify which Kubernetes namespace you want to target with any command you run.

For example, the following command will get a list of Sources from the Drasi environment running in the current default namesapce:

```
drasi list source
```

Whereas, the following command will get a list of Sources from the Drasi environment running in the `production` namesapce, irrespective of what the default namespace is:

```
drasi list source -n production
```

## Command Reference

In this section, you will find detailed explanations and usage examples for each command available in the Drasi CLI. 

### drasi apply
**Purpose**: The `apply` command is used to create or update one or more resources described in a YAML file. The YAML file can contain multiple resource definitions and can be any mix of resource types.

**Flags and Arguments**:
- `-f|--files <file> <file> <...>`: Specifies the location of one or more YAML files containing the resources to create. File locations can be absolute or relative file paths or URLs.
- `-n|--namespace <namespace>`: Specifies the namespace where the resources should be created. If not provided, the default namespace configured using the `drasi namespace set` command is used.
- `-h|--help`: Display help for the `apply` command.

**Usage Example**:
The following command will create all the resources defined in the `drasi-resources.yaml` file. It will create them in the Drasi environment running in the `demo` Kubernetes namespace.

```
drasi apply -f resources/drasi-resources.yaml -n demo
```

**Output**:
If succesful, the `apply` command will output the following message:

```
Apply operation successful
```

Otherwise, the output will contain error message describing what went wrong.

> **Note**: The output of the `apply` command only relates to the registration of the new resource in the Drasi configuration. It will fail for reasons like the definition being invalid. But a succesful `apply` does not mean the resource is functioning correctly. If the resource fails during its startup process, for example if a **Source** cannot connect to its database, this will not be visible to the `apply` command. You will need to look at the status of a resource using the `drasi list` command (see below) to know if it is functioning correctly.

**Known Issues**: 
- Drasi does not currently enforce dependency relationships between resources. If you create multiple resources from a single YAML file or issue multiple commands rapidly, and those resources depend upon each other (i.e. a Continuous Query that uses a Source), Drasi does not gaurantee that the Source is succesfully created and working before the Continuous Query that uses it is created, meaning the Continuous Query could fail.

### drasi completion
**Purpose**: The `completion` command generates autocompletion scripts to enable command-line autocomplete functionality for the Drasi CLI for various command shells. This is functionality automatically provided by the [Cobra library](https://github.com/spf13/cobra) used in the development of the Drasi CLI. 

> **Note**: The Drasi Team have left this feature enabled in case it is of interest to our users, but we do not test nor support the scripts generated by this feature.

**Flags and Arguments**:
- `<command>`: Specifies the target shell of the script to generate. Can be one of `bash`, `fish`, `powershell`, `zsh`
- `<command> -h|--help`: Generates help for how to use the script generated for the specific shell.
- `-h|--help`: Display help for the `completion` command.

**Usage Example**:
The help information generated by the Cobra Library is extensive and easy to understand, it even includes code snippets that can be copied and used to complete the enablement of automcomplete support. For example, to get details about how to generate and use autocompletion scripts for the `zsh` shell, run the command:

```
drasi completion zsh -h
``` 

### drasi delete
**Purpose**: The `delete` command is used to delete one or more Drasi resources.

**Arguments and Flags**:
- `<resource-type> <resource-id>`: specifies the type and the ID of the resource to delete.
- `-f|--files <file>`: Specifies the YAML file containing the definitions f the resources to delete. This is a convenience that allows you to use the same YAML file used to create resources to delete them.
- `-n|--namespace <namespace>`: Specifies the namespace where the resources should be applied. If not provided, the default namespace configured using the `drasi namespace set` command is used.
- `-h|--help`: Display help for the `delete` command.

**Usage Example**:
The following command will delete all the resources defined in the `drasi-resources.yaml` file. It will delete them from the Drasi environment running in the `demo` Kubernetes namespace.

```
drasi delete -f resources/source.yaml -n demo
```

Alternatively, the following command deletes a single **Source** resource named **Facilities** from the current default namespace:

```
drasi delete source Facilities
```

**Output**:
If succesful, the `delete` command will output the following message:

```
Delete operation successful
```

Otherwise, the output will contain error message describing what went wrong.

**Known Issues**: 
- Drasi does not currently enforce dependency checks between existing resources. If you delete a **Source** that is used by one or more **Continuous Queries** or a **Continuous Query** that is used by a **Reaction**, you will break the dependent resource.
- Drasi does not currently implement resource-level security. If you have permissions to manage resources on a Kubernetes namespace, you can delete any resource.
- The Drasi CLI does not ask for confirmation before deleting a resource; once you hit enter, the resource is deleted. The only way to get it back is to recreate it with the `apply` command.

### drasi describe
**Purpose**: The `describe` command provides detailed information about an existing resource, including full details of the resource's configuration and status.

**Flags and Arguments**:
- `<resource-type>` `<resource-id>`: specifies the type and the ID of the resource to describe.
- `-n|--namespace <namespace>`: Specifies the namespace where the resources should be applied. If not provided, the default namespace configured using the `drasi namespace set` command is used.
- `-h|--help`: Display help for the `describe` command.

**Usage Example**:
The following command will describe the **Continuous Query** named **inactive-people** from the Drasi environment running in the `demo` Kubernetes namespace.

```
drasi describe query inactive-people -n demo
```

**Output**:
If the specified resource exists, the `describe` command will output detailed information about the resource, including the configuration provided when the resource was created, as well as the current status of the resource. Here is an example of the output for a **Continuous Query** named **inactive-people**:

```
id: inactive-people
spec:
    container: default
    mode: query
    query: "MATCH\n  (m:Message)\nWITH\n  m.From AS MessageFrom,\n  max(drasi.changeDateTime(m)) AS LastMessageTimestamp\nWHERE\n  LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 })\nOR\n  drasi.trueLater(LastMessageTimestamp <= datetime.realtime() - duration({ seconds: 20 }), LastMessageTimestamp + duration({ seconds: 20 }))\nRETURN\n  MessageFrom,\n  LastMessageTimestamp      \n"
    sources:
        joins: []
        middleware: []
        subscriptions:
            - id: hello-world
              nodes: []
              pipeline: []
              relations: []
    storageProfile: null
    view:
        enabled: true
        retentionPolicy: latest
status:
    container: default
    errorMessage: 'Failed to fetch data from source ''hello-world'': 500 Internal Server Error {"errorCode":"ERR_DIRECT_INVOKE","message":"fail to invoke, id: hello-world-query-api, err: failed to invoke target hello-world-query-api after 3 retries"}'
    hostName: default-query-host-866cfd7c69-wsb2x
    status: TerminalError
```

In the above example, the `inactive-people` resource is currently in an error state and the `status` section of the output contains details of the error to help diagnose the problem.

### drasi help
**Purpose**: The `help` command provides detailed help information about Drasi CLI commands. It is useful for understanding the usage, flags, and arguments of various commands available in the Drasi CLI. See the [Get Help](#get-help) section above.

### drasi init
**Purpose**: The `init` command is used to install a Drasi environment to the Kubernetes cluster that is the **current context** in `kubectl` ([see above](#target-the-drasi-environment)). By default, the Drasi ebvironment will be installed into the `drasi-system` namespace, but this can be overridden as described below.

**Flags and Arguments**:
- `--dapr-runtime-version <version>`: Specifies the Dapr runtime version to install. The default value is "1.10.0".
- `--dapr-sidecar-version <version>`: Specifies the Dapr sidecar (daprd) version to install. The default value is "1.9.0".
- `--local`: If set, the Drasi CLI will use locally available images to install Drasi instead of pulling them from a remote container registry.
- `-n|--namespace <namespace>`: Specifies the Kubernetes namespace to install Drasi into. This namespace will be created if it does not exist. The default value is "drasi-system".
- `--registry <registry>`: Address of the container registry to pull Drasi images from. The default value is "ghcr.io".
- `--version <tag>`: Container image version tag to use when pulling Drasi images. The default value is the version tag from the Drasi CLI, which is available through the [drasi version](#drasi-version) command discussed below.
- `-h|--help`: Display help for the `init` command.

**Usage Example**:
To deploy a Drasi environment into the current Kubernetes cluster and use all the default values, you can run:

```bash
drasi init
```

If you are doing development or testing and want to deploy Drasi to the `drasi-dev` namespace and use images from the local repo that have the `dev` tag, you would run the following command:

```bash
drasi init --local -n drasi-dev -version dev
```

> Note: If you use the `local`, `registry`, or `version` flags to make the `init` command look for non-standard images in a non-standard location and the images it needs are not available. The installation will fail.

**Output**:
The `init` command carries out multiple steps in order to prepare the target Kubernetes environment, deploy Drasi dependencies, download required images, and deploy the initial set of Drasi services. This usually takes between 5 to 15 minutes the first time it is run (depending on network bandwidth). As the Drasi CLI completes its step of the installation process, it outputs its progress.

The following shows the output from a successful Drasi installation (where the required version of DAPR was already installed):

```
Installing Drasi with version latest from registry ghcr.io
ℹ Dapr already installed
✓ Infrastructure deployed
  ✓ app=rg-redis is online
  ✓ app=rg-mongo is online
✓ Control plane is online
  ✓ drasi/infra=api is online
  ✓ drasi/infra=resource-provider is online
✓ Query container created
  ✓ Apply: QueryContainer/default: complete
  ✓ Wait QueryContainer/default online
✓ Default source providers created
  ✓ Apply: SourceProvider/PostgreSQL: complete
  ✓ Apply: SourceProvider/SQLServer: complete
  ✓ Apply: SourceProvider/CosmosGremlin: complete
✓ Default reaction providers created
  ✓ Apply: ReactionProvider/Debug: complete
  ✓ Apply: ReactionProvider/Debezium: complete
  ✓ Apply: ReactionProvider/EventGrid: complete
  ✓ Apply: ReactionProvider/Gremlin: complete
  ✓ Apply: ReactionProvider/Result: complete
  ✓ Apply: ReactionProvider/SignalR: complete
  ✓ Apply: ReactionProvider/StorageQueue: complete
  ✓ Apply: ReactionProvider/StoredProc: complete
```

If any of these steps fail, a red check mark will appear next to the step.

**Known Issues**: 
- Sometimes, `drasi init` can fail due to transient errors, usually due to failed network connections or timeouts downloading and installing dependencies. In these situations you can simply rerun the same `drasi init` command and the Drasi CLI will attempt to complete the remaining incomplete steps.

### drasi list
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

### drasi namespace
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

### drasi uninstall
    - The `uninstall` command will uninstall the Drasi instance from the current namespace by deleting the namespace. 
    - If the namespace flag is not set, the current namespace in the Drasi config will be deleted.
    - If the `uninstall-dapr` flag is set, then the `dapr-system` namespace will be removed and `dapr` will be uninstalled from the cluster
    - e.g.
      - `drasi uninstall`
      - `drasi uninstall -y` (Skips the confirmation prompt for verifying the namespace to be deleted)
      - `drasi uninstall -n <namespace>`

### drasi version


### drasi wait
    - The `wait` is used when you want to wait for a resource to be ready. The command can accept either a combination of the resource type and id intended for deletion, or it can process a directory containing a YAML file.
    - e.g.
      - `drasi wait resources/reaction.yaml`
      - `drasi wait source postgres-demo`

## Drasi CLI Source
The Drasi CLI is written in Go. If you want to explore how the Drasi CLI works, the source code is in the [drasi-platform repo](https://github.com/drasi-project/drasi-platform) in the [cli folder](https://github.com/drasi-project/drasi-platform/tree/main/cli).

The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build the Drasi CLI from source.

The definitions of **SourceProviders** installed by default when you run `drasi init` are contained in the [default-source-providers.yaml](https://github.com/drasi-project/drasi-platform/blob/main/cli/service/resources/default-source-providers.yaml) file.

The definitions of **ReactionProviders** installed by default when you run `drasi init` are contained in the [default-reaction-providers.yaml](https://github.com/drasi-project/drasi-platform/blob/main/cli/service/resources/default-reaction-providers.yaml) file.

