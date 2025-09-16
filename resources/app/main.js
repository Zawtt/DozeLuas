const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 1100,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

ipcMain.handle('salvar-ficha', async (event, data) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Salvar Ficha de Personagem',
    defaultPath: path.join(os.homedir(), 'Desktop', 'personagem.json'),
    filters: [{ name: 'JSON Files', extensions: ['json'] }]
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false };
});

ipcMain.handle('carregar-ficha', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Carregar Ficha de Personagem',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePaths && filePaths.length > 0) {
        try {
            const data = fs.readFileSync(filePaths[0], 'utf-8');
            return { success: true, data: JSON.parse(data) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    return { success: false };
});

ipcMain.handle('carregar-imagem', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        title: 'Escolha um Retrato',
        properties: ['openFile'],
        filters: [{ name: 'Imagens', extensions: ['jpg', 'png', 'gif', 'jpeg'] }]
    });

    if (filePaths && filePaths.length > 0) {
        return { success: true, filePath: filePaths[0] };
    }
    return { success: false };
});

app.whenReady().then(() => {
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