# Drasi documentation
This repo contains the documentation source for [https://drasi.io](https://drasi.io).

## Contributing
Follow the guidance in this file to learn how to contribute to Drasi's documentation. 

Please review our [Contributions](https://github.com/drasi-project/docs/blob/preview/CONTRIBUTING.md) guide prior to making contributions.

Drasi's documentation follows the [Diataxis framework](https://diataxis.fr/) for its structure and content. 

The documentation website is generated with the [Hugo](https://gohugo.io/) framework.

The documentation website uses the [Docsy](https://www.docsy.dev/) theme. Refer to the [Docsy authoring guide](https://www.docsy.dev/docs/adding-content/) for helpful tips on creating content.

## Building the docs
You can use the pre-configured dev container for this repository in Visual Studio Code or GitHub Codespaces.

[![Launch in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/drasi-project/docs)

Alternatively, you can follow the instructions below to setup and run a local Hugo server to edit and view your changes.

### Pre-requisites
 * [Node.js](https://nodejs.org/en/)

### Setup Hugo and Docsy

1. Install [Hugo](https://gohugo.io/)
1. Clone the [drasi-project/docs](https://github.com/drasi-project/docs) repo
1. The Docsy theme is configured as a submodule which needs to be pulled. From the root of the drasi-project/docs repo (where this readme is located) run: 

    ```git submodule update --init --recursive --remote``` 

1. Switch to  the Docsy theme folder:

   ```cd docs/themes/docsy```

1. Build the Docsy theme by running:

     ```npm install```

### Run the Hugo server
1. Ensure you are in the  ```docs``` folder of the drasi-project/docs repo.
1. Run the command:

     ```hugo server --disableFastRender```

### Browse the documentation
The documentation website will be accessible on the URL **http://localhost:1313/**

## Code of Conduct
Please refer to Drasi's [Community Code of Conduct](https://github.com/drasi-project/community/blob/main/CODE_OF_CONDUCT.md).