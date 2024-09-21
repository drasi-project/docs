/** @type {import('jest').Config} */
const config = {
  globalSetup: '<rootDir>/fixtures/cluster-setup.js',
  testTimeout: 180000,
  verbose: true,
};

module.exports = config;
