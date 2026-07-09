const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // O Electron vai carregar a página direto do servidor de desenvolvimento do Vite!
  win.loadURL('http://localhost:5173');
  
  // Força o Electron a ignorar qualquer política de bloqueio de autoplay de áudio
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
