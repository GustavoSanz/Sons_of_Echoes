class Level1 extends Phaser.Scene {
    constructor() { super({ key: 'L1' }); }
    
    init(data) { 
        this.modoJogo = data.modo || 'singleplayer'; 
        this.isSpectatorMode = data.isSpectatorMode || false;
        this.socket = data.socketObj || null; 
        this.meuNomeTexto = data.nome || "Orin";
        this.escalaJogador = 0.85; 
        this.hasCleiton = data.hasCleiton || false;
    }

    create() {
        this.isMultiplayer = (this.modoJogo === 'multiplayer' || this.isSpectatorMode);
        this.outrosJogadores = this.add.group();
        this.minhaCor = 'Original';
        
        this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        this.input.keyboard.addCapture('TAB'); 

        this.nomesDesvaneceram = false;
        this.time.delayedCall(4000, () => { this.nomesDesvaneceram = true; });

        if (this.isMultiplayer && this.socket) {
            this.socket.on('pingServidor', (t) => { this.socket?.emit('pongCalculo', t); });

            this.socket.on('alertaServidor', (msg) => {
                let w = this.cameras.main.width;
                let aviso = this.add.text(w / 2, 80, msg, { fontFamily: retroFont, fontSize: '28px', fill: '#ff4444', backgroundColor: '#000000cc', padding: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(2000);
                this.tweens.add({ targets: aviso, alpha: 0, delay: 3500, duration: 1500, onComplete: () => aviso.destroy() });
            });

            this.socket.on('servidorCheio', () => {
                if (this.player) this.player.isDead = true; 
                this.add.rectangle(1500, 540, 3000, 1080, 0x000000, 0.95).setScrollFactor(0).setDepth(998);
                this.add.text(960, 540, '[ERR-403] SERVIDOR CHEIO\n\nTenta novamente mais tarde.', { fontFamily: retroFont, fontSize: '42px', fill: '#ff0000', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(999);
            });

            this.socket.on('jogadoresAtuais', (js) => {
                Object.keys(js).forEach((id) => { 
                    if (id === this.socket.id && !this.isSpectatorMode) {
                        this.minhaCor = js[id].cor; this.player.x = js[id].x; this.player.setTexture('idle_' + this.minhaCor); this.player.mudarAnimacao('idle');
                    } else { this.adicionarOutroJogador(js[id]); }
                });
            });
            this.socket.on('novoJogador', (i) => { this.adicionarOutroJogador(i); });
            this.socket.on('jogadorDesconectado', (id) => { this.outrosJogadores.getChildren().forEach((o) => { if (o.playerId === id) { if (o.nomeLabel) o.nomeLabel.destroy(); o.destroy(); } }); });
            this.socket.on('removerMortoCompleto', (id) => { this.outrosJogadores.getChildren().forEach((o) => { if (o.playerId === id) { if (o.nomeLabel) o.nomeLabel.destroy(); o.destroy(); } }); });

            this.socket.on('jogadorMovimentado', (info) => {
                this.outrosJogadores.getChildren().forEach((o) => { if (o.playerId === info.id) { this.atualizarFantasma(o, info); } });
            });

            this.socket.on('disconnect', () => {
                if (!this.isSpectatorMode && this.player && !this.player.isDead) {
                    this.player.isDead = true; 
                    this.add.rectangle(1500, 540, 3000, 1080, 0x000000, 0.85).setScrollFactor(0).setDepth(998);
                    this.add.text(960, 540, '[ERR-404] CONEXÃO PERDIDA\n\nFaz refresh (F5) para tentar reconectar.', { fontFamily: retroFont, fontSize: '42px', fill: '#ff0000', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(999);
                }
            });

            this.socket.emit('entrarNoJogo', this.meuNomeTexto);
        }

        this.physics.world.setBounds(0, 0, 6000, 1080);
        this.cameras.main.setBounds(0, 0, 6000, 1080);

        this.bgLayers = [];
        let mapW = 6000;
        
        const addParallaxLayer = (key, speed, depth) => {
            let img = this.textures.get(key).getSourceImage();
            let scaleY = 1080 / img.height; 
            let layer = this.add.tileSprite(0, 0, 1920 / scaleY, img.height, key)
                .setOrigin(0, 0).setScale(scaleY).setScrollFactor(0).setDepth(depth);
            layer.parallaxSpeed = speed;
            this.bgLayers.push(layer);
        };

        addParallaxLayer('bg_1', 0, 0);      
        addParallaxLayer('bg_2', 0.05, 1);   
        addParallaxLayer('bg_3', 0.15, 2);   
        addParallaxLayer('bg_4', 0.3, 3);    
        
        let img6 = this.textures.get('bg_6').getSourceImage();
        let scale6 = 1080 / img6.height;
        this.add.tileSprite(0, 0, mapW / scale6, img6.height, 'bg_6')
            .setOrigin(0, 0).setScale(scale6).setScrollFactor(1).setDepth(4);

        addParallaxLayer('bg_5', 0.5, 10);

        this.add.rectangle(0, 0, 1920, 150, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
        this.add.rectangle(0, 1080, 1920, 150, 0x000000).setOrigin(0, 1).setScrollFactor(0).setDepth(90);

        this.platforms = this.physics.add.staticGroup();
        const g = this.add.rectangle(mapW/2, 980, mapW, 100, 0x555555, 0); 
        this.physics.add.existing(g, true); this.platforms.add(g);
        
        this.magiasGroup = this.physics.add.group(); 
        this.physics.add.collider(this.magiasGroup, this.platforms, (o, p) => { o.destroy(); });

        this.moedasGroup = this.physics.add.group();
        this.physics.add.collider(this.moedasGroup, this.platforms);

        this.grupoCleitons = this.physics.add.group();
        this.physics.add.collider(this.grupoCleitons, this.platforms);

        this.anims.create({ key: 'cleiton_idle_anim', frames: this.anims.generateFrameNumbers('cleiton_idle', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'cleiton_some_anim', frames: this.anims.generateFrameNumbers('cleiton_cura', { start: 0, end: 7 }), frameRate: 15, repeat: 0 });

        this.criarAnimacoesPara('Original'); this.criarAnimacoesPara('Azul'); this.criarAnimacoesPara('Cinzento'); this.criarAnimacoesPara('Preto'); this.criarAnimacoesPara('Roxo'); this.criarAnimacoesPara('Verde'); this.criarAnimacoesPara('Vermelho');
        
        this.anims.create({ key: 'moeda_gira', frames: this.anims.generateFrameNumbers('moeda_sprite', { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'orbe_animado', frames: this.anims.generateFrameNumbers('orbe_magico', { start: 0, end: 1 }), frameRate: 12, repeat: -1 });

        this.portaGruta = this.add.zone(5900, 540, 200, 1080);
        this.physics.add.existing(this.portaGruta, true);
        this.aMudarDeCena = false;

        if (!this.isSpectatorMode) {
            this.player = new Player(this, 400, 700, this.minhaCor);
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.physics.add.collider(this.player, this.platforms); 
            
            if (this.isMultiplayer) {
                this.minhaLabel = this.add.text(this.player.x, this.player.y - 95, this.meuNomeTexto, { fontFamily: retroFont, fontSize: '22px', fill: '#00ff00', backgroundColor: '#000000aa', padding: 4 }).setOrigin(0.5).setDepth(100);
            }

            this.physics.add.overlap(this.player, this.moedasGroup, this.coletarMoeda, null, this);
            this.physics.add.overlap(this.player, this.grupoCleitons, (jogador, cleiton) => { this.curarOrin(cleiton); });
            
            this.physics.add.overlap(this.player, this.portaGruta, () => {
                if (!this.aMudarDeCena && !this.player.isDead) {
                    this.aMudarDeCena = true;
                    this.player.setVelocityX(150); 
                    this.player.mudarAnimacao('walk');
                    
                    this.cameras.main.fadeOut(1500, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        let dadosParaGruta = { modo: this.modoJogo, nome: this.meuNomeTexto, hasCleiton: this.hasCleiton };
                        this.scene.start('SceneGrutaExterior', dadosParaGruta);
                    });
                }
            });

        } else {
            this.add.text(960, 100, '👀 TRANSMISSÃO DE VIGILÂNCIA\nUsa as SETAS para moveres a câmara.', { fontFamily: retroFont, fontSize: '28px', fill: '#00ffff', align: 'center', backgroundColor: '#000000cc', padding: 10 }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
            this.cameras.main.scrollX = 0; this.cameras.main.scrollY = 300;
        }

        if (!this.isMultiplayer) {
            this.spawnMoedaNoMapa(650, 850);
            this.spawnMoedaNoMapa(1250, 850);
            this.spawnMoedaNoMapa(2400, 850);
            this.spawnMoedaNoMapa(3500, 850);
            this.spawnCleiton(2800, 850);
        }

        this.ultimoTickMana = 0; 
        this.pontuacao = 0;
        
        this.cursors = this.input.keyboard.createCursorKeys(); 
        this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.keyH = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H); 

        this.vidaUI = this.add.sprite(30, 20, 'barravida_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.manaUI = this.add.sprite(30, 110, 'barramana_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.iconeMoedaUI = this.add.sprite(1730, 75, 'moeda_sprite').setScale(0.25).setScrollFactor(0).setDepth(100);
        this.iconeMoedaUI.play('moeda_gira');
        this.scoreTexto = this.add.text(1770, 75, 'x ' + this.pontuacao, { fontFamily: retroFont, fontSize: '48px', fill: '#ffffff', stroke: '#000000', strokeThickness: 4}).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100); 

        this.isInventarioAberto = false;
        this.invFechado = this.add.image(1920 / 2, 1005, 'inv_fechado').setScrollFactor(0).setDepth(2000).setScale(0.6).setInteractive({ useHandCursor: true });
        this.invAberto = this.add.image(1920 / 2, 1080 / 2, 'inv_aberto').setScrollFactor(0).setDepth(2001).setScale(0.65).setVisible(false).setInteractive({ useHandCursor: true });
        this.iconeCleitonInv = this.add.sprite((1920 / 2) - 120, (1080 / 2) + 70, 'cleiton_idle').setDepth(2002).setScale(0.12).setVisible(false).play('cleiton_idle_anim');

        this.toggleInventario = () => {
            if (this.aMudarDeCena) return; 
            this.isInventarioAberto = !this.isInventarioAberto;
            this.invAberto.setVisible(this.isInventarioAberto);
            this.iconeCleitonInv.setVisible(this.isInventarioAberto && this.hasCleiton);
        };

        this.invFechado.on('pointerdown', this.toggleInventario);
        this.invAberto.on('pointerdown', this.toggleInventario);

        if(this.isSpectatorMode) { 
            this.vidaUI.setVisible(false); this.manaUI.setVisible(false); this.iconeMoedaUI.setVisible(false); this.scoreTexto.setVisible(false);
            this.invFechado.setVisible(false);
        } else { 
            this.vidaUI.setFrame(this.player.vidaAtual); 
            this.manaUI.setFrame(15 - this.player.manaAtual); 
        }

        // ===============================================
        // O CÓDIGO DA TECLA ESC FICA AQUI DENTRO DO CREATE!
        // ===============================================
        let teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        teclaEsc.on('down', () => {
            if (this.scene.isActive('PauseMenu')) return;

            let dadosPausa = { cenaOrigem: this.scene.key };

            if (this.isMultiplayer) { 
                this.scene.launch('PauseMenu', dadosPausa); 
            } else {
                this.scene.pause(this.scene.key); 
                this.scene.launch('PauseMenu', dadosPausa); 
            }
        });
    }

    spawnCleiton(x, y) {
        let cleiton = this.grupoCleitons.create(x, y, 'cleiton_idle');
        cleiton.setScale(0.15); 
        cleiton.play('cleiton_idle_anim');
        cleiton.setDepth(5);
        cleiton.body.setSize(200, 200); 
        cleiton.body.setOffset(124, 116);
        cleiton.body.setAllowGravity(false); 
        this.tweens.add({ targets: cleiton, y: y - 15, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    curarOrin(cleiton) {
        if (!cleiton.active || this.player.isDead) return;
        cleiton.body.enable = false; 

        if (this.player.vidaAtual < this.player.vidaMax) {
            this.player.vidaAtual++;
            this.vidaUI.setFrame(this.player.vidaAtual);
            this.player.setTint(0x00ff00);
            this.time.delayedCall(300, () => { if (this.player && !this.player.isDead) this.player.clearTint(); });
            
            cleiton.play('cleiton_some_anim');
            cleiton.once('animationcomplete', () => { cleiton.destroy(); });
        } else {
            this.hasCleiton = true;
            if (this.isInventarioAberto) this.iconeCleitonInv.setVisible(true);
            cleiton.destroy(); 
        }
    }

    spawnMoedaNoMapa(x, y) {
        let moeda = this.moedasGroup.create(x, y, 'moeda_sprite');
        moeda.setScale(0.35); 
        moeda.body.setSize(60, 100); 
        moeda.body.setOffset(23, 45);
        moeda.play('moeda_gira');
        moeda.setDepth(5);
        moeda.body.setAllowGravity(false); 
        this.tweens.add({ targets: moeda, y: y - 15, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    coletarMoeda(player, moeda) {
        moeda.destroy();
        this.pontuacao++;
        this.scoreTexto.setText('x ' + this.pontuacao);
        this.tweens.add({ targets: this.iconeMoedaUI, scale: 0.4, duration: 100, yoyo: true });
    }

    criarAnimacoesPara(c) {
        this.anims.create({ key: 'idle_' + c, frames: this.anims.generateFrameNumbers('idle_' + c, { start: 0, end: 11 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'walk_' + c, frames: this.anims.generateFrameNumbers('walk_' + c, { start: 0, end: 7 }), frameRate: 14, repeat: -1 });
        this.anims.create({ key: 'run_' + c, frames: this.anims.generateFrameNumbers('run_' + c, { start: 0, end: 7 }), frameRate: 18, repeat: -1 });
        this.anims.create({ key: 'jump_' + c, frames: this.anims.generateFrameNumbers('jump_' + c, { start: 1, end: 2 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'fall_' + c, frames: this.anims.generateFrameNumbers('jump_' + c, { start: 3, end: 5 }), frameRate: 12, repeat: 0 });
        this.anims.create({ key: 'crouch_' + c, frames: this.anims.generateFrameNumbers('crouch_' + c, { start: 0, end: 3 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'crouch_idle_' + c, frames: this.anims.generateFrameNumbers('crouch_' + c, { start: 3, end: 3 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'stand_up_' + c, frames: this.anims.generateFrameNumbers('crouch_' + c, { start: 3, end: 0 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'walk_crouch_' + c, frames: this.anims.generateFrameNumbers('walk_crouch_' + c, { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'death1_' + c, frames: this.anims.generateFrameNumbers('death1_' + c, { start: 0, end: 7 }), frameRate: 15, repeat: 0 });
        this.anims.create({ key: 'death2_' + c, frames: this.anims.generateFrameNumbers('death2_' + c, { start: 0, end: 7 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'hurt_' + c, frames: this.anims.generateFrameNumbers('hurt_' + c, { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'magic1_' + c, frames: this.anims.generateFrameNumbers('magic1_' + c, { start: 0, end: 11 }), frameRate: 14, repeat: 0 });    
    }

    animacaoEmAndamento(anim, f) {
        if (anim.key.includes('magic1') && f.index === 6) {
            this.atirarMagia();
        }
    }

    atualizarFantasma(f, info) {
        f.setPosition(info.x, info.y); f.flipX = info.flipX;
        if (f.nomeLabel) f.nomeLabel.setPosition(info.x, info.y - 95);

        let animKey = info.animacao + '_' + info.cor;
        if (this.anims.exists(animKey)) {
            if (info.animacao === 'death2') {
                f.play(animKey, true); f.anims.stop(); f.setFrame(7); f.body.setSize(120, 40); f.body.setOffset(40, 150); if (f.nomeLabel) f.nomeLabel.setVisible(false);
            } else {
                if (!f.anims.currentAnim || f.anims.currentAnim.key !== animKey) { f.play(animKey, true); }
                f.body.setSize(50, 140); 
                let isMagic = (info.animacao === 'spell');
                f.setOrigin(isMagic ? (info.flipX ? 0.6114 : 0.3886) : 0.5, isMagic ? 0.522 : 0.5);
                let oD = 50; let oE = 55;
                if (info.animacao === 'walk_crouch') { oD = 100; oE = 105; }
                else if (isMagic) { oD = 50; oE = 98; }
                f.body.setOffset(info.flipX ? oE : oD, 50);
            }
        }
    }

    adicionarOutroJogador(i) {
        if (i.animacao === 'death1') return;
        let b = 'idle_' + i.cor; if (!this.textures.exists(b)) { b = 'idle_Original'; }
        let f = this.add.sprite(i.x, i.y, b); f.playerId = i.id;
        f.setScale(this.escalaJogador); 
        f.setDepth(5); 
        this.physics.add.existing(f); this.physics.add.collider(f, this.platforms); 
        let corNome = (i.nome && i.nome.includes("Misterioso")) ? '#aaaaaa' : '#ffffff';
        f.nomeLabel = this.add.text(i.x, i.y - 95, i.nome || "Orin", { fontFamily: retroFont, fontSize: '20px', fill: corNome, backgroundColor: '#000000aa', padding: 4 }).setOrigin(0.5).setDepth(100);
        this.atualizarFantasma(f, i);
        f.on('animationcomplete', (anim) => { if (anim.key.includes('death1')) { if (f.nomeLabel) f.nomeLabel.destroy(); f.destroy(); } });
        this.outrosJogadores.add(f);
    }

    update(time, delta) {
        let mostrarNomes = (!this.nomesDesvaneceram || this.keyTab.isDown);
        
        if (this.isSpectatorMode) {
            let velSpec = 20;
            if (this.cursors.left.isDown) this.cameras.main.scrollX -= velSpec; else if (this.cursors.right.isDown) this.cameras.main.scrollX += velSpec;
            if (this.cursors.up.isDown) this.cameras.main.scrollY -= velSpec; else if (this.cursors.down.isDown) this.cameras.main.scrollY += velSpec;
            this.outrosJogadores.getChildren().forEach((o) => { if (o.nomeLabel) { o.nomeLabel.setPosition(o.x, o.y - 95); o.nomeLabel.setAlpha(mostrarNomes ? 1 : 0); } });
            
            this.bgLayers.forEach(layer => { layer.tilePositionX = this.cameras.main.scrollX * layer.parallaxSpeed; });
            return; 
        }

        if (!this.player || !this.player.active) return;
        
        this.bgLayers.forEach(layer => { layer.tilePositionX = this.cameras.main.scrollX * layer.parallaxSpeed; });

        if (this.isMultiplayer && this.socket) { this.socket.emit('jogadorMovimento', { x: this.player.x, y: this.player.y, animacao: this.player.estadoAtual, flipX: this.player.flipX, cor: this.minhaCor }); }
        
        if (this.player.isLyingDead) return;

        if (this.minhaLabel) { this.minhaLabel.setPosition(this.player.x, this.player.y - 95); this.minhaLabel.setAlpha(mostrarNomes ? 1 : 0); }
        this.outrosJogadores.getChildren().forEach((o) => { if (o.nomeLabel) { o.nomeLabel.setPosition(o.x, o.y - 95); o.nomeLabel.setAlpha(mostrarNomes ? 1 : 0); } });

        if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
            if (!this.aMudarDeCena) this.toggleInventario();
        }

        // ===============================================
        // A LÓGICA DE BLOQUEIO FICA AQUI DENTRO DO UPDATE
        // ===============================================
        let menuPausaAberto = this.scene.isActive('PauseMenu');
        let orinBloqueado = (this.player.isDead || this.player.isCasting || this.player.isHurt || this.isInventarioAberto || this.aMudarDeCena || menuPausaAberto);

        if (orinBloqueado && !this.player.isDead && this.player.body.touching.down && this.player.body.velocity.x !== 0) {
            this.player.setVelocityX(0);
            if (this.player.estadoAtual !== 'idle') this.player.mudarAnimacao('idle');
        }

        // O MAIS IMPORTANTE: A LINHA QUE APAGASTE VOLTOU! É ELA QUE FAZ O BONECO ANDAR!
        this.player.updatePlayer(time, orinBloqueado);

        if (Phaser.Input.Keyboard.JustDown(this.keyH)) { this.player.receberDano(); }
    }
}