const minidump = require('minidump');
const fs = require('fs');
const path = require('node:path');
const { glob } = require('glob');

main();
async function main() {
  try {
    const symbolPaths = path.join(
      __dirname,
      'electron-v27.0.3-win32-x64-symbols/breakpad_symbols'
    );
    minidump.addSymbolPath(symbolPaths);
    const dumpList = glob.sync('./**/*.dmp', { absolute: true });
    console.log('dumpList', dumpList);
    await Promise.all(
      dumpList.map((dumpFilePath) => {
        return new Promise((resolve, reject) => {
          minidump.walkStack(path.resolve(dumpFilePath), (err, result) => {
            if (err) {
              console.log('err', err);
              reject();
              return;
            }
            const stream = fs.createWriteStream(dumpFilePath + '.txt');
            stream.write(result.toString());
            stream.end();
            stream.on('finish', resolve);
            stream.on('error', reject);
          });
        });
      })
    );
  } catch (error) {
    console.log(error);
  }
}
