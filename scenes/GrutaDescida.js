class SceneGrutaDescida extends Phaser.Scene {
    constructor() { super({ key: 'SceneGrutaDescida' }); }
    
  init(data) {
        this.dadosJogador = data || {};
        // Agora o jogo lê a cor que vem do menu! Se não vier nenhuma, usa a Original por segurança.
        this.minhaCor = data.cor || data.color || this.dadosJogador.cor || 'Original'; 
        this.hasCleiton = data.hasCleiton || false;
    }

    create() {
        let vw = this.cameras.main.width;
        let vh = this.cameras.main.height;
        
        const wMapa = 2800; 
        const hMapa = 4080; 

        this.physics.world.setBounds(0, 0, wMapa, hMapa);
        this.cameras.main.setBounds(0, 0, wMapa, hMapa);

        // Fundos
        this.add.image(0, 0, 'Gruta_Fundo').setOrigin(0, 0).setDepth(0);
        this.add.image(0, 0, 'Gruta_plataformas').setOrigin(0, 0).setDepth(1);

        // ==========================================
        // 🧱 HITBOXES DAS PLATAFORMAS (Estimativas)
        // ==========================================
        this.platforms = this.physics.add.staticGroup();
        
        // Chão de segurança no fundo
        let chaoFisica = this.add.rectangle(wMapa/2, hMapa - 50, wMapa, 100, 0x000, 0); 
        this.physics.add.existing(chaoFisica, true); 
        this.platforms.add(chaoFisica);

        // Lista de plataformas invisíveis [X, Y, LARGURA, ALTURA]
        // Baseado na imagem gruta_plataformas_02.png. Podes ajustar estes valores!
        const hitboxesPlataformas = [
            [1500, 450, 600, 40],  // Topo centro
            [2500, 300, 400, 40],  // Topo direita
            [2000, 1050, 800, 40], // Direita a descer
            [2400, 1400, 400, 40], // Direita ramificação
            [600, 1800, 700, 40],  // Esquerda ramificação 1
            [1500, 2100, 1000, 40], // Plataforma central longa
            [2200, 1850, 500, 40],  // Direita meio
            [600, 2400, 800, 40],   // Esquerda meio
            [1200, 2700, 300, 40],  // Pequena no centro
            [600, 3100, 500, 40],   // Esquerda fundo
            [1200, 3300, 400, 40],  // Pequena centro fundo
            [1800, 3100, 400, 40],  // Pequena direita fundo
            [2200, 3500, 600, 40],  // Direita fundo
            [800, 3600, 600, 40]    // Esquerda quase no fim
        ];

        // Cria as plataformas invisíveis automaticamente
        hitboxesPlataformas.forEach(plat => {
            // O "0" no final significa transparência (invisível)
            let retangulo = this.add.rectangle(plat[0], plat[1], plat[2], plat[3], 0x00ff00, 0);
            this.physics.add.existing(retangulo, true);
            this.platforms.add(retangulo);
        });

        // ==========================================
        // 🗿 ESTÁTUA DE MANA (Com áudio)
        // ==========================================
        if (!this.anims.exists('estatua_fechada')) {
            this.anims.create({ key: 'estatua_fechada', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
            this.anims.create({ key: 'estatua_aberta', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 4, end: 7 }), frameRate: 6, repeat: -1 });
        }

        this.estatua = this.physics.add.sprite(1200, 400, 'estatua_mana').setScale(0.45).setDepth(4.5);
        this.physics.add.collider(this.estatua, this.platforms);
        this.estatua.body.setAllowGravity(false);
        this.estatua.isAvailable = true;
        this.estatua.play('estatua_aberta');
        this.ultimoTickMana = 0;

        // ==========================================
        // 🧙‍♂️ O JOGADOR (ORIN)
        // ==========================================
        this.player = new Player(this, 1400, 200, this.minhaCor);
        this.physics.add.collider(this.player, this.platforms);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        if (this.dadosJogador.vidaAtual !== undefined) this.player.vidaAtual = this.dadosJogador.vidaAtual;
        if (this.dadosJogador.manaAtual !== undefined) this.player.manaAtual = this.dadosJogador.manaAtual;

        this.add.rectangle(0, 0, vw, 150, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
        this.add.rectangle(0, vh, vw, 150, 0x000000).setOrigin(0, 1).setScrollFactor(0).setDepth(90);

        this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        
        this.vidaUI = this.add.sprite(30, 20, 'barravida_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.manaUI = this.add.sprite(30, 110, 'barramana_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.vidaUI.setFrame(this.player.vidaAtual);
        this.manaUI.setFrame(15 - this.player.manaAtual);

        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // ==========================================
        // 🛠️ RADAR DE COORDENADAS (APAGAR DEPOIS)
        // ==========================================
        this.textoCoords = this.add.text(20, 20, 'X: 0 | Y: 0', { 
            fontFamily: 'monospace', 
            fontSize: '24px', 
            fill: '#ffffff', 
            backgroundColor: '#000000' 
        }).setScrollFactor(0).setDepth(2000); // Fica sempre colado ao ecrã

    }

    update(time, delta) {

        // Atualiza o texto com a posição exata do rato no mapa
        let ponteiro = this.input.activePointer;
        if (this.textoCoords) {
            this.textoCoords.setText('X: ' + Math.round(ponteiro.worldX) + ' | Y: ' + Math.round(ponteiro.worldY));
        }


        if (!this.player || !this.player.active) return;
        
        // 🗿 ESTÁTUA DE MANA + ÁUDIO DE FALA
        if (this.estatua && this.estatua.isAvailable) {
            if (Math.abs(this.player.x - this.estatua.x) < 80 && Math.abs(this.player.y - this.estatua.y) < 100 && this.player.cursors.down.isDown) {
                
                // 🔊 Toca o som de fala 1 vez ao interagir!
                if (Phaser.Input.Keyboard.JustDown(this.player.cursors.down)) {
                    this.sound.play('som_txtund'); // Podes trocar para 'som_fala1' se preferires
                }

                if (time > this.ultimoTickMana) {
                    if (this.player.manaAtual < this.player.manaMax) {
                        this.player.manaAtual++;
                        if (this.manaUI) this.manaUI.setFrame(15 - this.player.manaAtual);
                        this.ultimoTickMana = time + 150;
                    }
                    if (this.player.manaAtual >= this.player.manaMax) {
                        this.estatua.isAvailable = false;
                        this.estatua.play('estatua_fechada');
                        
                        this.time.delayedCall(15000, () => {
                            if (this.estatua) {
                                this.estatua.isAvailable = true;
                                this.estatua.play('estatua_aberta');
                            }
                        });
                    }
                }
            }
        }

        let orinBloqueado = (this.player.isDead || this.player.isCasting || this.player.isHurt);
        this.player.updatePlayer(time, orinBloqueado);

        
    }
}