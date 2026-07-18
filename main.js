const { app, BrowserWindow, Tray, ipcMain, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let widgetWindow = null;

// Hide from Dock so it behaves purely as a menu bar app
if (process.platform === 'darwin') {
  app.dock.hide();
}

const createTray = () => {
  // Use a base64 22x22 pixel crescent moon template icon (transparent background, black shape)
  // macOS template image will auto-invert in dark mode.
  const base64Icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEDNxzAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAWklEQVQ4y2NgGAWjYBSMglEwCkbBSAMMcXFx/icmJv5PTExkiIuL8x8dn2JkYGBg+M/CwvKfBYlPETAa4lEwCoYVwNDU1PQfGxvLEB8f/58SPZTYPwpGwSgYBYQCABlDE3t812oPAAAAAElFTkSuQmCC';
  
  const icon = nativeImage.createFromDataURL(base64Icon);
  // Set as template image for macOS dark mode support
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('Shalat Dulu - Pengingat Waktu Shalat');

  tray.on('click', () => {
    toggleWindow();
  });
};

const getWindowPosition = () => {
  const windowBounds = mainWindow.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  // Position window vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x, y };
};

const toggleWindow = () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
};

const showWindow = () => {
  const position = getWindowPosition();
  mainWindow.setPosition(position.x, position.y, false);
  mainWindow.show();
  mainWindow.focus();
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 520,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    vibrancy: 'under-window', // Gives the native glass/blur background on macOS
    visualEffectState: 'active', // Keeps vibrancy running even when window is not focused
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Hide the window when it loses focus
  mainWindow.on('blur', () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createTray();
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

// Widget Window Management
const createWidgetWindow = () => {
  if (widgetWindow) return;

  widgetWindow = new BrowserWindow({
    width: 250,
    height: 105,
    frame: false,
    transparent: true,
    resizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  widgetWindow.loadFile('widget.html');

  // Pin widget to desktop wallpaper across Spaces on macOS
  if (process.platform === 'darwin') {
    widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  }

  widgetWindow.on('closed', () => {
    widgetWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('widget-status-changed', false);
    }
  });

  // Notify main window that the widget is now open
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('widget-status-changed', true);
  }
};

const closeWidgetWindow = () => {
  if (widgetWindow) {
    widgetWindow.close();
  }
};

// IPC handlers
ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.on('update-tray-title', (event, title) => {
  if (tray) {
    tray.setTitle(title);
  }
});

ipcMain.on('show-dev-tools', () => {
  if (mainWindow) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
});

ipcMain.on('toggle-widget', (event, makeVisible) => {
  if (makeVisible) {
    createWidgetWindow();
  } else {
    closeWidgetWindow();
  }
});

ipcMain.handle('is-widget-open', () => {
  return widgetWindow !== null;
});
