# Automated document tests

This project tests code snippets extracted from the documentation.

## Prerequisites
- Docker
- [Kind](https://kind.sigs.k8s.io/)
- Node
- Build the Drasi CLI and add it to your path

## Running

To deploy a new kind cluster named `drasi-test` and install a fresh drasi instance on it prior to running the tests, use the following command, and set the `DRASI_VERSION` environment variable to the version of Drasi you wish to tests the docs against.

```bash
DRASI_VERSION=0.1.1 npm test
```

If you already have a cluster and Drasi instance that you wish to run the tests on, use the following command:

```bash
npm run test:no-cluster
```

## Tools

To manually recreate a clean test cluster and not run any tests run the following

```bash
node recreate-test-cluster.js
```

