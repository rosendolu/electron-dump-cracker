# electron 异常退出

1. **监听 Electron 应用的关闭事件**：虽然无法直接捕捉到任务管理器强制关闭的事件，但可以监听应用的常规关闭事件。
2. **监控系统的事件日志**：Windows 系统会记录一些系统重启和关机的事件，可以通过监控这些日志来获取相关信息。
3. **使用外部监控工具**：第三方工具可以监控应用的运行状态并记录异常关闭的情况。

### 1. 监听 Electron 应用的关闭事件

在主进程中监听 `window-all-closed` 和 `before-quit` 事件，并记录日志：

```javascript
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

function logMessage(message) {
  const logPath = path.join(app.getPath('userData'), 'app.log');
  const log = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(logPath, log);
}

app.on('window-all-closed', () => {
  logMessage('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  logMessage('Application is quitting');
});

app.on('will-quit', () => {
  logMessage('Application will quit');
});

app.on('quit', () => {
  logMessage('Application quit');
});
```

### 2. 监控系统事件日志

Windows 事件日志可以提供系统重启、关机等信息。你可以定期读取这些日志，并将其与应用的关闭时间进行比对。

```javascript
const { exec } = require('child_process');

function getSystemEvents(callback) {
  exec(
    'wevtutil qe System /q:"*[System[(EventID=1074 or EventID=6006 or EventID=6008)]]" /f:text /c:1',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      callback(stdout);
    }
  );
}

getSystemEvents((events) => {
  logMessage(`System Events: ${events}`);
});
```

- **EventID 1074**: 系统计划重启或关闭。
- **EventID 6006**: 系统停止事件日志服务，表示系统正在关闭。
- **EventID 6008**: 上次系统关闭不正常。

### 3. 使用外部监控工具

使用第三方监控工具（如 Sentry、New Relic、AppDynamics）可以更全面地监控应用的运行状态，并记录异常关闭情况。

#### 使用 Sentry 进行错误和崩溃监控

首先安装 Sentry：

```sh
npm install @sentry/electron
```

然后在主进程和渲染进程中初始化 Sentry：

**主进程 (`main.js`)**：

```javascript
const { app } = require('electron');
const Sentry = require('@sentry/electron/main');

Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });

app.on('ready', () => {
  // Your app code
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  Sentry.captureMessage('Application is quitting');
});

app.on('will-quit', () => {
  Sentry.captureMessage('Application will quit');
});

app.on('quit', () => {
  Sentry.captureMessage('Application quit');
});
```

**渲染进程 (`renderer.js`)**：

```javascript
const Sentry = require('@sentry/electron/renderer');

Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });

// Your renderer process code
```

### 总结

通过监听 Electron 应用的关闭事件、监控 Windows 系统的事件日志、以及使用外部监控工具（如 Sentry），你可以更全面地收集应用被任务管理器强制关闭或者系统重启导致的应用关闭日志。这些方法结合使用可以确保你捕捉到尽可能多的相关信息。
