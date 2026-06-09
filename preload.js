const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  checkFFmpeg: () => ipcRenderer.invoke('check-ffmpeg'),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  getOptimizedVideos: () => ipcRenderer.invoke('get-optimized-videos'),
  saveRecording: (arrayBuffer, fileName, customPath) => ipcRenderer.invoke('save-recording', arrayBuffer, fileName, customPath),
  startCompression: (filePath, config) => ipcRenderer.send('start-compression', filePath, config),
  stopCompression: () => ipcRenderer.send('stop-compression'),
  openOutputFolder: (folderPath) => ipcRenderer.send('open-output-folder', folderPath),
  onCompressionProgress: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('compression-progress', subscription);
    return () => ipcRenderer.removeListener('compression-progress', subscription);
  },
  onCompressionCompleted: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('compression-completed', subscription);
    return () => ipcRenderer.removeListener('compression-completed', subscription);
  },
  onCompressionError: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('compression-error', subscription);
    return () => ipcRenderer.removeListener('compression-error', subscription);
  }
});
