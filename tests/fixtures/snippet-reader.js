const cheerio = require('cheerio');
const fs = require('fs');


/**
 * @param {string} path
 * @param {string} id
 */
async function readSnippet(path, id) {
  const content = fs.readFileSync(`../docs/public/${path}/index.html`, 'utf8');
  const doc = cheerio.load(content);
  const codeBlock = doc(`#${id}`).text();
  return codeBlock;
}

module.exports = { readSnippet };