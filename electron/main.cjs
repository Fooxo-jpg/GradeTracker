const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    backgroundColor: '#f5f6f8',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = !app.isPackaged && (process.env.VITE_DEV_SERVER_URL || (process.argv.includes('--dev') ? 'http://127.0.0.1:5173' : null));
  const loading = devUrl
    ? win.loadURL(devUrl)
    : win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  loading.catch(error => {
    console.error('Could not load GradeTracker:', error);
    dialog.showErrorBox('GradeTracker could not start', devUrl
      ? 'The development server could not be reached. Start the app with npm run desktop:dev.'
      : 'The built app could not be loaded. Run npm run build, then launch Electron again.');
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
