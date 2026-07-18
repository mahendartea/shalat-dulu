const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  quitApp: () => ipcRenderer.send('quit-app'),
  updateTrayTitle: (title) => ipcRenderer.send('update-tray-title', title),
  showDevTools: () => ipcRenderer.send('show-dev-tools'),
  toggleWidget: (makeVisible) => ipcRenderer.send('toggle-widget', makeVisible),
  isWidgetOpen: () => ipcRenderer.invoke('is-widget-open'),
  onWidgetStatusChanged: (callback) => {
    const subscription = (event, status) => callback(status);
    ipcRenderer.on('widget-status-changed', subscription);
    return () => {
      ipcRenderer.removeListener('widget-status-changed', subscription);
    };
  }
});
