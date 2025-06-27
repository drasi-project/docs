---
type: "docs"
title: "GitHub bot"
linkTitle: "GitHub bot"
weight: 90
description: >
    Building a GitHub bot with Drasi
---

## Scenario

In this tutorial, we will build a GitHub bot. The bot will monitor issues in a GitHub repository, with the following behaviour:
- When a new issue is opened, it will automatically comment with a thank you message.
- When an issue is closed, it will automatically comment.
- When an issue has not had a comment for x amount of time, it will add a `stale` label to it.
- When a stale issue is commented on, the `stale` label should be removed.

### Tutorial Modes

You can follow along the steps below in a Github codespace, a VSCode Dev Container or your own Kubernetes environment.

{{< tabpane >}}

{{% tab header="Github Codespaces" text=true %}}

The easiest way to follow along with this tutorial is to launch a Github
  Codespace using the link below. This will allow you to run the example
  application within your browser without setting up anything on your own
  machines.

[![Open in Github Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/learning?devcontainer_path=.devcontainer%2Fgithub-bot%2Fdevcontainer.json&machine=standardLinux32gb)

This will open a page with some configuration options. Make sure that the
  **Branch** selected is **main** and set the **Dev Container configuration** to **GitHub bot with Drasi**.

{{% /tab %}}

{{% tab header="VS Code Container" text=true %}}

To follow along with a Dev Container, you will need to install:
- [Visual Studio Code](https://code.visualstudio.com/)
- Visual Studio Code [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 
- [docker](https://www.docker.com/get-started/)

Next, [clone the learning repo from Github](https://github.com/drasi-project/learning),
  and open the repo in VS Code. Make sure that Docker daemon
  (or Docker Desktop) is running.

Once the solution is open in VS Code, follow these steps:
- Press Cmd + Shift + P (on MacOS) or Ctrl + Shift + P (Windows or Linux) to
    launch the command palette.
- Select `Dev Containers: Rebuild and Reopen in Container`.
- Select the `GitHub bot with Drasi` option to launch this tutorial.

{{% /tab %}}

{{% tab header="Local Setup" text=true %}}

You need to have your own Kubernetes cluster setup.
You can use any Kubernetes setup.
For a local testing setup, you can choose one of alternatives
  like Kind, Minikube or k3d.

Make sure that `kubectl` on your system points to your Kubernetes cluster.

You will need [VS Code](https://code.visualstudio.com/)

You will need the [Drasi VS Code extension](https://marketplace.visualstudio.com/items?itemName=DrasiProject.drasi)

{{% /tab %}}

{{% /tabpane %}}



## Prerequisites

To capture the change feed from GitHub, we will use the [GitHub Webhooks](https://docs.github.com/en/webhooks) functionality. These webhooks require a public Http endpoint to receive the changes. To solve this, we will setup a simple Azure Function that will forward the body of the incoming Http message to an EventHub message, and then we will use the EventHub source to connect it to Drasi.

For this tutorial, you will need an Azure account. The setup of the Function and EventHub has been packaged into an ARM template, that can be deployed using the button below:


<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fdanielgerlag%2Fdrasi-learning%2Frefs%2Fheads%2Fgithub-bot%2Ftutorial%2Fgithub-bot%2Fazure-resources.json" target="_blank" rel="noopener">
  <img src="https://aka.ms/deploytoazurebutton" alt="Deploy to Azure">
</a>


After clicking this button, it should take you to the Azure portal to confirm the parameters for the deployment:

{{< figure src="arm-inputs.png" >}}

Click `Review + create` and wait a few minutes while the resources are deployed.

Once the deployment is complete, click on the `Outputs` tab which will provide you with the connection string for the EventHub and the URL of the Function.

{{< figure src="arm-outputs.png" >}}

Copy these values to a notepad, as we will use the Function URL to setup the webhook in the GitHub portal and the EventHub connection string will be used to configure the Drasi source.

## Configure the webhook

Navigate to [GitHub](https://github.com/) and create a new private repository for the purpose of this tutorial.

Once you have created the repository, go to the `Settings` > `Webhooks` page, and create a new webhook.

Paste the Function URL into the `Payload URL` field, and set the `Content type` to `application/json`.

For `Which events would you like to trigger this webhook?`, pick the `Send me everything` option.

{{< figure src="webhook.png" >}}

Click `Add webhook`, this will setup a webhook that will send events occurring in GitHub to the Http endpoint provided.

## Deploy the source

Use the EventHub connection string from the outputs to configure a secret:

```bash
drasi secret set event-hub connection-string "<connection string>"
```

We will use the following source manifest to create a Drasi source that reads the EventHub we just created.

```yaml
kind: Source
apiVersion: v1
name: github
spec:
  kind: EventHub
  properties:
    connectionString: 
      kind: Secret
      name: event-hub
      key: connection-string
    eventHubs:
      - github
```

This can be deployed using the following command:

```
drasi apply -f source.yaml
drasi wait -f source.yaml
```

## Deploy the open issues query

```yaml
kind: ContinuousQuery
apiVersion: v1
name: open-issues
spec:
  mode: query
  sources:
    subscriptions:
      - id: github
        nodes:
          - sourceLabel: github
        pipeline:
          - extract
    middleware:
      - name: extract
        kind: map
        github:
          insert:
            - selector: $.issue
              condition: $[?(@.event == 'issues' && @.action == 'opened')]
              op: Update
              label: Issue
              id: $['$selected'].id
              properties:
                id: $['$selected'].id
                title: $['$selected'].title
                body: $['$selected'].body
                state: $['$selected'].state
                number: $['$selected'].number
                creator: $['$selected'].user.login
                repo: $.repository.full_name
            - selector: $.issue
              condition: $[?(@.event == 'issues' && @.action == 'closed')]
              op: Delete
              label: Issue
              id: $['$selected'].id
              
  query: |
    MATCH 
      (i:Issue)
    RETURN 
      i.id AS id, 
      i.title AS title, 
      i.body AS body, 
      i.state AS state, 
      i.repo AS repo, 
      i.number AS issue_number, 
      i.creator AS creator
```

```bash
drasi apply -f query-open-issues.yaml
```

## Create a GitHub PAT

Go to the `Settings` > `Developer Settings` > `Personal access tokens` > `Fine-grained tokens` page in your GitHub profile.

Click `Generate new token`

For repository access, ensure that it has explicit access to the repository that you created earlier.

For permissions, enable read and write access to `Issues`:

{{< figure src="permissions.png" >}}

Click `Generate token`, and copy the PAT into the following command to create a secret:

```bash
drasi secret set github token "<GitHub PAT>"
```


## Deploy the open issues reaction

```yaml
kind: Reaction
apiVersion: v1
name: my-reaction
spec:
  kind: Http
  properties:
    baseUrl: "https://api.github.com"
    token: 
      kind: Secret
      name: github
      key: token
  queries:
    open-issues: >
      added:
        url: "/repos/{{after.repo}}/issues/{{after.issue_number}}/comments"
        method: "POST"
        body: > 
          {
            "body": "Hello! @{{after.creator}}, thank you for your contribution!!"
          }
      deleted:
        url: "/repos/{{before.repo}}/issues/{{before.issue_number}}/comments"
        method: "POST"
        body: > 
          {
            "body": "This issue has now been closed."
          }
```

```bash
drasi apply -f reaction-open-issues.yaml
```


## Deploy the stale issues query


```yaml
kind: ContinuousQuery
apiVersion: v1
name: stale-issues
spec:
  mode: query
  sources:
    subscriptions:
      - id: github
        nodes:
          - sourceLabel: github
        pipeline:
          - extract
    middleware:
      - name: extract
        kind: map
        github:
          insert:
            - selector: $.issue
              op: Update
              label: Issue
              id: $['$selected'].id
              properties:
                id: $['$selected'].id
                title: $['$selected'].title
                state: $['$selected'].state
                number: $['$selected'].number
                repo: $.repository.full_name
                createdAt: $['$selected'].created_at
            - selector: $.comment
              op: Update
              label: Issue
              id: $.issue.id
              properties:
                lastCommentAt: $['$selected'].created_at
              
  query: |
    MATCH 
      (i:Issue)
    WHERE i.state = 'open'
    AND drasi.trueNowOrLater(
          (datetime(coalesce(i.lastCommentAt, i.createdAt)) + duration({ seconds: 10 })) <= datetime.realtime(), 
          datetime.transaction() + duration({ seconds: 10 })
        )
    RETURN 
      i.id AS id,       
      i.title AS title,
      i.repo AS repo,
      i.number AS issue_number

```

## Deploy the stale issues reaction


```yaml
kind: Reaction
apiVersion: v1
name: stale-reaction
spec:
  kind: Http
  properties:
    baseUrl: "https://api.github.com"
    token: 
      kind: Secret
      name: github
      key: token
  queries:
    stale-issues: >
      added:
        url: "/repos/{{after.repo}}/issues/{{after.issue_number}}/labels"
        method: "POST"
        body: > 
          {
            "labels": ["stale"]
          }
      deleted:
        url: "/repos/{{before.repo}}/issues/{{before.issue_number}}/labels/stale"
        method: "DELETE"
```