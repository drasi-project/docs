---
type: "docs"
title: "Use the Drasi Explorer to test Continuous Queries and manage Drasi instances"
linkTitle: "Manage Drasi and test Continuous Queries with Drasi Explorer"
weight: 20
description: >
   Learn how to test Continuous Queries and manage Drasi instances with the Drasi Explorer
---

# Manage a Drasi environment and test Continuous Queries with the Drasi Explorer

The Drasi Visual Studio Code extension integrates with the Drasi platform, enabling developers to manage Drasi resources as well as test and debug Continuous Queries directly within the editor. This document describes how to install the extension and use the Drasi Explorer that is available as part of the extension. With the Drasi Explorer you can:
•	Manage resources in your Drasi environment.
•	Watch the live results of your Continuous Queries.
•	Debug Continuous Queries prior to creating them on your Drasi environment

### Prerequisites
•	An installation of [Visual Studio Code](https://code.visualstudio.com)

## Installation

The Drasi VS Code extension is available for download and installation from the Visual Studio Marketplace. You can search for the Drasi extension and install it from within VS Code. Bring up the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of VS Code or the View: Extensions command (⇧⌘X for Mac and Ctrl+Shift+X for Windows, Linux).

{{< figure src="DrasiExtetnsion.png" alt="Drasi Extension in the VS Marketplace" >}}

## Usage

Once the extension is installed, the `Drasi Explorer` view will be visible in the Extension view of the VS IDE.

{{< figure src="InstalledDrasiExtetnsion.png" alt="Drasi Extension in VS Code Extension Bar" >}}

## Managing resources with Drasi Explorer

The extension scans your workspace directory for YAML files that contain Drasi resources (Sources, Continuous Queries, and Reactions) and displays them in the Workspace tab.

{{< figure src="InstalledDrasiExtetnsion.png" alt="Drasi Extension in VS Code Extension Bar" >}}

### Applying resources
Resources can be created in your Drasi environment using the Apply option available in the Workspace tab.

{{< figure src="ApplyResource.png" alt="Creating resources in Drasi with the Apply option" >}}

The Drasi Explorer displays the current availability status of resources with visual indicators. For example, the hello-world Source shows as unavailable with a red icon in the picture below.

{{< figure src="ResourceStatus.png" alt="Availabilty status of resources in Drasi with visual indicator" >}}

### Deleting Drasi resources
 The delete capability of the Drasi Explorer allows you to remove resources from the Drasi environment. Click on the “Delete” icon for this.

{{< figure src="DeleteResource.png" alt="Drasi Extension in VS Code Extension Bar" >}}

## Testing Continuous Queries

### Debugging Continuous Queries
Continuous Queries in your workspace can be validated prior to creating them in your environment using the Debug option.

{{< figure src="DebugQuery.png" alt="Drasi Extension in VS Code Extension Bar" >}}

### Attach a Continuous Query 

An important capability of the Drasi Explorer is its ability to attach a deployed query and display real-time updates for it. The result set automatically updates when new data arrives and can be viewed within VS Code in dedicated panel. Choose the Attach option for this.

{{< figure src="AttachQuery.png" alt="Drasi Extension in VS Code Extension Bar" >}}
