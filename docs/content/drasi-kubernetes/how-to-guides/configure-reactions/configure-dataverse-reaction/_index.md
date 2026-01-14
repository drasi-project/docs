---
type: "docs"
title: "Configure a Dataverse Reaction"
linkTitle: "Configure a Dataverse Reaction"
weight: 30
toc_hide: true
hide_summary: true
description: >
    Learn how to configure a Dataverse Reaction
related:
  tutorials:
    - title: "Getting Started with Drasi"
      url: "/drasi-kubernetes/getting-started/"
  concepts:
    - title: "Reactions"
      url: "/concepts/reactions/"
  howto:
    - title: "Write Continuous Queries"
      url: "/drasi-kubernetes/how-to-guides/write-continuous-queries/"
  reference:
    - title: "CLI Reference"
      url: "/drasi-kubernetes/reference/command-line-interface/"
---

The Dataverse {{< term "Reaction" "reaction" >}} enables entities in Microsoft Dataverse to be added/updated/deleted when a {{< term "Continuous Query" "continuous query" >}} emits changes.

#### Tenant Setup

##### App registration

The Dataverse Reaction authenticates with Dataverse using OAuth, you must first register an application in your Microsoft Entra ID tenant.

Registering your application establishes a trust relationship between your app and the Microsoft identity platform. The trust is unidirectional: your app trusts the Microsoft identity platform, and not the other way around. Once created, the application object cannot be moved between different tenants.

Follow these steps to create the app registration:

1. Sign in to the Microsoft Entra admin center as at least a Cloud Application Administrator.

1. If you have access to multiple tenants, use the Settings icon  in the top menu to switch to the tenant in which you want to register the application from the Directories + subscriptions menu.

1. Browse to Identity > Applications > App registrations and select New registration.

1. Enter a display Name for your application. Users of your application might see the display name when they use the app, for example during sign-in. You can change the display name at any time and multiple app registrations can share the same name. The app registration's automatically generated Application (client) ID, not its display name, uniquely identifies your app within the identity platform.

1. Select Register to complete the initial app registration.

When registration finishes, the Microsoft Entra admin center displays the app registration's Overview pane. You see the Application (client) ID. Also called the client ID, this value uniquely identifies your application in the Microsoft identity platform.

Next, you need to add credentials to the application. Credentials allow your application to authenticate as itself, requiring no interaction from a user at runtime.

1. In the Microsoft Entra admin center, in App registrations, select your application.
1. Select Certificates & secrets > Client secrets > New client secret.
1. Add a description for your client secret.
1. Select an expiration for the secret or specify a custom lifetime.
1. Select Add.
1. Record the secret's value for use in your client application code. This secret value is never displayed again after you leave this page.

For more information see [Use OAuth authentication with Microsoft Dataverse](https://learn.microsoft.com/en-ca/power-apps/developer/data-platform/authenticate-oauth)

##### Create and bind Dataverse user account to the registered app

The first thing you must do is create a custom security role that will define what access and privileges this account will have within the Dataverse organization. More information: [Create or configure a custom security role](https://learn.microsoft.com/en-us/power-platform/admin/database-security#create-or-configure-a-custom-security-role)

After you have created the custom security role, you must create the user account which will use it.

The procedure to create this user is different from creating a licensed user. Use the following steps:

1. Navigate to Settings > Security > Users

1. In the view drop-down, select Application Users.

1. Click New. Then verify that you are using the Application user form.
If you do not see the Application ID, Application ID URI and Azure AD Object ID fields in the form, you must select the Application User form from the list.

1. Add the appropriate values to the fields:
|Field|Value|
|-|-|
|User Name|A name for the user|
|Application ID|The Application ID value for the application registered with Microsoft Entra ID.|
|Full Name|The name of your application.|
|Primary Email|The email address for the user.|

1. Associate the application user with the custom security role you created.

More information: [Manually create a Dataverse application user](https://learn.microsoft.com/en-ca/power-apps/developer/data-platform/authenticate-oauth#manually-create-a-dataverse-application-user)


#### Reaction Configuration

The Dataverse Reaction requires the following configuration settings:

Property|Description|
|-|-|
|endpoint|The API endpoint for the Dataverse environment.  This can be found in the [Power Platform admin center](https://admin.powerplatform.microsoft.com/home), under Environments|
|clientId|The clientId of the app registration|
|secret|The secret under the credentials of the app registration|

In addition, for each query you need to specify how the Dataverse entities are manipulated in response to changes.  This takes the form of a YAML sub-document for each query.  For each query you can specify what happens when results to the query are `added`, `updated` or `deleted`. Under each of these sections you can specify a list of actions.  Each action has a `kind` field of `createEntity`, `updateEntity` or `deleteEntity` and a field called `entityName` which indicates the Dataverse table upon which to operate. All other field names map to the internal field names of the Dataverse table, and can be mapped to values flowing from the query result using an `@` symbol or can be constant values.

For example, the following will create an IoT Alert and a note when a result is added to the query result set, and add corresponding notes if a result is changed or removed.
```yaml
queries:
  query1: |
    added:
      - kind: createEntity
        entityName: msdyn_iotalert
        msdyn_customerasset: '@assetId'
        msdyn_description: '@maintenanceType'
        msdyn_alerttime: '@timestamp'
        msdyn_alerttype: 192350000
      - kind: createEntity
        entityName: cr57_notes
        cr57_assetid: '@assetId'
        cr57_note: 'New alert'        
    updated:
      - kind: createEntity
        entityName: cr57_notes
        cr57_assetid: '@assetId'
        cr57_note: 'Changing alert'        
    deleted:
      - kind: createEntity
        entityName: cr57_notes
        cr57_assetid: '@assetId'
        cr57_note: 'Removing alert'        

```

In addition to these actions you can also attach a `ifNotExists` condition, where the action will only be executed if an entity does not exists that matches the field mapping you provide it.  The following example will only create the new entity if one with the matching asset, description and alert type does not already exist:

```yaml
queries:
  query1: |
    added:
      - kind: createEntity
        entityName: msdyn_iotalert
        msdyn_customerasset: '@assetId'
        msdyn_description: '@maintenanceType'
        msdyn_alerttime: '@timestamp'
        msdyn_alerttype: 192350000

        ifNotExists:
          msdyn_customerasset: '@assetId'
          msdyn_description: '@maintenanceType'
          msdyn_alerttype: 192350000
```

##### Example

It is best practice to store the App secret in a Kubernetes secret.

```bash
kubectl create secret generic credentials --from-literal=my-secret=xxxxxx
```

```yaml
apiVersion: v1
kind: Reaction
name: my-reaction
spec:
  kind: Dataverse
  properties:
    endpoint: https://xxxxx.api.crm4.dynamics.com/
    clientId: 00000000-0000-0000-000000000000
    secret:
      kind: Secret
      name: credentials
      key: my-secret
  queries:
    query1: |
      added:
        - kind: createEntity
          entityName: msdyn_iotalert
          msdyn_customerasset: '@assetId'
          msdyn_description: '@maintenanceType'
          msdyn_alerttime: '@timestamp'
          msdyn_alerttype: 192350000   
  
```

