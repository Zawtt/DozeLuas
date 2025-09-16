const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  salvarFicha: (data) => ipcRenderer.invoke('salvar-ficha', data),
  carregarFicha: () => ipcRenderer.invoke('carregar-ficha'),
  carregarImagem: () => ipcRenderer.invoke('carregar-imagem'),
});