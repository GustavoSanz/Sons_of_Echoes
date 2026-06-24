const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

function createWindow () {
    // Cria a janela do jogo
    const win = new BrowserWindow({
        width: 1280,       // Resolução inicial
        height: 720,
        fullscreen: false, // Muda para true se quiseres que abra logo em ecrã inteiro
        autoHideMenuBar: true, // Esconde a barra chata de cima (File, Edit, View...)
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false
        }
    });

    // Carrega o teu jogo!
    win.loadFile('index.html');

}

// Quando o Electron estiver pronto, abre a janela
app.whenReady().then(createWindow);

autoUpdater.checkForUpdatesAndNotify();

// ==========================================
// SISTEMA DE AVISO DE ATUALIZAÇÕES
// ==========================================
autoUpdater.on('update-downloaded', (info) => {
    const dialogOpts = {
        type: 'info',
        buttons: ['Reiniciar e Atualizar', 'Mais Tarde'],
        title: 'Nova Versão Disponível!',
        message: `Uma nova versão do Sons of Echoes (v${info.version}) acabou de ser descarregada.`,
        detail: 'Recomendamos que reinicies o jogo agora para aplicar a atualização.'
    };

    // Mostra o pop-up nativo do Windows/Linux
    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
            // Se o jogador clicar no primeiro botão ("Reiniciar e Atualizar"), o jogo fecha e instala
            autoUpdater.quitAndInstall();
        }
    });
});


// Fecha o programa totalmente quando fechares a janela
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});