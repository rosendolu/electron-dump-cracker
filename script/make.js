main();
async function main() {
  try {
    const { exec } = require('child_process');
    const fs = require('fs');
    const { glob } = require('glob');
    const path = require('path');

    const modules = glob.sync('modules/**/index.js', {
      cwd: path.join(__dirname, '../'),
      absolute: true
    });
    console.log('modules', modules);

    for (const filePath of modules) {
      const exeName = path.parse(filePath).dir.split(path.sep).slice(-1)[0];
      const outputFileName = `dist/${exeName}`;
      // pkg . --compress GZip --options max_old_space_size=4096
      const command = `npx pkg ${filePath} --compress GZip --options max_old_space_size=4096 --output ${outputFileName}`;
      exec(command, (err, stdout, stderr) => {
        console.log('command: ', command);
        if (err) {
          console.error(`Error packaging ${filePath}:`, err, stderr, stdout);
        } else {
          console.log(
            `Successfully packaged ${filePath}:`,
            err,
            stderr,
            stdout
          );
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}
