---
type: "docs"
title: "Configure an Http Reaction"
linkTitle: "Configure an Http Reaction"
weight: 50
description: >
    Learn how to configure an Http Reaction
---

The Http Reaction enables you to craft HTTP calls that are automatically invoked when query result sets change. This reaction is particularly useful for integrating with external APIs, triggering webhooks, or automating workflows based on data changes.

## Requirements
On the computer from where you will create the Drasi Http Reaction, you need to install the following software:
- [Drasi CLI](/reference/command-line-interface/) 

## Creating the Reaction
To create a Reaction, execute the `drasi apply` command as follows:

```text
drasi apply -f my-reaction.yaml -n drasi-namespace
```

The `drasi apply` command is how you create all new Drasi resources (in this case a Reaction). The `-f` flag specifies that the definition of the new Reaction is contained in the referenced YAML file `my-reaction.yaml` and the `-n` flag specifies the Drasi namespace in which to create the Reaction (Drasi must already be installed in that namespace).

## Reaction Definitions
The YAML file passed to `drasi apply` can contain one or more Reaction definitions. Here is an example of a Drasi Http Reaction definition:

```yaml
kind: Reaction
apiVersion: v1
name: http-reaction
spec:
  kind: Http
  properties:
    baseUrl: "https://api.example.com"
    token: "your-bearer-token"
  queries:
    <query-id>:
      added:
        url: "/webhook/{{after.id}}"
        method: "POST"
        body: |
          {
            "action": "created",
            "data": {
              "field1": "{{after.field1}}",
              "field2": "{{after.field2}}",
              "field3": "{{after.field3}}"
            }
          }
        headers:
          Content-Type: "application/json"
      updated:
        url: "/webhook/{{after.id}}"
        method: "PUT"
        body: |
          {
            "action": "updated",
            "before": {
              "field1": "{{before.field1}}",
              "field2": "{{before.field2}}",
              "field3": "{{before.field3}}"
            },
            "after": {
              "field1": "{{after.field1}}",
              "field2": "{{after.field2}}",
              "field3": "{{after.field3}}"
            }
          }
        headers:
          Content-Type: "application/json"
      deleted:
        url: "/webhook/{{before.id}}"
        method: "DELETE"
```

In this definition: 
- the **apiVersion** must be **v1**.
- the **kind** property tells Drasi to create a **Reaction** resource.
- the **spec.kind** property tells Drasi the kind of Reaction to create, in this case an **Http** Reaction. 
- the **name** property tells Drasi the identity of the Reaction and must be unique within the scope of Reactions within the target Drasi environment. In the above example, the **name** of the Reaction is **http-reaction**.

This table describes the settings in the **spec** section of the Reaction definition:

|Property|Description|
|--- |---|
|`queries`| The list of continuous queries you would like the Http Reaction to listen to and make HTTP calls for.|
|`properties.baseUrl`| The base URL for HTTP requests (e.g., "https://api.github.com").|
|`properties.token`| Optional bearer token for authentication with the target API.|

### Per-Query Configuration
For each query, you can define different actions for the three change types:

|Change Type|Description|
|--- |---|
|`added`| Triggered when items are added to the query result set.|
|`updated`| Triggered when items in the query result set are modified.|
|`deleted`| Triggered when items are removed from the query result set.|

Each change type supports the following properties:

|Property|Description|
|--- |---|
|`url`| Path to append to the baseUrl. Supports handlebars templating with `{{after}}` and `{{before}}` data.|
|`method`| HTTP method to use (GET, POST, PUT, DELETE, etc.).|
|`body`| Request payload. Supports handlebars templating for dynamic content generation.|
|`headers`| Custom HTTP headers to include in the request.|

### Handlebars Templating
The Http Reaction uses handlebars templating for dynamic URL and payload construction:

- `{{after}}` - Contains the new/current state of the data
- `{{before}}` - Contains the previous state of the data (available for `updated` and `deleted` operations)

Example usage:
```yaml
url: "/api/users/{{after.userId}}/notifications"
body: |
  {
    "message": "User {{after.name}} has been updated",
    "timestamp": "{{after.updatedAt}}"
  }
```

## Example: GitHub Integration
Here's a real-world example that creates GitHub issue comments when new data is added:

```yaml
kind: Reaction
apiVersion: v1
name: github-http-reaction
spec:
  kind: Http
  properties:
    baseUrl: "https://api.github.com"
    token: "ghp_your_github_token_here"
  queries:
    issue-comments:
      added:
        url: "/repos/{{after.repo}}/issues/{{after.issue_number}}/comments"
        method: "POST"
        body: |
          {
            "body": "Hello! @{{after.creator}}"
          }
        headers:
          X-GitHub-Api-Version: "2022-11-28"
          Content-Type: "application/json"
```

## Security Considerations
- Store sensitive tokens and credentials securely
- Use HTTPS endpoints whenever possible
- Validate and sanitize data before including it in HTTP requests
- Consider rate limiting and authentication requirements of target APIs

## Inspecting the Reaction
As soon as the Reaction is created it will start running, subscribing to the specified list of Continuous Queries and processing changes to the Continuous Query results.

You can check the status of the Reaction using the `drasi list` command:

```text
drasi list reaction
```

Or including a target namespace:

```text
drasi list reaction -n drasi-namespace
```

This will return a simple list of all Reactions in the default (or specified) namespace and their overall status. For example:

```
        ID               | AVAILABLE
-------------------------+------------
    http-reaction        | true
```

If an error has occurred during the creation or operation of a Reaction, the `AVAILABLE` column will contain the error text instead of `true` or `false`.

For more details about the Reaction you can use the [drasi describe](/reference/command-line-interface#drasi-describe) command:

```text
drasi describe reaction http-reaction
```

This will return the full definition used to create the Reaction along with more detailed status information.

## Modifying the Reaction
If you want to modify an existing reaction, you can use the `drasi apply` command to apply the updated YAML file. Ensure that the name of the reaction remains consistent.

## Deleting the Reaction
To delete a Reaction you use the `drasi delete` command. There are two ways to do this. 

Firstly, you can specify the type of resource (Reaction) and its name, for example:

```text
drasi delete reaction http-reaction
```

Secondly, you can refer to the YAML file(s) that contain the definitions used to create the Reaction(s):

```text
drasi delete -f my-reaction.yaml <file2.yaml> <file3.yaml> <...>
```

This is a convenience, especially if a single YAML file contains multiple Reaction definitions. 

If the Reaction is not in the default Drasi namespace, you should specific the target namespace using the `-n` flag as usual:

```text
drasi delete -f my-reaction.yaml -n drasi-namespace
```