const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'GustavoSanz',
  repo: 'Sons_of_Echoes'
});

// Remove qualquer cache que esteja a impedir o teste
autoUpdater.autoDownload = true;


let win; // Declaramos a janela aqui fora para conseguirmos falar com ela depois!

function createWindow () {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        fullscreen: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // OBRIGATÓRIO: Permite que o Phaser "fale" com o Electron
            webSecurity: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();
    

    // O Electron começa a procurar atualizações silenciosamente
    autoUpdater.checkForUpdatesAndNotify();

    // FORÇA O UPDATE PARA TESTES (Apaga esta linha na versão final!)
autoUpdater.allowDowngrade = true;
});

// =========================================================================
// 📡 PONTE DE COMUNICAÇÃO: ELECTRON -> PHASER
// =========================================================================

// 1. Avisa o Phaser que encontrou uma atualização e vai começar a descarregar
autoUpdater.on('update-available', (info) => {
    if (win) win.webContents.send('update-available', info);
});

// 2. Envia os dados do download em tempo real (percentagem, velocidade, etc) para o Phaser animar a barra
autoUpdater.on('download-progress', (progressObj) => {
    if (win) win.webContents.send('download-progress', progressObj);
});

// 3. Avisa o Phaser que o download chegou aos 100%
autoUpdater.on('update-downloaded', (info) => {
    if (win) win.webContents.send('update-downloaded', info);
});

// =========================================================================
// 📡 PONTE DE COMUNICAÇÃO: PHASER -> ELECTRON
// =========================================================================

// Quando a barra no jogo chegar aos 100%, o Phaser manda este sinal para o jogo fechar e instalar sozinho!
ipcMain.on('reiniciar-e-instalar', () => {
    autoUpdater.quitAndInstall();
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});