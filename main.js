const { app, BrowserWindow } = require('electron');
const iniciarSistemaDeAtualizacao = require('./updater/auto-updater'); // Importa o teu módulo limpo!

let win;

function createWindow () {
    win = new BrowserWindow({
        width: 1280,
        height: 720,
        fullscreen: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });

    win.loadFile('index.html');

    // Liga o motor de atualizações passando a janela (para a barra de tarefas funcionar)
    iniciarSistemaDeAtualizacao(win);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});