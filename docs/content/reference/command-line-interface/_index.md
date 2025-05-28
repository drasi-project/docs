---
type: "docs"
title: "Command Line Interface"
linkTitle: "Command Line Interface"
weight: 10
description: >
    Managing Drasi using the Drasi Command Line Interface (CLI)
---

The Drasi Command Line Interface (CLI) is a tool designed to streamline the installation of Drasi and the management of Drasi environments. This section provides comprehensive instructions on how to use the CLI to apply, delete, describe, and manage resources within your Drasi environment. Whether you are installing Drasi for the first time or managing existing resources, the CLI commands and flags detailed here will help you perform these tasks efficiently and effectively.

> The Drasi CLI is a convenient command line interface that wraps the [Drasi Management API](/reference/management-api/). Anything you can do through the Drasi CLI you can do programmatically through the Management API.

## Drasi Resources
In Drasi, a `resource` is a user-definable component that is created and managed using the Drasi CLI. There are currently six types of resource:


| Type | CLI Name |
|------|----------|
| [Continuous Query](/concepts/continuous-queries/) | continuousquery or query |
| [Query Container](/concepts/query-container/) | querycontainer |
| [Reaction](/concepts/reactions/) | reaction |
| [Reaction Provider](/concepts/reactions/) | reactionprovider |
| [Source](/concepts/sources/) | source |
| [Source Provider](/concepts/sources/) | sourceprovider |

Throughout the Drasi CLI documentation and help text, where it refers to a `resource`, it usually means any of these resource types, unless otherwise specified. Where you need to specify a resource type, such as in the `drasi list` command, you use the **CLI Name** of the type listed in the table above. For example to list all Sources, use the command:

```
drasi list source
```

And to list all Continuous Queries, use the command:

```
drasi list query
```

## Get the Drasi CLI
You can get the Drasi CLI for your platform using one of the following options:

