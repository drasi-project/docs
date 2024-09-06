const cp = require('child_process');
const { installDrasi, waitForChildProcess } = require('./infrastructure');

module.exports = async function () {
  console.log("Creating cluster...");
  const drasiVersion = process.env.DRASI_VERSION;

if (drasiVersion) {
  console.log(`Using Drasi version: ${drasiVersion}`);
} else {
  console.warn('No Drasi version specified. Using default form installed CLI.');
}
  await waitForChildProcess(cp.exec(`kind delete cluster --name drasi-test`, { encoding: 'utf-8' }));
  await waitForChildProcess(cp.exec(`kind create cluster --name drasi-test --image kindest/node:v1.25.3`, { encoding: 'utf-8' }));
  
  await installDrasi(drasiVersion);
};