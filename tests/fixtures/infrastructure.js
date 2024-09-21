const cp = require('child_process');


/**
 * @param {string | undefined} drasiVersion
 */
async function installDrasi(drasiVersion) {  
  await waitForChildProcess(cp.exec(`drasi init ${drasiVersion ? `--version ${drasiVersion}` : ""}`, {
    encoding: 'utf-8'
  }), "install");
}

/**
 * @param {cp.ChildProcess} childProcess
 * @param {string} logPrefix
 */
function waitForChildProcess(childProcess, logPrefix = "") {
  return new Promise((resolve, reject) => {
    childProcess.once("exit", (code) => {
      if (code == 0)
        resolve(null);
      else
        reject(`${logPrefix} ${childProcess.spawnfile} exit code ${code}`);
    });
    childProcess.stdout?.on('data', function(msg){         
      console.info(`${logPrefix} ${childProcess.spawnfile} - ${msg.toString()}`);
    });

    childProcess.stderr?.on('data', function(msg){         
      console.error(`${logPrefix} ${childProcess.spawnfile} - ${msg.toString()}`);
    });
  });
}

exports.installDrasi = installDrasi;
exports.waitForChildProcess = waitForChildProcess;
