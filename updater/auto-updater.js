const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron'); // Precisamos disto para ouvir o Phaser!

function iniciarSistemaDeAtualizacao(win) {
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'GustavoSanz',
        repo: 'Sons_of_Echoes'
    });

    autoUpdater.autoDownload = true;
    autoUpdater.allowDowngrade = true; // Para testares à vontade com a 1.0.3

    // 1. O MOTOR ESPERA: Só avança quando o Phaser disser "Estou pronto!"
    ipcMain.on('verificar-atualizacoes', () => {
        console.log('[Updater] O Phaser deu ordem! A procurar atualizações...');
        autoUpdater.checkForUpdatesAndNotify();
    });

    // 2. Envia os dados da barra
    autoUpdater.on('download-progress', (progressObj) => {
        if (win) {
            win.setProgressBar(progressObj.percent / 100);
            win.webContents.send('atualiza-barra-phaser', progressObj);
        }
    });

    // 3. Avisa que terminou
    autoUpdater.on('update-downloaded', () => {
        if (win) {
            win.setProgressBar(-1);
            win.webContents.send('atualizacao-concluida');
        }
    });
}

module.exports = iniciarSistemaDeAtualizacao;