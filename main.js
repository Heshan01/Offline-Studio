const { app, BrowserWindow, ipcMain, dialog, shell, desktopCapturer, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

let mainWindow = null;
let pythonProcess = null;

// Register scheme before app ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-media', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true, corsEnabled: true } }
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1050,
    height: 750,
    minWidth: 950,
    minHeight: 650,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#121214',
      symbolColor: '#747d8c',
      height: 40
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    backgroundColor: '#121214',
    show: false,
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[RENDERER CONSOLE] [Level ${level}] ${message} (at ${sourceId}:${line})`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (pythonProcess) {
      pythonProcess.kill();
      pythonProcess = null;
    }
  });
}

app.whenReady().then(() => {
  // Set up custom protocol handler for local video streaming
  protocol.registerFileProtocol('local-media', (request, callback) => {
    console.log('[PROTOCOL] local-media requested:', request.url);
    let filePath = decodeURIComponent(request.url.slice('local-media://'.length));
    console.log('[PROTOCOL] decoded filePath before win32 check:', filePath);
    // On Windows, slice leading slash if present (e.g., /C:/path -> C:/path)
    if (process.platform === 'win32' && filePath.startsWith('/')) {
      filePath = filePath.slice(1);
    }
    console.log('[PROTOCOL] final filePath to serve:', filePath);
    callback({ path: filePath });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: Native File Selector
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'webm', '3gp', 'm4v'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  try {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size // bytes
    };
  } catch (err) {
    console.error('Failed to get file stats:', err);
    return null;
  }
});

// IPC Handler: Native Folder Selector
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// IPC Handler: Check if FFmpeg is installed in PATH
ipcMain.handle('check-ffmpeg', () => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    exec('ffmpeg -version', (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
});

// IPC Handler: Get Screens and Windows for Capturer
ipcMain.handle('get-screen-sources', async () => {
  try {
    const sources = await desktopCapturer.getSources({ 
      types: ['window', 'screen'],
      thumbnailSize: { width: 150, height: 150 }
    });
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnailUrl: source.thumbnail.toDataURL()
    }));
  } catch (err) {
    console.error('Failed to retrieve capturer sources:', err);
    return [];
  }
});

// IPC Handler: Save recorded Media Buffer to Desktop or Custom Path
ipcMain.handle('save-recording', async (event, arrayBuffer, fileName, customPath) => {
  try {
    const buffer = Buffer.from(arrayBuffer);
    const outDir = customPath && customPath.trim() !== '' ? customPath : path.join(os.homedir(), 'Desktop', 'Optimized_Videos');
    fs.mkdirSync(outDir, { recursive: true });
    
    const outputPath = path.join(outDir, fileName);
    fs.writeFileSync(outputPath, buffer);
    
    return { success: true, outputPath };
  } catch (err) {
    console.error('Failed to write recording to disk:', err);
    return { success: false, error: err.message };
  }
});

// IPC Handler: List Exported Videos
ipcMain.handle('get-optimized-videos', async () => {
  try {
    const outDir = path.join(os.homedir(), 'Desktop', 'Optimized_Videos');
    if (!fs.existsSync(outDir)) return [];
    
    const files = fs.readdirSync(outDir);
    const mediaFiles = [];
    
    for (const file of files) {
      if (file.match(/\.(mp4|webm|mkv|avi|mov|mp3|gif)$/i)) {
        const fullPath = path.join(outDir, file);
        const stats = fs.statSync(fullPath);
        mediaFiles.push({
          name: file,
          path: fullPath,
          size: stats.size,
          mtime: stats.mtime.getTime()
        });
      }
    }
    return mediaFiles.sort((a, b) => b.mtime - a.mtime);
  } catch (err) {
    console.error('Failed to list optimized videos:', err);
    return [];
  }
});

// IPC Handler: Get System Stats (CPU, RAM)
ipcMain.handle('get-system-stats', () => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    // Calculate CPU usage simplistic approach
    let totalIdle = 0, totalTick = 0;
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idlePercent = (totalIdle / totalTick) * 100;
    const cpuUsage = (100 - idlePercent).toFixed(1);
    
    return {
      cpuUsage: parseFloat(cpuUsage),
      ramUsagePercent: (((totalMem - freeMem) / totalMem) * 100).toFixed(1),
      freeMemGb: (freeMem / 1024 / 1024 / 1024).toFixed(1)
    };
  } catch (err) {
    return null;
  }
});

let currentOutputPath = null;

// IPC Handler: Stop Compression
ipcMain.on('stop-compression', (event) => {
  if (pythonProcess) {
    try {
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`taskkill /pid ${pythonProcess.pid} /T /F`);
      } else {
        pythonProcess.kill();
      }
    } catch (e) {
      console.error('Failed to kill python process', e);
    }
    pythonProcess = null;

    // Cleanup partial file
    if (currentOutputPath && fs.existsSync(currentOutputPath)) {
      try {
        fs.unlinkSync(currentOutputPath);
      } catch (err) {
        console.error('Failed to delete partial output file', err);
      }
    }
    currentOutputPath = null;

    event.reply('compression-error', 'Compression manually stopped by user.');
  }
});

// IPC Handler: Start Compression with configurations
ipcMain.on('start-compression', (event, filePath, config) => {
  if (pythonProcess) {
    try {
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`taskkill /pid ${pythonProcess.pid} /T /F`);
      } else {
        pythonProcess.kill();
      }
    } catch (e) {
      console.error('Failed to kill previous python process', e);
    }
    pythonProcess = null;
  }

  const isDev = !app.isPackaged;
  let pythonPath = 'python';
  let args = [];

  if (isDev) {
    const scriptPath = path.join(__dirname, 'backend', 'app_engine.py');
    args = [scriptPath, '--input', filePath];
  } else {
    const binaryName = process.platform === 'win32' ? 'app_engine.exe' : 'app_engine';
    const packedPath = path.join(process.resourcesPath, 'backend', 'dist', binaryName);
    const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'backend', 'dist', binaryName);
    const localFallbackPath = path.join(__dirname, 'backend', 'dist', binaryName);

    if (fs.existsSync(unpackedPath)) {
      pythonPath = unpackedPath;
    } else if (fs.existsSync(packedPath)) {
      pythonPath = packedPath;
    } else {
      pythonPath = localFallbackPath;
    }

    args = ['--input', filePath];
  }

  // Forward configuration arguments from React
  if (config) {
    if (config.action) {
      args.push('--action', config.action);
    }
    if (config.mode) {
      args.push('--mode', config.mode);
    }
    if (config.crf !== undefined) {
      args.push('--crf', config.crf.toString());
    }
    if (config.preset) {
      args.push('--preset', config.preset);
    }
    if (config.targetSizeMB !== undefined) {
      args.push('--target-size', config.targetSizeMB.toString());
    }
    if (config.resolution && config.resolution !== 'original') {
      args.push('--resolution', config.resolution);
    }
    if (config.gpu && config.gpu !== 'none') {
      args.push('--gpu', config.gpu);
    }
    if (config.muteAudio) {
      args.push('--mute');
    }
    if (config.startTime) {
      args.push('--start-time', config.startTime);
    }
    if (config.endTime) {
      args.push('--end-time', config.endTime);
    }
    if (config.rotation && config.rotation !== 'none') {
      args.push('--rotation', config.rotation);
    }
    if (config.outputPath) {
      args.push('--output', config.outputPath);
    }
    if (config.outputDir) {
      args.push('--output-dir', config.outputDir);
    }
    if (config.container) {
      args.push('--container', config.container);
    }
    if (config.videoCodec) {
      args.push('--video-codec', config.videoCodec);
    }
    if (config.audioCodec) {
      args.push('--audio-codec', config.audioCodec);
    }
    if (config.filterDeinterlace) {
      args.push('--filter-deinterlace');
    }
    if (config.filterDenoise) {
      args.push('--filter-denoise');
    }
    if (config.filterGrayscale) {
      args.push('--filter-grayscale');
    }
  }

  console.log(`Spawning Python: "${pythonPath}" with args:`, args);

  try {
    pythonProcess = spawn(pythonPath, args);
  } catch (err) {
    event.reply('compression-error', `Failed to start Python process: ${err.message}`);
    return;
  }

  let stdoutBuffer = '';

  pythonProcess.stdout.on('data', (data) => {
    stdoutBuffer += data.toString();
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.status === 'started') {
          currentOutputPath = parsed.output_path;
          event.reply('compression-progress', { 
            percent: 0, 
            status: 'started', 
            outputPath: parsed.output_path,
            file_name: parsed.file_name,
            original_size: parsed.original_size
          });
        } else if (parsed.status === 'duration_parsed') {
          event.reply('compression-progress', { percent: 0, status: 'duration_parsed', durationStr: parsed.duration_str });
        } else if (parsed.status === 'processing') {
          event.reply('compression-progress', { percent: parsed.percent, status: 'processing', timeElapsed: parsed.time_elapsed });
        } else if (parsed.status === 'completed') {
          currentOutputPath = null;
          event.reply('compression-completed', { percent: 100, status: 'completed', outputPath: parsed.output_path, outputSize: parsed.output_size });
        } else if (parsed.status === 'error') {
          event.reply('compression-error', parsed.error);
        }
      } catch (err) {
        console.log(`Python non-JSON stdout: ${line}`);
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data.toString()}`);
  });

  pythonProcess.on('error', (err) => {
    event.reply('compression-error', `Subprocess error: ${err.message}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python subprocess exited with code ${code}`);
    pythonProcess = null;
  });
});

// IPC Handler: Open Folder in Native File Explorer
ipcMain.on('open-output-folder', (event, folderPath) => {
  if (!folderPath) return;
  let targetPath = folderPath;
  try {
    const stat = fs.statSync(folderPath);
    if (stat.isFile()) {
      targetPath = path.dirname(folderPath);
    }
  } catch (err) {
    console.error('Error reading path stats:', err);
  }

  shell.openPath(targetPath)
    .then((errMsg) => {
      if (errMsg) {
        console.error('Failed to open path:', errMsg);
      }
    });
});
