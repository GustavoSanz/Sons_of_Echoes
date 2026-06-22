class SceneGrutaExterior extends Phaser.Scene {
    constructor() { super({ key: 'SceneGrutaExterior' }); }

    init(data) {
        this.dadosJogador = data || {};
        this.minhaCor = 'Original';
        this.hasCleiton = data.hasCleiton || false;
    }

    create() {
        let w = this.cameras.main.width;
        let h = this.cameras.main.height;

        this.add.image(w/2, h/2, 'gruta_exterior').setDisplaySize(w, h).setDepth(0);

        this.platforms = this.physics.add.staticGroup();
        let chao = this.add.rectangle(w/2, 980, w, 100, 0x000, 0); 
        this.physics.add.existing(chao, true); 
        this.platforms.add(chao);

        this.magiasGroup = this.physics.add.group();

        this.player = new Player(this, 150, 700, this.minhaCor);
        this.physics.add.collider(this.player, this.platforms);
        
        this.physics.world.setBounds(0, 0, w, h);
        this.player.body.setCollideWorldBounds(true);

        // ==========================================
        // 🎬 BARRAS CINEMÁTICAS (Topo e Fundo)
        // ==========================================
        this.add.rectangle(0, 0, w, 150, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
        this.add.rectangle(0, h, w, 150, 0x000000).setOrigin(0, 1).setScrollFactor(0).setDepth(90);

        // UI
        this.vidaUI = this.add.sprite(30, 20, 'barravida_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.manaUI = this.add.sprite(30, 110, 'barramana_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.vidaUI.setFrame(this.player.vidaAtual);
        this.manaUI.setFrame(15 - this.player.manaAtual);

        this.isInventarioAberto = false;
        this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.invFechado = this.add.image(w / 2, 1005, 'inv_fechado').setScrollFactor(0).setDepth(2000).setScale(0.6).setInteractive({ useHandCursor: true });
        this.invAberto = this.add.image(w / 2, h / 2, 'inv_aberto').setScrollFactor(0).setDepth(2001).setScale(0.65).setVisible(false).setInteractive({ useHandCursor: true });
        this.iconeCleitonInv = this.add.sprite((w / 2) - 120, (h / 2) + 70, 'cleiton_idle').setDepth(2002).setScale(0.12).setVisible(false).play('cleiton_idle_anim');

        this.toggleInventario = () => {
            this.isInventarioAberto = !this.isInventarioAberto;
            this.invAberto.setVisible(this.isInventarioAberto);
            this.iconeCleitonInv.setVisible(this.isInventarioAberto && this.hasCleiton);
        };
        this.invFechado.on('pointerdown', this.toggleInventario);
        this.invAberto.on('pointerdown', this.toggleInventario);

        // PORTA DA GRUTA (CENTRO)
        this.portaGruta = this.add.zone(w / 2, h - 200, 300, 300);
        this.physics.add.existing(this.portaGruta, true);
        this.aMudarDeCena = false;

        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        
        this.textoE = this.add.text(w / 2, h/2 - 50, "[E] Entrar na Gruta", { 
            fontFamily: retroFont, fontSize: '32px', fill: '#ffffff', backgroundColor: '#000000aa', padding: 8 
        }).setOrigin(0.5).setDepth(100).setAlpha(0);

        this.cameras.main.fadeIn(1000, 0, 0, 0);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;
        
        if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
            if (!this.aMudarDeCena) this.toggleInventario();
        }

        let orinBloqueado = (this.player.isDead || this.player.isCasting || this.player.isHurt || this.isInventarioAberto || this.aMudarDeCena);

        if (this.isInventarioAberto && !this.player.isDead && this.player.body.touching.down) {
            this.player.setVelocityX(0);
            if (this.player.estadoAtual !== 'idle') this.player.mudarAnimacao('idle');
        }

        this.player.updatePlayer(time, orinBloqueado);

        this.textoE.setAlpha(0); 
        
        if (!this.aMudarDeCena && this.physics.overlap(this.player, this.portaGruta)) {
            this.textoE.setAlpha(1); 
            
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                this.aMudarDeCena = true;
                this.player.setVelocityX(0);
                if (this.player.estadoAtual !== 'idle') this.player.mudarAnimacao('idle');
                
                this.cameras.main.fadeOut(1500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.dadosJogador.hasCleiton = this.hasCleiton; 
                    this.scene.start('SceneGruta', this.dadosJogador);
                });
            }
        }
    }
}