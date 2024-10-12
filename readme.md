# Drasi documentation
This repo contains the documentation source for [https://drasi.io](https://drasi.io).
## Contributing
Drasi's documentation follows the [Diataxis framework](https://diataxis.fr/) for its structure and content. Follow the guidance in here to learn how to get started with contributing and creating new documents for Drasi. Please review our [Contributions](https://github.com/drasi-project/docs/blob/preview/CONTRIBUTING.md) guide.
## Pre-requisites
 * [Node.js](https://nodejs.org/en/)
## Framework
The documentation website is generated with the [Hugo](https://gohugo.io/) framework.

### Theme
The [Docsy](https://www.docsy.dev/) theme is used to style the generated site. Refer to the [Docsy authoring guide](https://www.docsy.dev/docs/adding-content/) for helpful tips on creating content for Drasi.

1. Install [Hugo](https://gohugo.io/)
1. Clone the drasi-project/docs repo
2. Change to the docs subfolder

   ``` cd docs/docs```
 
1. From the root of the drasi-project/docs repo, where this readme is located, run ```git submodule update --init --recursive --remote``` to pull Docsy code that is configured as a submodule.
1. Switch to  the Docsy theme folder

   ```docs/themes/docsy``` folder

1. Run the command ```npm install```

## Run local server
Follow these steps to build the docs locally

1. Open a terminal window
1. Ensure that you are in the  ```docs/docs``` folder of the repo
1. Run the command ```hugo server```

The documentation website will be accessible on the URL **http://localhost:1313/**

## Deploying to Azure

The documentation website is hosted on Azure in an App Service called ```project-drasi-docs``` in the ```project-drasi-docs``` Resource Group in the ```Azure Incubations Dev``` subscription.

Currently, we need to manually build and deploy the documentation site. The easiest way to do this is:

1. Open a terminal
1. Change to the ```docs/docs``` folder
1. Run the command ```hugo``` to build the site
1. Use the ```Azure App Service``` Extension for VS Code to publish the ```docs/docs/public``` folder to the ```project-drasi-docs``` App Service.

Once deployed, the documentation site is accessible at the URL [https://project-drasi-docs.azurewebsites.net/](https://project-drasi-docs.azurewebsites.net/).

Access to the site is restricted to people that are members of the [Project Drasi Preview Users](https://ms.portal.azure.com/#view/Microsoft_AAD_IAM/GroupDetailsMenuBlade/~/Overview/groupId/01063f6b-d581-48e5-806a-29d531cba3ff) AD Group.


## Code of Conduct
Please refer to Drasi's [Community Code of Conduct](https://github.com/drasi-project/community/blob/main/CODE_OF_CONDUCT.md).
