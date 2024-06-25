const util = require('node:util');
const assert = require('node:assert/strict');
const { appendFile } = require('node:fs/promises');
const argvObj = paseArgs();
argvObj.printLength = parseInt(argvObj.printLength) || 10;
argvObj.platform = argvObj.platform || 'nnk-24h-live';
argvObj.interval = parseInt(argvObj.interval) || 6e4;
console.info('args:', argvObj);
const dayjs = require('dayjs');
const path = require('path');

setInterval(() => {
  main();
}, argvObj.interval);

async function main() {
  try {
    let tasklist = await getTaskList((arr) => 1);

    const toNumber = (str) => Number(String(str || '').replace(/,/g, ''));

    const taskObj = tasklist.reduce((acc, arr) => {
      acc[arr[0]] = (acc[arr[0]] || 0) + toNumber(arr[4]);
      return acc;
    }, Object.create(null));

    tasklist = Object.entries(taskObj)
      ?.sort((arr1, arr2) => toNumber(arr2[1]) - toNumber(arr1[1]))
      .map((arr) => `${arr[0]} ${formatMemory(toNumber(arr[1]) * 1024)}`);

    let exitList = [];
    for (const psName of argvObj.platform.split(',')) {
      const ps = tasklist.find((item) => item.includes(psName));
      if (!ps) {
        exitList.push(psName);
      }
    }

    exitList.length &&
      sendAlert({
        title: `掉线通知`,
        content: [
          [
            {
              tag: 'text',
              text: `时间: ${timestamp()}\n问题描述：${exitList.join(' ')} 掉线`
            }
          ]
        ]
      });
    log('%s', exitList);
    log('ps: %j', tasklist.slice(0, argvObj.printLength));
  } catch (error) {
    console.log(error);
  }
}

function log(...args) {
  const result = `[${timestamp()}]: ${util.format(...args)}`;
  console.log(result);
  appendFile(path.resolve(__dirname, 'ps.log'), result + '\n');
}

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

// 格式化内存大小
function formatMemory(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return `${bytes.toFixed(2)} ${units[unitIndex]}`;
}

async function getTaskList(filter) {
  const exec = util.promisify(require('child_process').exec);
  let result = (await exec('tasklist').catch((err) => err)) || {};
  let { stdout, stderr } = result;
  assert(!stderr && stdout, util.format('tasklist error %s', stderr));
  const psList = stdout
    .split(/\n+/)
    .map((str) => str.split(/\s+/))
    .filter(filter);

  return psList;
}

async function sendAlert(content) {
  const baseURL =
    'https://open.feishu.cn/open-apis/bot/v2/hook/b79a2f5a-f301-48b5-983b-b392eccba811';
  const params = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: content
      }
    }
  };
  const res = await fetch(baseURL, {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

function timestamp() {
  return dayjs().format('YYYY-MM-DD HH:MM:SSS');
}
