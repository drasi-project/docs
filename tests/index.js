

const yaml = require('js-yaml');
const deployResources = require("./fixtures/deploy-resources");
const { readSnippet } = require('./fixtures/snippet-reader');


async function main() {

    console.log("Deploying resources...");
    let pg = yaml.loadAll(await readSnippet("reference/setup-postgres", "drasi-postgres"));
    console.log(pg);
    await deployResources(pg);

    let source = yaml.loadAll(await readSnippet("solution-developer/getting-started", "hello-world-source"));
    console.log(source);
    await deployResources(source);

    console.log("Resources deployed.");
    

}

main().catch(console.error);