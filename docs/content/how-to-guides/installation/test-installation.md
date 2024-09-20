---
type: "docs"
title: "Test a Drasi Installation"
linkTitle: "Test a Drasi Installation"
weight: 50
description: >
    Learn how to quickly test a Drasi installlation to make sure it is working correctly
---

### Prerequisites
- [Helm](https://helm.sh/docs/intro/install/)
- [Kubectl](https://kubernetes.io/docs/tasks/tools/)
- Drasi CLI

Execute the following command (if you deployed Drasi to a namespace other than the default value of `drasi-system`, replace `drasi-system` in the following commands with the name of your namespace):
{{< tabpane langEqualsHeader=true >}}
{{< tab header="MacOS/VS Code Dev Container" lang="Bash" >}}
bash <(curl -s https://drasi.blob.core.windows.net/smoke-tests/setup-smoke-test.sh drasi-system)
{{< /tab >}}
{{< tab header="Windows Powershell" lang="Bash" >}}
Invoke-Command -ScriptBlock ([scriptblock]::Create([System.Text.Encoding]::UTF8.GetString((New-Object Net.WebClient).DownloadData('https://drasi.blob.core.windows.net/smoke-tests/setup-smoke-test.ps1')))) -ArgumentList 'drasi-system'
{{< /tab >}}
{{< /tabpane >}}

This shell script accomplishes the following tasks:
1. Sets up a PostgreSQL database in your Kubernetes cluster
2. Adds the following entries to your database
| id |  name  | category |
|----|--------|----------|
|  1 | Item 1 | A        |
|  2 | Item 2 | B        |
|  3 | Item 3 | A        |

1. Deploy a PostgreSQL source, a continuous query and a reaction to your cluster using the Drasi CLI
2. Verifies the initial bootstrap
3. Adds a new entry ({"Id": 4, "Name": "Item 4", "Category": "A"}) to the PostgreSQL database
4. Verifies the new entries got propagated from the source to the reaction
5. Cleans-up by deleting all of the components