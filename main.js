const { app, BrowserWindow } = require('electron');
const path = require('path');

// 1. Start your existing Express backend
require('./server.js');

let mainWindow;

function createWindow() {
  // 2. Configure the traditional desktop window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: "School Management System",
    autoHideMenuBar: true, 
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true
    }
  });

  // 3. Load your Express frontend into the Electron window
  mainWindow.loadURL('http://localhost:5000');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 4. Initialize the app when Electron is ready
app.whenReady().then(() => {
  setTimeout(createWindow, 500); 

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});