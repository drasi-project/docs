---
type: "docs"
title: "Smoke Test a Drasi Installation"
linkTitle: "Smoke Test a Drasi Installation"
weight: 70
description: >
    Learn how to quickly test a Drasi installation
---


### Prerequisites
- [Kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Drasi CLI](/reference/command-line-interface/)
- A Kubernetes cluster with an instance of Drasi deployed

### Deploying the Smoke Test
To deploy the smoke test, execute the following command.

#### If you deployed Drasi to the default `drasi-system` namespace:
{{< tabpane langEqualsHeader=true >}}
{{< tab header="MacOS/VS Code Dev Container" lang="Bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/dev-tools/smoke-tests/smoke-test.sh | /bin/bash
{{< /tab >}}
{{< tab header="Windows PowerShell" lang="Bash" >}}
Invoke-Command -ScriptBlock ([scriptblock]::Create([System.Text.Encoding]::UTF8.GetString((New-Object Net.WebClient).DownloadData('https://raw.githubusercontent.com/drasi-project/drasi-platform/main/dev-tools/smoke-tests/smoke-test.ps1')))) 
{{< /tab >}}
{{< /tabpane >}}

#### If Drasi was deployed to a different namespace:
Replace `<namespace>` with the namespace that you installed Drasi in.
{{< tabpane langEqualsHeader=true >}}
{{< tab header="MacOS/VS Code Dev Container" lang="Bash" >}}
curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/dev-tools/smoke-tests/smoke-test.sh | /bin/bash -s <namespace>
{{< /tab >}}
{{< tab header="Windows PowerShell" lang="Bash" >}}
Invoke-Command -ScriptBlock ([scriptblock]::Create([System.Text.Encoding]::UTF8.GetString((New-Object Net.WebClient).DownloadData('https://raw.githubusercontent.com/drasi-project/drasi-platform/main/dev-tools/smoke-tests/smoke-test.ps1')))) -ArgumentList <namespace>
{{< /tab >}}
{{< /tabpane >}}

### Smoke Test Result
If the smoke test runs successfully, you will see the following final lines of output in the terminal:
```bash
...
Inserting the following entries into the database: '{Id: 5, Name: Item 5, Category: A}'
INSERT 0 1
Retrieving the current result from the debug reaction
Final output:[{"Category":"A","Id":1,"Name":"Item 1"},{"Category":"A","Id":3,"Name":"Item 3"},{"Category":"A","Id":5,"Name":"Item 5"}]
Expected output after the insertion:[{"Category":"A","Id":1,"Name":"Item 1"},{"Category":"A","Id":3,"Name":"Item 3"},{"Category":"A","Id":5,"Name":"Item 5"}]
Smoke test passed!
cleaning up resources...
configmap "test-data-init" deleted
configmap "test-pg-config" deleted
deployment.apps "postgres" deleted
service "postgres" deleted
✓ Delete: Source/smoke-test: complete
✓ Delete: ContinuousQuery/smoke-query: complete
✓ Delete: Reaction/smoke-result-reaction: complete
```
If the smoke test fails, the script will still output the current result set from the result action. Additionally, all deployed resources will remain intact for debugging purposes. You might see the following output:
```bash
...
Inserting the following entries into the database: '{Id: 5, Name: Item 5, Category: A}'
INSERT 0 1
Retrieving the current result from the debug reaction
Final output:[{"Category":"A","Id":1,"Name":"Item 1"},{"Category":"A","Id":3,"Name":"Item 3"}]  # The result set did not update after the insertion
Expected output after the insertion:[{"Category":"A","Id":1,"Name":"Item 1"},{"Category":"A","Id":3,"Name":"Item 3"},{"Category":"A","Id":5,"Name":"Item 5"}]
Smoke test failed
Resources are not deleted. If you wish to clean up everything, run 'curl -s https://raw.githubusercontent.com/drasi-project/drasi-platform/main/dev-tools/smoke-tests/cleanup-smoke-test.sh | bash'
```

### Smoke Test Overview
This smoke test script accomplishes the following tasks:
1. Sets up a PostgreSQL pod in your Kubernetes cluster. The pod will contain one database with the name `smokedb`. The database will contain one table called `Item` with the following entries:
| id |  name  | category |
|----|--------|----------|
|  1 | Item 1 | A        |
|  2 | Item 2 | B        |
|  3 | Item 3 | A        |

1. Deploy a PostgreSQL source, a continuous query and a result reaction to your cluster using the Drasi CLI
   - The PostgreSQL source will point to the PostgreSQL pod that was created in the previous step
   - The continuous query will retrieve all items that in category A. It is defined as follows:
   ```cypher
   MATCH
      (i:Item {category: 'A'})
    RETURN
      i.id as Id,
      i.name as Name,
      i.category as Category
   ```
   - We will use the result reaction to check the current result set
2. After all Drasi resources are deployed, the smoke test will use the result reaction to check the bootstrap data. Ideally, the current result set should contain only two entries:`[{"Category":"A","Id":1,"Name":"Item 1"},{"Category":"A","Id":3,"Name":"Item 3"}]`
3. Insert two entries (`{"Id": 4, "Name": "Item 4", "Category": "B"}` and {"Id": 5, "Name": "Item 5", "Category": "A"}) to the PostgreSQL database. 
4. Verifies the new entries got propagated from the source to the reaction. For the two inserted entries, only the item with an ID of `5` is in category A. As a result, we should expect the final result set to be: `[{"Category":"A","Id":1,"Name":"Item 1"},{"Category":"A","Id":3,"Name":"Item 3"},{"Category":"A","Id":5,"Name":"Item 5"}]`
5. Cleans-up by deleting all of the components