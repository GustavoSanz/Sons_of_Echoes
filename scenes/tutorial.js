class SceneTutorial extends Phaser.Scene {
    constructor() { super({ key: 'SceneTutorial' }); }

    init(data) { 
        this.dadosJogador = data || {}; 
        this.minhaCor = 'Original'; 
    }

    create() {
        let w = this.cameras.main.width;
        let h = this.cameras.main.height;

        this.add.image(w/2, h/2, 'tuto_fundo').setDisplaySize(w, h).setDepth(0);
        this.add.image(w/2, h/2, 'tuto_arvores').setDisplaySize(w, h).setDepth(1);
        this.add.image(w/2, h/2, 'tuto_ponte').setDisplaySize(w, h).setDepth(2);
        this.add.image(w/2, h/2, 'tuto_frente').setDisplaySize(w, h).setDepth(10);

        this.platforms = this.physics.add.staticGroup();
        // 🔥 CHÃO DESCIDO PARA 995 PARA ALINHAR COM A PONTE AZUL
        let chao = this.add.rectangle(w/2, 995, w * 3, 100, 0x000, 0); 
        this.physics.add.existing(chao, true); 
        this.platforms.add(chao);

        this.criarAnimacoesPara('Original');
        this.criarAnimacoesMonstro();
        this.anims.create({ key: 'orbe_animado', frames: this.anims.generateFrameNumbers('orbe_magico', { start: 0, end: 1 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'cleiton_idle_anim', frames: this.anims.generateFrameNumbers('cleiton_idle', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'cleiton_some_anim', frames: this.anims.generateFrameNumbers('cleiton_cura', { start: 0, end: 7 }), frameRate: 15, repeat: 0 });
        this.anims.create({ key: 'estatua_fechada', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'estatua_aberta', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 4, end: 7 }), frameRate: 6, repeat: -1 });

        // 🔥 GRUPO OBRIGATÓRIO PARA A CLASSE Magia.js FUNCIONAR
        this.magiasGroup = this.physics.add.group();

        // 🔥 ORIN CRIADO ATRAVÉS DO PLAYER.JS (Garante que agacha, salta e luta)
        this.player = new Player(this, -150, 700, this.minhaCor);
        this.physics.add.collider(this.player, this.platforms);

        this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.textoInfo = this.add.text(w/2, 250, "", { fontFamily: retroFont, fontSize: '38px', fill: '#ffffff', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20).setAlpha(0);

        // UI BÁSICA
        this.player.manaAtual = 0; // Começa sem mana para ensinar a usar a estátua!

        this.vidaUI = this.add.sprite(30, 20, 'barravida_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100);
        this.vidaUI.setFrame(this.player.vidaAtual);
        this.manaUI = this.add.sprite(30, 110, 'barramana_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100);
        this.manaUI.setFrame(15 - this.player.manaAtual); 

        // UI INVENTÁRIO
        this.isInventarioAberto = false;
        this.hasCleiton = false;
        this.invFechado = this.add.image(w / 2, 1005, 'inv_fechado').setScrollFactor(0).setDepth(2000).setScale(0.6).setInteractive({ useHandCursor: true });
        this.invAberto = this.add.image(w / 2, h / 2, 'inv_aberto').setScrollFactor(0).setDepth(2001).setScale(0.65).setVisible(false).setInteractive({ useHandCursor: true });
        this.iconeCleitonInv = this.add.sprite((w / 2) - 120, (h / 2) + 70, 'cleiton_idle').setDepth(2002).setScale(0.12).setVisible(false).play('cleiton_idle_anim');

        this.toggleInventario = () => {
            if (this.faseTutorial < 3) return; 
            this.isInventarioAberto = !this.isInventarioAberto;
            this.invAberto.setVisible(this.isInventarioAberto);
            this.iconeCleitonInv.setVisible(this.isInventarioAberto && this.hasCleiton);

            if (this.faseTutorial === 3 && this.isInventarioAberto) {
                this.faseTutorial = 4;
                this.textoInfo.setText("Pressiona 'I' para fechar a mochila.");
            } else if (this.faseTutorial === 4 && !this.isInventarioAberto) {
                this.faseTutorial = 5;
                this.textoInfo.setText("Perfeito!");
                this.time.delayedCall(1000, () => this.iniciarFaseEstatua()); 
            }
        };

        this.invFechado.on('pointerdown', this.toggleInventario);
        this.invAberto.on('pointerdown', this.toggleInventario);

        this.faseTutorial = 0; 
        this.progressoMovimento = 0;
        this.ultimoTickMana = 0;
        this.tweenAtivo = true;

        this.player.play('walk_Original');
        this.tweens.add({
            targets: this.player, x: w / 2 - 200, duration: 3500, ease: 'Linear',
            onComplete: () => {
                this.player.play('idle_Original');
                this.tweenAtivo = false;
                this.iniciarFaseMovimento();
            }
        });
    }

    iniciarFaseMovimento() {
        this.faseTutorial = 1;
        this.textoInfo.setText("Usa as SETAS para te moveres (0%)");
        this.tweens.add({ targets: this.textoInfo, alpha: 1, duration: 500 });
    }

    spawnFrutaTutorial() {
        this.faseTutorial = 2;
        this.player.setVelocityX(0);
        this.textoInfo.setText("Atenção! Sofreste um ataque fantasma!");
        
        this.player.receberDano();

        this.time.delayedCall(1500, () => {
            this.textoInfo.setText("Apanha a fruta 'Cleiton' para te curares!");
            
            this.cleitonTuto = this.physics.add.sprite(this.player.x + 350, 850, 'cleiton_idle').setScale(0.15).setDepth(5).play('cleiton_idle_anim');
            this.cleitonTuto.body.setSize(200, 200).setOffset(124, 116).setAllowGravity(false);
            this.tweens.add({ targets: this.cleitonTuto, y: 835, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

            this.physics.add.overlap(this.player, this.cleitonTuto, (jogador, cleiton) => {
                cleiton.body.enable = false;
                
                this.player.vidaAtual = 5;
                this.vidaUI.setFrame(this.player.vidaAtual);
                this.player.setTint(0x00ff00);
                this.time.delayedCall(300, () => { this.player.clearTint(); });
                
                cleiton.play('cleiton_some_anim');
                cleiton.once('animationcomplete', () => { 
                    cleiton.destroy(); 
                    this.textoInfo.setText("Com a vida cheia, os itens vão para a Mochila!");
                    
                    this.time.delayedCall(1500, () => {
                        this.cleitonTuto2 = this.physics.add.sprite(this.player.x + 350, 850, 'cleiton_idle').setScale(0.15).setDepth(5).play('cleiton_idle_anim');
                        this.cleitonTuto2.body.setSize(200, 200).setOffset(124, 116).setAllowGravity(false);
                        this.tweens.add({ targets: this.cleitonTuto2, y: 835, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

                        this.physics.add.overlap(this.player, this.cleitonTuto2, (jogador, cleiton2) => {
                            cleiton2.destroy();
                            this.hasCleiton = true;
                            this.faseTutorial = 3;
                            this.textoInfo.setText("O Cleiton foi guardado! Pressiona 'I' para veres a Mochila.");
                        });
                    });
                });
            });
        });
    }

    iniciarFaseEstatua() {
        this.faseTutorial = 7;
        this.player.manaAtual = 0; 
        this.manaUI.setFrame(15);
        
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.player.setX(400);
            this.player.flipX = false;
            
            this.estatua = this.physics.add.sprite(1200, 780, 'estatua_mana').setScale(0.45).setDepth(4.5);
            this.physics.add.collider(this.estatua, this.platforms);
            this.estatua.body.setAllowGravity(false);
            this.estatua.isAvailable = true;
            this.estatua.play('estatua_aberta');

            this.textoInfo.setText("Sem Mana! Vai até à Estátua e segura a SETA P/ BAIXO.");
            this.cameras.main.fadeIn(1000, 0, 0, 0);
        });
    }

    iniciarFaseAtaque() {
        this.faseTutorial = 5; 
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.player.setX(400);
            this.player.flipX = false;
            if (this.estatua) this.estatua.destroy();
            
            this.monstro = this.physics.add.sprite(1300, 800, 'monstro_chill').setDepth(5);
            this.monstro.setOrigin(0.5, 1); 
            this.physics.add.collider(this.monstro, this.platforms);
            this.monstro.body.setSize(150, 70);
            this.monstro.play('m_chill');
            this.monstro.vida = 3; 

            this.physics.add.overlap(this.magiasGroup, this.monstro, (monstro, orbe) => {
                orbe.destroy();
                monstro.vida--;
                monstro.setTint(0xff0000); 
                this.time.delayedCall(200, () => { if (monstro && monstro.active) monstro.clearTint(); });
                
                if (monstro.vida <= 0) {
                    this.faseTutorial = 99; 
                    monstro.destroy();
                    this.textoInfo.setText("Excelente! Estás pronto para a Floresta das Trevas.");
                    
                    this.time.delayedCall(2000, () => {
                        this.cameras.main.fadeOut(2000, 0, 0, 0);
                        this.cameras.main.once('camerafadeoutcomplete', () => {
                            this.dadosJogador.hasCleiton = this.hasCleiton;
                            this.scene.start('L1', this.dadosJogador);
                        });
                    });
                }
            });

            this.textoInfo.setText("Clica no 'J' para atirares o teu Orbe Mágico!");
            this.faseTutorial = 6;
            this.cameras.main.fadeIn(1000, 0, 0, 0);
        });
    }

    update(time, delta) {
        if (!this.player || !this.player.active) return;

        if (this.monstro && this.monstro.active) {
            this.monstro.body.setSize(150, 70);
            this.monstro.body.setOffset((this.monstro.width - 150) / 2, this.monstro.height - 70);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
            this.toggleInventario();
        }

        if (this.faseTutorial === 7 && this.estatua && this.estatua.isAvailable) {
            if (Math.abs(this.player.x - this.estatua.x) < 80 && this.player.cursors.down.isDown) {
                if (time > this.ultimoTickMana) {
                    this.player.manaAtual++;
                    this.manaUI.setFrame(15 - this.player.manaAtual);
                    this.ultimoTickMana = time + 150;
                }
                if (this.player.manaAtual >= 15) {
                    this.estatua.isAvailable = false;
                    this.estatua.play('estatua_fechada');
                    this.faseTutorial = 8;
                    this.textoInfo.setText("Poder restaurado!");
                    this.time.delayedCall(1500, () => this.iniciarFaseAtaque());
                }
            }
        }

        if (this.faseTutorial === 1) {
            if (this.player.cursors.left.isDown || this.player.cursors.right.isDown) {
                this.progressoMovimento += 0.5; 
                if (this.progressoMovimento > 100) this.progressoMovimento = 100;
                this.textoInfo.setText(`Usa as SETAS para te moveres (${Math.floor(this.progressoMovimento)}%)`);
                if (this.progressoMovimento >= 100) {
                    this.spawnFrutaTutorial();
                }
            }
        }

        let orinBloqueado = (this.isInventarioAberto || this.tweenAtivo || this.faseTutorial === 8 || this.faseTutorial === 99 || this.faseTutorial === 0);

        if (this.isInventarioAberto && !this.player.isDead && this.player.body.touching.down) {
            this.player.setVelocityX(0);
            if (this.player.estadoAtual !== 'idle') this.player.mudarAnimacao('idle');
        }
        
        // A MAGIA VAI FUNCIONAR AGORA (o Player.js já a reconhece!)
        this.player.updatePlayer(time, orinBloqueado);

        // Lógica da Tecla ESC para Pausa (Versão Universal)
        let teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        teclaEsc.on('down', () => {
            if (this.scene.isActive('PauseMenu')) return;

            // Enviamos dinamicamente a "chave" da cena atual para o Pause saber quem somos
            let dadosPausa = { cenaOrigem: this.scene.key };

            if (this.isMultiplayer) { 
                this.scene.launch('PauseMenu', dadosPausa); 
            } else {
                this.scene.pause(this.scene.key); // Pausa a cena atual
                this.scene.launch('PauseMenu', dadosPausa); // Lança o menu
            }
        });
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
        this.anims.create({ key: 'hurt_' + c, frames: this.anims.generateFrameNumbers('hurt_' + c, { start: 0, end: 4 }), frameRate: 10, repeat: 0 });
        
        // 🔥 A CORREÇÃO DE OURO: A chave que o Player.js procura
        this.anims.create({ key: 'magic1_' + c, frames: this.anims.generateFrameNumbers('magic1_' + c, { start: 0, end: 11 }), frameRate: 14, repeat: 0 });
        
        this.anims.create({ key: 'death1_' + c, frames: this.anims.generateFrameNumbers('death1_' + c, { start: 0, end: 7 }), frameRate: 15, repeat: 0 });
        this.anims.create({ key: 'death2_' + c, frames: this.anims.generateFrameNumbers('death2_' + c, { start: 0, end: 7 }), frameRate: 10, repeat: 0 });
    }

    criarAnimacoesMonstro() {
        this.anims.create({ key: 'm_chill', frames: this.anims.generateFrameNumbers('monstro_chill', { start: 0, end: 7 }), frameRate: 8, repeat: -1 });
    }
}