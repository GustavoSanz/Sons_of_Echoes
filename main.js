const { app, BrowserWindow, ipcMain } = require('electron'); // <-- Olha o 'app' e o 'ipcMain' aqui juntos!
const { autoUpdater } = require('electron-updater');
const iniciarSistemaDeAtualizacao = require('./updater/auto-updater'); // O teu módulo isolado

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        fullscreen: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // OBRIGATÓRIO: Sem isto o Phaser não consegue ouvir o updater!
            webSecurity: false
        }
    });

    win.loadFile('index.html');

    // Liga o motor de atualizações passando a janela para desenhar a barra
    iniciarSistemaDeAtualizacao(win);
}

// Quando o Electron estiver pronto, arranca a janela
app.whenReady().then(createWindow);

// Fecha o programa quando as janelas fecharem
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit(); // Era aqui que o erro rebentava por não encontrar o 'app'
    }
});

// =========================================================
// O "OUVIDO" MÁGICO DO PHASER
// =========================================================
// Quando a barra visual do Phaser chegar aos 100%, ele envia este sinal para fechar tudo e instalar
ipcMain.on('reiniciar-e-instalar', () => {
    console.log('[Main] A receber ordem do Phaser para instalar a atualização!');
    autoUpdater.quitAndInstall();
});