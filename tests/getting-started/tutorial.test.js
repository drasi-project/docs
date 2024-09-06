

const yaml = require('js-yaml');
const deployResources = require("../fixtures/deploy-resources");
const { readSnippet } = require('../fixtures/snippet-reader');


test('YAML snippets', async () => {
  let pg = yaml.loadAll(await readSnippet("reference/setup-postgres", "drasi-postgres"));
  await deployResources(pg);

  let source = yaml.loadAll(await readSnippet("solution-developer/getting-started", "hello-world-source"));
  await deployResources(source);

  let queries = yaml.loadAll(await readSnippet("solution-developer/getting-started", "hello-world-queries"));
  await deployResources(queries);

  let reaction = yaml.loadAll(await readSnippet("solution-developer/getting-started", "hello-world-reaction"));
  await deployResources(reaction);
});
