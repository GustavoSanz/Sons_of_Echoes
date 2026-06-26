class SceneGruta extends Phaser.Scene {
    constructor() { super({ key: 'SceneGruta' }); }
    
  init(data) {
        this.dadosJogador = data || {};
        // Agora o jogo lê a cor que vem do menu! Se não vier nenhuma, usa a Original por segurança.
        this.minhaCor = data.cor || data.color || this.dadosJogador.cor || 'Original'; 
        this.hasCleiton = data.hasCleiton || false;
    }

    create() {
        let vw = this.cameras.main.width;
        let vh = this.cameras.main.height;
        const wMapa = 3000; 

        this.physics.world.setBounds(0, 0, wMapa, 1080);
        this.cameras.main.setBounds(0, 0, wMapa, 1080);

        let fundoVideo = this.add.video(0, 0, 'Gruta_Dentro').setOrigin(0, 0).setDepth(0);
        fundoVideo.play(true); 
        
        this.add.image(0, 0, 'gruta_chao').setOrigin(0, 0).setDepth(1);
        
        this.platforms = this.physics.add.staticGroup();
        let chaoFisica = this.add.rectangle(wMapa/2, 980, wMapa, 100, 0x000, 0); 
        this.physics.add.existing(chaoFisica, true); 
        this.platforms.add(chaoFisica);

        this.magiasGroup = this.physics.add.group();
        this.grupoFlechas = this.physics.add.group();

        this.criarAnimacoesMonstro();

        // ==========================================
        // 🗿 A ESTÁTUA DE MANA (Com Cooldown)
        // ==========================================
        if (!this.anims.exists('estatua_fechada')) {
            this.anims.create({ key: 'estatua_fechada', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
            this.anims.create({ key: 'estatua_aberta', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 4, end: 7 }), frameRate: 6, repeat: -1 });
        }

        this.estatua = this.physics.add.sprite(300, 980, 'estatua_mana').setOrigin(0.5, 1).setScale(0.45).setDepth(4.5);
        this.physics.add.collider(this.estatua, this.platforms);
        this.estatua.body.setAllowGravity(false);
        this.estatua.isAvailable = true;
        this.estatua.play('estatua_aberta');
        this.ultimoTickMana = 0;

        // ==========================================
        // 🧙‍♂️ O JOGADOR (ORIN)
        // ==========================================
        this.player = new Player(this, 200, 850, this.minhaCor);
        this.playerCollider = this.physics.add.collider(this.player, this.platforms); 
        this.terramotoAtivo = false;
        
        if (this.dadosJogador.vidaAtual !== undefined) this.player.vidaAtual = this.dadosJogador.vidaAtual;
        if (this.dadosJogador.manaAtual !== undefined) this.player.manaAtual = this.dadosJogador.manaAtual;

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.add.image(0, 0, 'gruta_frente').setOrigin(0, 0).setDepth(10);
        let luzes = this.add.image(0, 0, 'gruta_luzes').setOrigin(0, 0).setDepth(15);
        luzes.setAlpha(0.6);
        luzes.setBlendMode(Phaser.BlendModes.ADD); 

        this.add.rectangle(0, 0, vw, 150, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
        this.add.rectangle(0, vh, vw, 150, 0x000000).setOrigin(0, 1).setScrollFactor(0).setDepth(90);

        this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

        this.vidaUI = this.add.sprite(30, 20, 'barravida_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.manaUI = this.add.sprite(30, 110, 'barramana_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.vidaUI.setFrame(this.player.vidaAtual);
        this.manaUI.setFrame(15 - this.player.manaAtual);
        
        this.isInventarioAberto = false;
        this.invFechado = this.add.image(vw / 2, 1005, 'inv_fechado').setScrollFactor(0).setDepth(2000).setScale(0.6).setInteractive({ useHandCursor: true });
        this.invAberto = this.add.image(vw / 2, vh / 2, 'inv_aberto').setScrollFactor(0).setDepth(2001).setScale(0.65).setVisible(false).setInteractive({ useHandCursor: true });
        this.iconeCleitonInv = this.add.sprite((vw / 2) - 120, (vh / 2) + 70, 'cleiton_idle').setDepth(2002).setScale(0.12).setVisible(false).setScrollFactor(0);
        this.iconeCleitonInv.play('cleiton_idle_anim');

        this.toggleInventario = () => {
            if (this.terramotoAtivo) return; 
            this.isInventarioAberto = !this.isInventarioAberto;
            this.invAberto.setVisible(this.isInventarioAberto);
            this.iconeCleitonInv.setVisible(this.isInventarioAberto && this.hasCleiton);
        };
        this.invFechado.on('pointerdown', this.toggleInventario);
        this.invAberto.on('pointerdown', this.toggleInventario);

        this.input.keyboard.on('keydown-U', () => {
            if (this.hasCleiton && this.player.vidaAtual < this.player.vidaMax && !this.player.isDead && !this.terramotoAtivo) {
                this.hasCleiton = false;
                this.player.vidaAtual = this.player.vidaMax;
                this.vidaUI.setFrame(this.player.vidaAtual);
                this.player.setTint(0x00ff00);
                this.time.delayedCall(300, () => { this.player.clearTint(); });
                if (this.isInventarioAberto) this.iconeCleitonInv.setVisible(false);
            }
        });

        // ==========================================
        // 👹 O EXÉRCITO DE KLEBINHOS
        // ==========================================
        this.listaKlebinhos = [];
        let posicoesX = [1600, 2100, 2600]; // Posições onde os 3 vão nascer
        
        posicoesX.forEach((xPos) => {
            let kleb = this.physics.add.sprite(xPos, 800, 'klebinho_idle');
            kleb.setOrigin(0.5, 1).setScale(1).setDepth(5).setCollideWorldBounds(true);   
            this.physics.add.collider(kleb, this.platforms); 
            kleb.body.setSize(30, 60).setOffset((kleb.width - 30) / 2, kleb.height - 60); 
            kleb.play('klebinho_idle');
            kleb.podeAtacar = true;
            kleb.direcao = -1;
            kleb.vida = 3;
            
            this.listaKlebinhos.push(kleb);

            // Dano com as magias
            this.physics.add.overlap(this.magiasGroup, kleb, (k, orbe) => {
                orbe.destroy(); k.vida--; k.setTint(0xff0000);
                this.time.delayedCall(200, () => { if (k.active) k.clearTint(); });
                if (k.vida <= 0) { 
                    k.destroy(); 
                    this.verificarTerramoto(); 
                }
            });
        });

        this.atirarFlecha = (kleb) => {
            if (!kleb.podeAtacar || this.player.isDead || !kleb.active || this.terramotoAtivo) return;
            kleb.podeAtacar = false; 
            kleb.setVelocityX(0); 
            kleb.play('klebinho_attack');
            kleb.body.setOffset((kleb.width - 30) / 2, kleb.height - 60); 

            kleb.once('animationcomplete-klebinho_attack', () => {
                let flecha = this.grupoFlechas.create(kleb.x, kleb.y - 35, 'klebinho_flecha');
                flecha.setScale(0.3).setDepth(6).body.allowGravity = false; 
                flecha.flipX = (kleb.direcao === -1); 
                flecha.body.setSize(180, 40).setOffset(48, 84);
                flecha.setVelocityX(600 * kleb.direcao);
                flecha.play('flecha_voa');

                flecha.destruirFlecha = () => {
                    flecha.setVelocity(0, 0); flecha.body.enable = false; flecha.play('flecha_some'); 
                    flecha.once('animationcomplete', () => { flecha.destroy(); });
                };

                this.time.delayedCall(1500, () => { if (flecha.active) flecha.destruirFlecha(); });
                kleb.play('klebinho_idle');
                kleb.body.setOffset((kleb.width - 30) / 2, kleb.height - 60); 
                this.time.delayedCall(3000, () => { if(kleb.active) kleb.podeAtacar = true; });
            });
        };
       
        this.physics.add.overlap(this.player, this.grupoFlechas, (jogador, flecha) => {
            if (!this.terramotoAtivo) { this.player.receberDano(); flecha.destruirFlecha(); }
        });

       // ==========================================
        // 🌍 LÓGICA DO TERRAMOTO
        // ==========================================
        this.verificarTerramoto = () => {
            let todosMortos = this.listaKlebinhos.every(k => k.vida <= 0 || !k.active);
            
            if (todosMortos && !this.terramotoAtivo) {
                this.terramotoAtivo = true;
                
                // Treme o ecrã e dá o estouro sonoro!
                this.cameras.main.shake(2500, 0.015);
                this.sound.play('som_impacto'); 
                
                this.time.delayedCall(1000, () => {
                    this.playerCollider.destroy(); 
                    this.player.setVelocityY(-200); 
                    this.player.mudarAnimacao('fall'); 
                    
                    this.time.delayedCall(1200, () => {
                        // O ecrã escurece completamente
                        this.cameras.main.fadeOut(1500, 0, 0, 0); 
                        
                       this.cameras.main.once('camerafadeoutcomplete', () => {
                            // Adeus "Brevemente", olá Descida!
                            // Passamos os dados do jogador para a próxima cena
                            this.scene.start('SceneGrutaDescida', {
                                vidaAtual: this.player.vidaAtual,
                                manaAtual: this.player.manaAtual,
                                cor: this.minhaCor,
                                hasCleiton: this.hasCleiton
                            });
                        });
                    });
                });
            }
        };

        this.cameras.main.fadeIn(1500, 0, 0, 0);
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;
        
        if (Phaser.Input.Keyboard.JustDown(this.keyI)) { this.toggleInventario(); }

        // ==========================================
        // 🗿 ESTÁTUA DE MANA COM COOLDOWN
        // ==========================================
        if (this.estatua && this.estatua.isAvailable && !this.terramotoAtivo) {
            if (Math.abs(this.player.x - this.estatua.x) < 80 && this.player.cursors.down.isDown) {
                if (time > this.ultimoTickMana) {
                    if (this.player.manaAtual < this.player.manaMax) {
                        this.player.manaAtual++;
                        if (this.manaUI) this.manaUI.setFrame(15 - this.player.manaAtual);
                        this.ultimoTickMana = time + 150;
                    }
                    if (this.player.manaAtual >= this.player.manaMax) {
                        // Desliga a estátua
                        this.estatua.isAvailable = false;
                        this.estatua.play('estatua_fechada');
                        
                        // 🔥 COOLDOWN: Passados 15 Segundos, volta a ficar disponível!
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

        let orinBloqueado = (this.player.isDead || this.player.isCasting || this.player.isHurt || this.isInventarioAberto || this.terramotoAtivo);

        if (this.isInventarioAberto && !this.player.isDead && this.player.body.touching.down) {
            this.player.setVelocityX(0);
            if (this.player.estadoAtual !== 'idle') this.player.mudarAnimacao('idle');
        }

        this.player.updatePlayer(time, orinBloqueado);

        // ==========================================
        // 🤖 COMPORTAMENTO DOS KLEBINHOS EM MASSA
        // ==========================================
        this.listaKlebinhos.forEach(klebinho => {
            if (klebinho && klebinho.active && this.player && !this.player.isDead && !this.terramotoAtivo) {
                let distanciaX = this.player.x - klebinho.x;
                klebinho.direcao = (distanciaX < 0) ? -1 : 1;
                klebinho.flipX = (klebinho.direcao === -1);
                
                if (Math.abs(distanciaX) < 600 && klebinho.podeAtacar) { 
                    this.atirarFlecha(klebinho); 
                } 
                else if (klebinho.podeAtacar && Math.abs(distanciaX) >= 600 && Math.abs(distanciaX) < 1000) { 
                    klebinho.setVelocityX(150 * klebinho.direcao); 
                    if (klebinho.anims.currentAnim && klebinho.anims.currentAnim.key !== 'klebinho_walk') { klebinho.play('klebinho_walk', true); } 
                    klebinho.body.setOffset((klebinho.width - 30) / 2, klebinho.height - 60); 
                } 
                else if (klebinho.podeAtacar) { 
                    klebinho.setVelocityX(0); 
                    if (klebinho.anims.currentAnim && klebinho.anims.currentAnim.key !== 'klebinho_idle') { klebinho.play('klebinho_idle', true); } 
                    klebinho.body.setOffset((klebinho.width - 30) / 2, klebinho.height - 60); 
                }
            }
        });
        
      
    }

    criarAnimacoesMonstro() {
        if (!this.anims.exists('cleiton_idle_anim')) { this.anims.create({ key: 'cleiton_idle_anim', frames: this.anims.generateFrameNumbers('cleiton_idle', { start: 0, end: 7 }), frameRate: 10, repeat: -1 }); }
        if (!this.anims.exists('cleiton_some_anim')) { this.anims.create({ key: 'cleiton_some_anim', frames: this.anims.generateFrameNumbers('cleiton_cura', { start: 0, end: 7 }), frameRate: 15, repeat: 0 }); }
        if (!this.anims.exists('klebinho_idle')) { this.anims.create({ key: 'klebinho_idle', frames: this.anims.generateFrameNumbers('klebinho_idle', { start: 0, end: 2 }), frameRate: 6, repeat: -1 }); }
        if (!this.anims.exists('klebinho_walk')) { this.anims.create({ key: 'klebinho_walk', frames: this.anims.generateFrameNumbers('klebinho_walk', { start: 0, end: 14 }), frameRate: 12, repeat: -1 }); }
        if (!this.anims.exists('klebinho_attack')) { this.anims.create({ key: 'klebinho_attack', frames: this.anims.generateFrameNumbers('klebinho_attack', { start: 0, end: 17 }), frameRate: 15, repeat: 0 }); }
        if (!this.anims.exists('flecha_voa')) { this.anims.create({ key: 'flecha_voa', frames: this.anims.generateFrameNumbers('klebinho_flecha', { start: 0, end: 3 }), frameRate: 12, repeat: -1 }); }
        if (!this.anims.exists('flecha_some')) { this.anims.create({ key: 'flecha_some', frames: this.anims.generateFrameNumbers('klebinho_flecha', { start: 4, end: 7 }), frameRate: 15, repeat: 0 }); }
        if (!this.anims.exists('orbe_animado')) { this.anims.create({ key: 'orbe_animado', frames: this.anims.generateFrameNumbers('orbe_magico', { start: 0, end: 1 }), frameRate: 12, repeat: -1 }); }
    }
}