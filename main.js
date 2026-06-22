const { autoUpdater } = require('electron-updater');

function createWindow () {
    // Cria a janela do jogo
    const win = new BrowserWindow({
        width: 1280,       // Resolução inicial
        height: 720,
        fullscreen: false, // Muda para true se quiseres que abra logo em ecrã inteiro
        autoHideMenuBar: true, // Esconde a barra chata de cima (File, Edit, View...)
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Carrega o teu jogo!
    win.loadFile('index.html');

}

// Quando o Electron estiver pronto, abre a janela
app.whenReady().then(createWindow);

autoUpdater.checkForUpdatesAndNotify();


// Fecha o programa totalmente quando fechares a janela
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});