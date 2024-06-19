function main() {
  try {
    const argvObj = paseArgs();
    console.log('args', argvObj);
    // const heapdump = require('heapdump');
    const v8 = require('v8');
    const path = require('path');
    const dumpPath =
      argvObj.output || path.resolve(__dirname, 'heap.heapsnapshot');
    v8.writeHeapSnapshot(dumpPath);
    // heapdump.writeSnapshot(dumpPath);
  } catch (error) {
    console.error('err', error);
  }
}
main();

function paseArgs() {
  const argvObj = process.argv.slice(2).reduce((acc, arg) => {
    if (arg.startsWith('-')) {
      const [key, value] = arg.split('=');
      acc[key.replace(/(?:^-+|\s+)/g, '')] =
        value === undefined ? true : value.trim();
    } else {
      acc[arg] = true;
    }
    return acc;
  }, Object.create(null));
  process.argvObj = argvObj;
  return argvObj;
}
