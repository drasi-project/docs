

const yaml = require('js-yaml');
const { applyKubernetes, applyDrasi } = require("../fixtures/deploy-resources");
const { readSnippet } = require('../fixtures/snippet-reader');
const PortForward = require('../fixtures/port-forward');
const SignalrFixture = require("../fixtures/signalr-fixture");
const pg = require('pg');

let signalrFixture = new SignalrFixture(["message-count"]);
let dbPortForward = new PortForward("postgres", 5432);

let dbClient = new pg.Client({
  database: "hello-world",
  host: "127.0.0.1",
  user: "test",
  password: "test",
});

test('YAML snippets', async () => {
  await applyKubernetes(yaml.loadAll(await readSnippet("reference/setup-postgres", "drasi-postgres")));
  await applyDrasi(yaml.loadAll(await readSnippet("solution-developer/getting-started", "hello-world-source")));
  await applyDrasi(yaml.loadAll(await readSnippet("solution-developer/getting-started", "hello-world-queries")));
  await applyDrasi(yaml.loadAll(await readSnippet("solution-developer/getting-started", "hello-world-reaction")));

  await signalrFixture.start();
  dbClient.port = await dbPortForward.start();
  await dbClient.connect();

  let updateCondition = signalrFixture.waitForChange("message-count", 
    change => change.op == "u" && change.payload.after.Message == "Hello World" && change.payload.after.Frequency == 2);

  await dbClient.query(await readSnippet("solution-developer/getting-started", "insert-5"));

  expect(await updateCondition).toBeTruthy();
});

afterAll(async () => {
  await signalrFixture.stop();
  await dbClient.end();
  dbPortForward.stop();
});