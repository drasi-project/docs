# Documentation WebSite
The documentation website, located in the ```docs/docs``` folder is created with the [Hugo](https://gohugo.io/) framework using the [Docsy](https://www.docsy.dev/) theme as described in the Azure Incubations [internal project setup documentation](https://dev.azure.com/azure-octo/Incubations/_wiki/wikis/Incubations.wiki/171/Project-Website).

## Requirements

1. Install [Hugo](https://gohugo.io/)
1. Run ```git submodule update --init --recursive``` to pull Docsy code that is configured as a submodule.
1. In the ```docs/docs/themes/docsy``` folder, run the command ```npm i```

## Running Locally
To run the documentation website locally:

1. Open a terminal
1. Change to the ```docs/docs``` folder
1. Run the command ```hugo server```

The documentaiton website will be accessible on the URL http://localhost:1313/

## Deploying to Azure

The documentation website is hosted on Azure in an App Service called ```project-drasi-docs``` in the ```project-drasi-docs``` Resource Group in the ```Azure Incubations Dev``` subscription.

Currently, we need to manually build and deploy the documentation site. The easiest way to do this is:

1. Open a terminal
1. Change to the ```docs/docs``` folder
1. Run the command ```hugo``` to build the site
1. Use the ```Azure App Service``` Extension for VS Code to publish the ```docs/docs/public``` folder to the ```project-drasi-docs``` App Service.

Once deployed, the documentation site is accessible at the URL [https://project-drasi-docs.azurewebsites.net/](https://project-drasi-docs.azurewebsites.net/).

Access to the site is restricted to people that are members of the [Project Drasi Preview Users](https://ms.portal.azure.com/#view/Microsoft_AAD_IAM/GroupDetailsMenuBlade/~/Overview/groupId/01063f6b-d581-48e5-806a-29d531cba3ff) AD Group.

