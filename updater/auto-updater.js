const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

function iniciarSistemaDeAtualizacao(win) {
    // Tira os avisos automáticos nativos feios, nós gerimos isso!
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    // Começa a procurar em silêncio
    autoUpdater.checkForUpdatesAndNotify();

    // Feedback no terminal para te ajudar no Debug
    autoUpdater.on('checking-for-update', () => console.log('[Updater] A procurar atualizações...'));
    autoUpdater.on('update-available', () => console.log('[Updater] Nova versão encontrada!'));
    autoUpdater.on('error', (err) => console.error('[Updater] Erro:', err));

    // A MÁGICA VISUAL NATIVA: Preenche a barra verde no ícone da barra de tarefas do Windows!
    autoUpdater.on('download-progress', (progressObj) => {
        if (win) {
            // O Electron recebe de 0 a 100, mas o Windows precisa de 0.0 a 1.0
            win.setProgressBar(progressObj.percent / 100);
        }
    });

    // Quando o download terminar, remove a barra do ícone e mostra o aviso final
    autoUpdater.on('update-downloaded', (info) => {
        if (win) win.setProgressBar(-1); // -1 limpa a barra de carregamento do ícone

        dialog.showMessageBox(win, {
            type: 'info',
            buttons: ['Reiniciar e Instalar', 'Mais Tarde'],
            title: 'Sons of Echoes - Atualização',
            message: `A magia foi concluída! A versão v${info.version} está pronta.`,
            detail: 'O jogo precisa de ser reiniciado para aplicar a atualização.'
        }).then((resultado) => {
            if (resultado.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
}

// Exporta a função para ser usada no main.js
module.exports = iniciarSistemaDeAtualizacao;