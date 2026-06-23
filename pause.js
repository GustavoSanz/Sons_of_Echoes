class PauseMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseMenu' });
    }

    // 1. Recebe a informação de qual cena abriu o Pause!
    init(data) {
        this.cenaOrigem = data.cenaOrigem || 'L1'; // Guarda o nome da cena (Ex: 'L1', 'SceneGrutaExterior', etc.)
    }

    create() {
        let w = this.cameras.main.width;
        let h = this.cameras.main.height;

        let fundo = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.8).setOrigin(0.5);

        this.add.text(w / 2, h / 2 - 80, 'JOGO PAUSADO', {
            fontFamily: 'retroFont', 
            fontSize: '50px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        let btnVoltar = this.add.text(w / 2, h / 2 + 20, '> Continuar <', {
            fontFamily: 'retroFont',
            fontSize: '30px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setInteractive();

        let btnSair = this.add.text(w / 2, h / 2 + 80, '> Sair das Trevas <', {
            fontFamily: 'retroFont',
            fontSize: '30px',
            fill: '#cc0000'
        }).setOrigin(0.5).setInteractive();

        btnVoltar.on('pointerover', () => btnVoltar.setFill('#ffffff'));
        btnVoltar.on('pointerout', () => btnVoltar.setFill('#aaaaaa'));
        btnSair.on('pointerover', () => btnSair.setFill('#ff0000'));
        btnSair.on('pointerout', () => btnSair.setFill('#cc0000'));

        // --- AÇÕES CORRIGIDAS E UNIVERSAIS ---
        btnVoltar.on('pointerdown', () => {
            // Verifica a cena dinamicamente em vez de usar 'L1'
            if (this.scene.isPaused(this.cenaOrigem)) {
                this.scene.resume(this.cenaOrigem);
            }
            this.scene.stop(); 
        });

        btnSair.on('pointerdown', () => {
            // Vai buscar dinamicamente a cena que está a correr
            let cenaPrincipal = this.scene.get(this.cenaOrigem);

            if (cenaPrincipal.socket) {
                cenaPrincipal.socket.disconnect();
            }

            // Para a cena de origem e volta ao menu!
            this.scene.stop(this.cenaOrigem); 
            this.scene.start('MenuScene'); 
        });
    }
}