{{< tabpane >}}
{{< tab header="macOS" lang="bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash
{{< /tab >}}
{{< tab header="Windows PowerShell" lang="powershell" >}}
iwr -useb "https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.ps1" | iex
{{< /tab >}}
{{< tab header="Linux" lang="bash" >}}
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

## Get Help
The Drasi CLI provides online help for the different commands it supports and the arguments each command accepts. If you run `drasi` from the command line, you will see the following output providing a high level overview of all the commands supported by the Drasi CLI:

```
Usage:
  drasi [command]

Available Commands:
  apply       Create or update resources
  completion  Generate the autocompletion script for the specified shell
  delete      Delete resources
  describe    Show the definition and status of a resource
  env         Manage Drasi environment configurations.
  help        Help about any command
  init        Install Drasi
  list        Show a list of available resources
  namespace   Manage CLI namespace settings
  secret      Manage secrets
  tunnel      Create a tunnel to a Drasi resource
  uninstall   Uninstall Drasi
  version     Show the Drasi CLI version
  wait        Wait for resources to be ready
  watch       Watch the result set of a query

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

For example, the following command will get a list of Sources from the Drasi environment running in the current default namespace:

```
drasi list source
```

Whereas, the following command will get a list of Sources from the Drasi environment running in the `production` namespace, irrespective of what the default namespace is:

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
If successful, the `apply` command will output the following message:

```
Apply operation successful
```

Otherwise, the output will contain error message describing what went wrong.

> **Note**: The output of the `apply` command only relates to the registration of the new resource in the Drasi configuration. It will fail for reasons like the definition being invalid. But a successful `apply` does not mean the resource is functioning correctly. If the resource fails during its startup process, for example if a **Source** cannot connect to its database, this will not be visible to the `apply` command. You will need to look at the status of a resource using the `drasi list` command (see below) to know if it is functioning correctly. See the [drasi wait](#drasi-wait) command for a way to wait for resources to become fully functional.

**Known Issues**: 
- Drasi does not currently enforce dependency relationships between resources. If you create multiple resources from a single YAML file or issue multiple commands rapidly, and those resources depend upon each other (i.e. a Continuous Query that uses a Source), Drasi does not guarantee that the Source is successfully created and working before the Continuous Query that uses it is created, meaning the Continuous Query could fail.

### drasi completion
**Purpose**: The `completion` command generates autocompletion scripts to enable command-line autocomplete functionality for the Drasi CLI for various command shells. This is functionality automatically provided by the [Cobra library](https://github.com/spf13/cobra) used in the development of the Drasi CLI. 

> **Note**: The Drasi Team have left this feature enabled in case it is of interest to our users, but we do not test nor support the scripts generated by this feature.

**Flags and Arguments**:
- `<command>`: Specifies the target shell of the script to generate. Can be one of `bash`, `fish`, `powershell`, `zsh`
- `<command> -h|--help`: Generates help for how to use the script generated for the specific shell.
- `-h|--help`: Display help for the `completion` command.

**Usage Example**:
The help information generated by the Cobra Library is extensive and easy to understand, it even includes code snippets that can be copied and used to enable autocompletion support. For example, to get details about how to generate and use autocompletion scripts for the `zsh` shell, run the command:

```
drasi completion zsh -h
``` 

### drasi delete
**Purpose**: The `delete` command is used to delete one or more Drasi resources.

**Arguments and Flags**:
- `<resource-type> <resource-id>`: specifies the type and the ID of the resource to delete.
- `-f|--files <file> <file> <...>`: Specifies one or more YAML files containing the definitions of the resources to delete. This is a convenience that allows you to use the same YAML files used to create resources to delete them; only the resource types and names from the files are relevant, the rest of the definitions are ignored.
- `-n|--namespace <namespace>`: Specifies the namespace where the resources to be deleted are hosted. If not provided, the default namespace configured using the `drasi namespace set` command is used.
- `-h|--help`: Display help for the `delete` command.

**Usage Example**:
The following command will delete all the resources defined in the `drasi-resources.yaml` file. It will delete them from the Drasi environment running in the `demo` Kubernetes namespace.

```
drasi delete -f resources/drasi-resources.yaml -n demo
```

Alternatively, the following command deletes a single **Source** resource named **Facilities** from the current default namespace:

```
drasi delete source Facilities
```

**Output**:
If successful, the `delete` command will output the following message:

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
- `-n|--namespace <namespace>`: Specifies the namespace where the resources to be described are hosted. If not provided, the default namespace configured using the `drasi namespace set` command is used.
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

### drasi env
**Purpose**: The `env` command provides a subset of commands to manage a collection of Drasi environment configurations that are stored in your local user profile. When one of these environments is set to the current environment, all Drasi CLI commands are directed to that instance of Drasi.

#### drasi env all
**Purpose**: The `env all` command provides a list of all the environments that are saved in your local user profile. 

**Usage Example**:

```bash
drasi env all
```

**Output**: A list of all the environments that are saved in your local user profile, with that platform type and the currently selected environment is marked with a `*`

```
    |   NAME    |  PLATFORM   
----+-----------+-------------
  * | docker    | docker      
    | kind-kind | kubernetes 
```

#### drasi env current
**Purpose**: The `env current` command provides the name and details of the currently selected Drasi environment.


#### drasi env delete
**Purpose**: The `env delete` command will remove the named Drasi environment from the list of Drasi environments stored in your user profile.

**Arguments**:
- `<name>`: Specifies the name of the environment to delete.

**Usage Example**:

```bash
drasi env delete docker
```

#### drasi env kube
**Purpose**: The `env kube` command will add the current Kubernetes context as a Drasi configuration and set it as the current environment.

**Arguments**:
- `<name>`: Specifies the name of the environment to delete.

**Usage Example**:

```bash
drasi env kube
```

#### drasi env use
**Purpose**: The `env use` command will set the named Drasi environment from the list of Drasi environments stored in your user profile to the currently selected environment, that all following commands will be directed to.

**Arguments**:
- `<name>`: Specifies the name of the environment to use.

**Usage Example**:

```bash
drasi env use docker
```


### drasi help
**Purpose**: The `help` command provides detailed help information about Drasi CLI commands. It is useful for understanding the usage, flags, and arguments of various commands available in the Drasi CLI. See the [Get Help](#get-help) section above.

### drasi init
**Purpose**: The `init` command is used to install a Drasi environment to the Kubernetes cluster that is the **current context** in `kubectl` ([see above](#target-the-drasi-environment)). By default, the Drasi environment will be installed into the `drasi-system` namespace, but this can be overridden as described below.

**Flags and Arguments**:
- `--dapr-runtime-version <version>` (optional): Specifies the Dapr runtime version to install. The default value is the latest stable release.
- `--dapr-sidecar-version <version>` (optional): Specifies the Dapr sidecar (daprd) version to install. The default value is the latest stable release.
- `--docker` (optional): If set, a Docker container will be created and a self-contained instance of drasi will be installed into it. You do not need a Kubernetes cluster or the kubectl tooling if using this option. 
- `--local` (optional): If set, the Drasi CLI will use locally available images to install Drasi instead of pulling them from a remote container registry.
- `-n|--namespace <namespace>` (optional): Specifies the Kubernetes namespace to install Drasi into. This namespace will be created if it does not exist. The default value is "drasi-system".
- `--registry <registry>` (optional): Address of the container registry to pull Drasi images from. The default value is "ghcr.io".
- `--version <tag>` (optional): Container image version tag to use when pulling Drasi images. The default value is the version tag from the Drasi CLI, which is available through the [drasi version](#drasi-version) command discussed below.
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
**Purpose**: The `list` command is used to display the list of resources of a specified type that are defined in a Drasi environment along with some basic status information. This command helps you to quickly view the resources that are currently running in Drasi.

**Flags and Arguments**:
- `<resource-type>`: Specifies the type of resource to list; see the [Drasi Resources](#drasi-resources) section for a description of the possible values.
- `-n|--namespace <namespace>`: Specifies the namespace where the resources to be listed are hosted. If not provided, the default namespace configured using the `drasi namespace set` command is used.
- `-h|--help`: Display help for the `list` command.

**Usage Example**:
The following command will list all the `query` resources in the `demo` Kubernetes namespace:

```bash
drasi list query -n demo
```

**Output**:
The output of the `list` command depends on the resource type being listed.

When listing static resources like `sourceprovider` and `reactionprovider`, the output is a simple list with no additional status information, like this list of available **Source Providers**:

```
       ID
-----------------
  PostgreSQL
  SQLServer
  CosmosGremlin
```

When listing `querycontainer`, `source`, and `reaction` resources, the output is a table showing the name of the resource and a status showing whether the resource is available, like this list of **Query Containers**:

```
    ID    | AVAILABLE
----------+------------
  default | true
```

When listing `continuousquery` (or `query`) resources, the output is a table the shows where the **Continuous Query** is running and what its current status is. Here is an example containing multiple **Continuous Queries**, two of which are `Running` and one of which is in a `TerminalError` state:

```
        ID         | CONTAINER |                   ERRORMESSAGE                   |              HOSTNAME               |    STATUS
-------------------+-----------+--------------------------------------------------+-------------------------------------+----------------
  hello-world-from | default   |                                                  | default-query-host-866cfd7c69-wsb2x | Running
  message-count    | default   |                                                  | default-query-host-866cfd7c69-wsb2x | Running
  inactive-people  | default   | Failed to fetch data from source                 | default-query-host-866cfd7c69-wsb2x | TerminalError
                   |           | 'hello-world': 500 Internal Server Error         |                                     |
                   |           | {"errorCode":"ERR_DIRECT_INVOKE","message":"fail |                                     |
                   |           | to invoke, id: hello-world-query-api, err:       |                                     |
                   |           | failed to invoke target hello-world-query-api    |                                     |
                   |           | after 3 retries"}                                |                                     |
```
**Known Issues**: 
- The status information displayed by the `list` command is often not sufficient to debug and resolve the cause of issues. Improving the resilience, error reporting, and supportability of Drasi is an active and ongoing stream of work. Currently, it is usually necessary to look at the container logs of the Kubernetes node on which the failed component is hosted to determine what is going wrong.


### drasi namespace
**Purpose**: The `namespace` command manages the Kubernetes namespace settings for the Drasi CLI. The Drasi CLI has the concept of a **current namespace**, which defaults to `drasi-system`. But you can use the `namespace` command to change the default Drasi namespace. The `namespace` command is required when you work with multiple instances of Drasi that are installed in different namespaces. 

**Sub commands**:
- `get`: Get the default namespace name.
- `list`: List all namespaces that have Drasi deployments.
- `set <namespace>`: Set the default namespace name. This command assumes that the namespace is already created and that Drasi has been installed in it.

**Flags and Arguments**:
- `-n|--namespace <namespace>`: Provides an alternative way to specify the namespace used in the `set` sub command. If you provide both a namespace argument to `set` and a value for the `-n` flag, the `-n` flag will take precedence.
- `-h|--help`: Display help for the `list` command.

**Usage Example**:
To display the currently configured default namespace, run this command:

```bash
drasi namespace get
```

To change the default namespace to `drasi-demo` run the following command:

```bash
drasi namespace set drasi-demo
```

To list all namespaces that contain Drasi deployments, run the following command:

```bash
drasi namespace list
```

**Output**:
The `namespace get` command simply displays the currently configured default namespace like this:

```
Current namespace: drasi-system
```

The `namespace set <namespace>` command, displays the newly configured default namespace like this:

```
Namespace set to <namespace>
```

The `namespace list` command returns a simple list of Kubernetes namespaces like this:

```
Namespaces:
drasi-demo
drasi-system
```

**Known Issues**: 
- The `namespace` command does not currently enforce any restrictions on namespace names, nor does it validate that the namespace used in the `namespace set` command exist. Ensure that the namespace names used do not conflict with existing namespaces or reserved names.


### drasi secret
**Purpose**: The `secret` command provides a subset of commands for managing secrets in the default secret store of the hosting platform. In the case of Kubernetes, this will be Kubernetes secrets in the `drasi-system` namespace. These can then be referenced when creating Drasi resources, such as Sources or Reactions with confidential connection information. Secret values are stored under keys within a named secret.

#### drasi secret delete
**Purpose**: The `secret delete` command will remove the specified secret from the store.

**Arguments**:
- `name`: Specifies the name of the secret.
- `key`: Specifies the key within the secret.


**Usage Example**:
This command will delete the `Password` key from the `MyDatabase` secret.

```bash
drasi secret delete MyDatabase Password
```

#### drasi secret set
**Purpose**: The `secret set` command will set the specified secret in the store.

**Arguments**:
- `name`: Specifies the name of the secret.
- `key`: Specifies the key within the secret.
- `value` (optional): Specifies the value to set the secret key to.


**Usage Example**:
This command will set the `Password` key in the `MyDatabase` secret to `foo`.

```bash
drasi secret set MyDatabase Password foo
```

The value can also be piped in:

```bash
echo "foo" | drasi secret set MyDatabase Password
```


### drasi tunnel
**Purpose**: The `tunnel` command provides a mechanism to open a local port on your machine that maps to a Drasi Source or Reaction that has an endpoint. For example, the SignalR Reaction exposes an endpoint for clients to connect to, this command can expose that endpoint on your local machine for debugging purposes.

**Arguments**:
- `kind`: The kind of resource to create a tunnel for, this can be `source` or `reaction`
- `name`: The name of the resource to create a tunnel for.
- `port`: The local port to use for the tunnel.

**Usage Example**:
This command will open port 8080 on the local machine and forward it to the endpoint of the Reaction named `my-reaction`.

```bash
drasi tunnel reaction my-reaction 8080
```


### drasi uninstall
**Purpose**: The `uninstall` command removes a Drasi deployment from a Kubernetes cluster by **deleting** the specified namespace, or using the current default namespace if not specified.

**Flags and Arguments**:
- `-d|--uninstall-dapr`: Specifies whether to uninstall DAPR by deleting the DAPR system namespace.
- `-y|--yes`: Automatically respond **yes** to all prompts presented during uninstall.
- `-n|--namespace <namespace>`: Specifies the namespace to be deleted. If not provided, the default namespace configured using the `drasi namespace set` command is used.
- `-h|--help`: Display help for the `uninstall` command.

**Usage Example**:
This command will uninstall Drasi from the current default namespace:

```bash
drasi uninstall
```

By default, the `uninstall` command does not remove DAPR from the Kubernetes cluster.

This command will uninstall Drasi from the `drasi-demo` namespace and remove the DAPR installation:

```bash
drasi uninstall -n drasi-demo -d
```

This command will suppress the prompt that allows you to verify the namespace that will be deleted and proceed as if the user agreed:

```bash
drasi uninstall -y
```

**Output**:
When run without the `-y` flag, the `uninstall` command will prompt you to confirm the deletion of the specified or default namespace with the following message:

```
Are you sure you want to uninstall Drasi from the namespace drasi-system? (yes/no):
```

If you respond **no**, the operation is canceled and nothing is deleted. This is your last change to verify that you want to delete the specified namespace. Once deleted the namespace and the resources it contained are gone and are unrecoverable.

If you agree to the prompt or use the `-y` flag, the `uninstall` command will initially display this message while it deletes the Kubernetes namespace:

```
Namespace is still present. Waiting for it to be deleted
```

Once the operation is complete, you will see this message:

```
Drasi uninstalled successfully
```

**Known Issues**: 
- The `uninstall` command does nothing more than delete a Kubernetes namespace. This is a brute force way of removing Drasi. Any resources, such as databases, that where setup outside the Drasi namespace will not be deleted, and any non Drasi resources created in the Drasi namespace will be deleted. Any deleted resources are unrecoverable and will need to be re-created if deleted accidentally.

### drasi version
**Purpose**: The `version` command returns the version tag of the running Drasi CLI. The version tag of the Drasi CLI is important because it is the version tag the Drasi CLI will use by default when the [init](#drasi-init) command is run and will be the default version tag for the images that are pulled for use in the Drasi deployment.

**Flags and Arguments**:
- `-h|--help`: Display help for the `version` command.

**Usage Example**:
This command will display the version tag associated with the currently executing Drasi CLI:

```bash
drasi version
```

The output of the command will look like this:

```
Drasi CLI version: latest
```


### drasi wait
**Purpose**: The `wait` command waits for one or more resources to become operational, or for a timeout interval to be reached. As mentioned in the [apply command](#drasi-apply) section, the `apply` command returns as soon as a resource definition is validated and registered as part of the Drasi configuration; it returns without confirming that the new resource is successfully deployed and ready without error. That is the purpose of the `wait` command.

**Arguments and Flags**:
- `<resource-type> <resource-id>`: specifies the type and the ID of the resource to wait for.
- `-f|--files <file> <file> <...>`: Specifies one or more YAML files containing the definitions of the resources to wait for. This is a convenience that allows you to use the same YAML file used to create resources to wait for them. Only the resource types and names are used, the rest of the configuration is ignored.
- `-t|--timeout <seconds>`: The number of seconds to wait before timing out and aborting the wait operation. The default value is 60.
- `-n|--namespace <namespace>`: Specifies the namespace where the resources to be waited on are hosted. If not provided, the default namespace configured using the `drasi namespace set` command is used.
- `-h|--help`: Display help for the `delete` command.


**Usage Example**:
The following command waits for a single **Source** resource named **Facilities** from the current default namespace to be ready. It waits a maximum of 60 seconds which is the default timeout:

```
drasi wait source Facilities
```


The following command will wait on **all** the resources defined in the `drasi-resources.yaml` file that are hosted in the `drasi-demo` Kubernetes namespace. It also waits the default timeout of 60 seconds:

```
drasi wait -f drasi-resources.yaml -n drasi-demo
```

The following command will also wait on **all** the resources defined in the `drasi-resources.yaml` file, but it will assume they are in the default namespace and wait for a maximum of 20 seconds before timing out and returning:

```
drasi wait -f drasi-resources.yaml -t 20
```
### drasi watch
**Purpose**: The `watch` command allows users to continuously monitor the result set of a specified query in real-time.

**Arguments and Flags**:
- `query name` : This argument specifies the name of the query to watch.
-  `-n| --namespace <namspace>`:   Specifies the namespace where the resources to be described are hosted. If not provided, the default namespace configured using the `drasi namespace set` command is used.
-  `-h|--help`: Display help for the `watch` command.

**Usage Example**:
The following command will start watching the query result set of a Continuous Query named `inactive-people` in the current default namespace.

```
drasi watch inactive-people
```

**Output**:
When the `watch` command for a query is running, a continuously updated result set table is displayed. Here is an example that shows the result set of the `inactive-people` query.

```
LastMessageTimestamp  | MessageFrom
----------------------+------------
2024-11-12 18:47:03.. | Buzz Lightyear
2024-11-13 15:45:08.. | Brian Kernighan
```
## Drasi CLI Source
The Drasi CLI is written in Go. If you want to explore how the Drasi CLI works, the source code is in the [drasi-platform repo](https://github.com/drasi-project/drasi-platform) in the [cli folder](https://github.com/drasi-project/drasi-platform/tree/main/cli).

The [readme.md](https://github.com/drasi-project/drasi-platform/blob/main/cli/README.md) file in the `cli` folder describes how to build the Drasi CLI from source and install it on your computer.

The definitions of **SourceProviders** installed by default when you run `drasi init` are contained in the [default-source-providers.yaml](https://github.com/drasi-project/drasi-platform/blob/main/cli/service/resources/default-source-providers.yaml) file.

The definitions of **ReactionProviders** installed by default when you run `drasi init` are contained in the [default-reaction-providers.yaml](https://github.com/drasi-project/drasi-platform/blob/main/cli/service/resources/default-reaction-providers.yaml) file.
