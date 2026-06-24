const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

function iniciarSistemaDeAtualizacao(win) {
   
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'GustavoSanz',
        repo: 'Sons_of_Echoes'
    });
   
    // Tira os avisos automáticos nativos feios, nós gerimos isso!
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowDowngrade = true;

    // Começa a procurar em silêncio
    autoUpdater.checkForUpdatesAndNotify();

    // Feedback no terminal para te ajudar no Debug
    autoUpdater.on('checking-for-update', () => console.log('[Updater] A procurar atualizações...'));
    autoUpdater.on('update-available', () => console.log('[Updater] Nova versão encontrada!'));
    autoUpdater.on('error', (err) => console.error('[Updater] Erro:', err));

    // A MÁGICA VISUAL NATIVA E A PONTE PARA O PHASER
    autoUpdater.on('download-progress', (progressObj) => {
        if (win) {
            win.setProgressBar(progressObj.percent / 100);
            
            // 👉 NOVA LINHA: Envia os dados para a tua cena do Phaser!
            win.webContents.send('atualiza-barra-phaser', progressObj);
        }
    });

    autoUpdater.on('update-downloaded', (info) => {
        if (win) {
            win.setProgressBar(-1);
            
            // 👉 NOVA LINHA: Diz ao Phaser que o download acabou!
            win.webContents.send('atualizacao-concluida');
        }
    });
}
// Exporta a função para ser usada no main.js
module.exports = iniciarSistemaDeAtualizacao;