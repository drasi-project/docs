/** @type {import('jest').Config} */
const config = {
  globalSetup: '<rootDir>/fixtures/cluster-setup.js',
  testTimeout: 120000,
  verbose: true,
};

module.exports = config;