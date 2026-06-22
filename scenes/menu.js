class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    init(data) {
        this.mensagemErro = data.erro || null;
    }
    
    create() {
        let w = this.cameras.main.width;
        let h = this.cameras.main.height;
        
        // Fundo animado
        this.anims.create({
            key: 'menu_idle',
            frames: this.anims.generateFrameNumbers('menu_bg_anim', { start: 0, end: 13 }),
            frameRate: 10,
            repeat: -1
        });
        let bgMenu = this.add.sprite(w / 2, h / 2, 'menu_bg_anim').setDisplaySize(w, h);
        bgMenu.play('menu_idle');

        // Animação do Título
        this.anims.create({
            key: 'play_titulo',
            frames: this.anims.generateFrameNumbers('titulo_animado', { start: 0, end: 14 }),
            frameRate: 12,
            repeat: 0
        });

        this.elementosMenu = [];

        // ==========================================
        // 🛡️ CAMADA DE INTERAÇÃO DO BROWSER
        // ==========================================
        this.peliculaInicio = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 1.0); // Fundo totalmente preto para esconder o menu
        this.peliculaInicio.setOrigin(0.5);
        this.peliculaInicio.setDepth(2000);
        this.peliculaInicio.setInteractive();

        this.textoInicio = this.add.text(w / 2, h / 2, 'Clica para entrar nas Trevas...', {
            fontFamily: retroFont,
            fontSize: '48px',
            fill: '#ffffff'
        });
        this.textoInicio.setOrigin(0.5);
        this.textoInicio.setDepth(2001);

        this.prepararRestoDoMenu(w, h);

        // 🎬 LÓGICA NOVA: Clicar despoleta o Vídeo da Frase, e só depois o Menu!
        this.peliculaInicio.on('pointerdown', () => {
            this.peliculaInicio.disableInteractive(); // Impede duplo clique

            this.tweens.add({
                targets: this.textoInicio,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    this.textoInicio.destroy();

                   // Arranca o vídeo da Frase
                    let videoIntro = this.add.video(w / 2, h / 2, 'intro_video').setOrigin(0.5).setDepth(2500);
                    
                    // 🔥 Esperamos o vídeo começar a tocar para forçar a escala!
                    // Isto garante que o vídeo já carregou e o Phaser não dá erro.
                    videoIntro.on('playing', () => {
                        videoIntro.setDisplaySize(w, h);
                    });

                    videoIntro.play();

                    // Permite ao jogador saltar a intro com um clique no ecrã
                    let podeSaltar = true;
                    this.input.once('pointerdown', () => {
                        if (podeSaltar && videoIntro && videoIntro.isPlaying()) {
                            videoIntro.stop();
                            videoIntro.emit('complete');
                        }
                    });

                    // Quando o vídeo acabar, destrói a película e revela o Menu
                    videoIntro.once('complete', () => {
                        podeSaltar = false;
                        videoIntro.destroy();
                        
                        this.tweens.add({
                            targets: this.peliculaInicio,
                            alpha: 0,
                            duration: 800,
                            onComplete: () => {
                                this.peliculaInicio.destroy();
                            }
                        });

                        this.iniciarAudioMenu();
                        this.dispararFadeDoTitulo();
                    });
                }
            });
        });

        // ==========================================
        // 🦇 SISTEMA DE SOM ALEATÓRIO E GERIDO
        // ==========================================
        this.eventoMonstros = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                let sonsBichos = ['grunhido1', 'grunhido2'];
                let somEscolhido = Phaser.Utils.Array.GetRandom(sonsBichos);
                let posicaoAudio = Phaser.Math.FloatBetween(-0.9, 0.9);

                this.sound.play(somEscolhido, {
                    volume: 0.4,
                    rate: Phaser.Math.FloatBetween(0.6, 0.85),
                    pan: posicaoAudio
                });

                this.eventoMonstros.delay = Phaser.Math.Between(6000, 16000);
            }
        });
    }

    iniciarAudioMenu() {
        if (!this.sound.get('musica_menu')) {
            this.menuBGM = this.sound.add('musica_menu', { loop: true, volume: 0.6 });
            this.menuBGM.play({ seek: 70 });
        } else if (!this.sound.get('musica_menu').isPlaying) {
            this.sound.get('musica_menu').play({ seek: 70 });
        }

        if (!this.sound.get('som_noite')) {
            this.noiteBGM = this.sound.add('som_noite', { loop: true, volume: 0.25 });
            this.noiteBGM.play();
        } else if (!this.sound.get('som_noite').isPlaying) {
            this.sound.get('som_noite').play();
        }
    }

    dispararFadeDoTitulo() {
        let logoTitle = this.add.sprite(480, 220, 'titulo_animado');
        logoTitle.setOrigin(0.5);
        logoTitle.setDepth(10);
        logoTitle.setScale(1.8);
        logoTitle.setAlpha(0);

        let alvosFade = [logoTitle, ...this.elementosMenu];

        this.tweens.add({
            targets: alvosFade,
            alpha: 1,
            duration: 1200,
            ease: 'Linear'
        });

        logoTitle.play('play_titulo');
    }

    // 🎬 LÓGICA DE TRANSIÇÃO ORIGINAL E LIMPA
    iniciarTransitionJogo(cenaDestino, dadosPassados) {
        if (this.eventoMonstros) this.eventoMonstros.remove(); 
        this.sound.stopByKey('grunhido1'); 
        this.sound.stopByKey('grunhido2');

        let musica = this.sound.get('musica_menu');
        let somNoite = this.sound.get('som_noite');

        if (musica) {
            this.tweens.add({
                targets: musica,
                volume: 0,
                duration: 400,
                onComplete: () => {
                    musica.setSeek(245);
                    this.tweens.add({ targets: musica, volume: 0.7, duration: 2500, ease: 'Sine.easeInOut' });
                }
            });
        }

        if (somNoite) {
            this.tweens.add({ targets: somNoite, volume: 0, duration: 4000 });
        }

        this.cameras.main.fadeOut(4000, 0, 0, 0);

        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (musica) musica.stop();
            if (somNoite) somNoite.stop();
            this.scene.start(cenaDestino, dadosPassados);
        });
    }

    prepararRestoDoMenu(w, h) {
        this.nomeJogador = localStorage.getItem('orin_nickname');
        // 🔥 CORREÇÃO PARA O ELECTRON: O window.prompt não funciona em aplicações Desktop
        if (!this.nomeJogador) {
            this.nomeJogador = "Orin_" + Math.floor(Math.random() * 999);
            localStorage.setItem('orin_nickname', this.nomeJogador);
        }

        if (this.mensagemErro) {
            let caixaErro = this.add.rectangle(w / 2, h / 2 - 120, 800, 100, 0xff0000, 0.7).setOrigin(0.5).setStrokeStyle(2, 0xffffff);
            let textoErro = this.add.text(w / 2, h / 2 - 120, this.mensagemErro, {
                fontFamily: retroFont,
                fontSize: '26px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            
            caixaErro.setAlpha(0);
            textoErro.setAlpha(0);
            this.elementosMenu.push(caixaErro, textoErro);
        }

        // ==========================================================================
        // 🔘 BOTÃO 1: "NEW GAME" (Y: 430)
        // ==========================================================================
        this.anims.create({ key: 'hover_new_game', frames: this.anims.generateFrameNumbers('btn_new_game', { start: 0, end: 10 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_new_game', frames: this.anims.generateFrameNumbers('btn_new_game_click', { start: 0, end: 10 }), frameRate: 15, repeat: 0 });

        let btnNewGame = this.add.sprite(480, 430, 'btn_new_game');
        btnNewGame.setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0); 
        this.elementosMenu.push(btnNewGame);
        
        btnNewGame.on('pointerover', () => { if (btnNewGame.texture.key === 'btn_new_game') btnNewGame.play('hover_new_game'); });
        btnNewGame.on('pointerout', () => { if (btnNewGame.texture.key === 'btn_new_game') { btnNewGame.anims.stop(); btnNewGame.setFrame(0); } });
        btnNewGame.on('pointerdown', () => {
            if (btnNewGame.texture.key === 'btn_new_game_click') return;
            btnNewGame.setTexture('btn_new_game_click');
            btnNewGame.play('click_new_game');
            
            this.iniciarTransitionJogo('SceneAndar', { modo: 'singleplayer', nome: this.nomeJogador }, true);
        });

        // ==========================================================================
        // 🔘 BOTÃO 2: "CONTINUE" (Y: 510)
        // ==========================================================================
        this.anims.create({ key: 'hover_continue', frames: this.anims.generateFrameNumbers('btn_continue', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_continue', frames: this.anims.generateFrameNumbers('btn_continue_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnContinue = this.add.sprite(480, 510, 'btn_continue');
        btnContinue.setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnContinue);
        
        btnContinue.on('pointerover', () => { if (btnContinue.texture.key === 'btn_continue') btnContinue.play('hover_continue'); });
        btnContinue.on('pointerout', () => { if (btnContinue.texture.key === 'btn_continue') { btnContinue.anims.stop(); btnContinue.setFrame(0); } });
        btnContinue.on('pointerdown', () => {
            if (btnContinue.texture.key === 'btn_continue_click') return;
            btnContinue.setTexture('btn_continue_click');
            btnContinue.play('click_continue');
            this.iniciarTransitionJogo('L1', { modo: 'singleplayer', nome: this.nomeJogador }, false);
        });

        // ==========================================================================
        // 🔘 BOTÃO 3: "MULTIPLAYER" (Y: 590)
        // ==========================================================================
        this.anims.create({ key: 'hover_multiplayer', frames: this.anims.generateFrameNumbers('btn_multiplayer', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_multiplayer', frames: this.anims.generateFrameNumbers('btn_multiplayer_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnMultiplayer = this.add.sprite(480, 590, 'btn_multiplayer');
        btnMultiplayer.setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnMultiplayer);
        
        btnMultiplayer.on('pointerover', () => { if (btnMultiplayer.texture.key === 'btn_multiplayer') btnMultiplayer.play('hover_multiplayer'); });
        btnMultiplayer.on('pointerout', () => { if (btnMultiplayer.texture.key === 'btn_multiplayer') { btnMultiplayer.anims.stop(); btnMultiplayer.setFrame(0); } });
        btnMultiplayer.on('pointerdown', () => {
            if (btnMultiplayer.texture.key === 'btn_multiplayer_click') return;
            btnMultiplayer.setTexture('btn_multiplayer_click');
            btnMultiplayer.play('click_multiplayer');
            this.iniciarTransitionJogo('ConnectionScene', { isSpectatorMode: false, nome: this.nomeJogador }, false);
        });

        // ==========================================================================
        // 🔘 BOTÃO 4: "OPTIONS" (Y: 670)
        // ==========================================================================
        this.anims.create({ key: 'hover_options', frames: this.anims.generateFrameNumbers('btn_options', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_options', frames: this.anims.generateFrameNumbers('btn_options_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnOptions = this.add.sprite(480, 670, 'btn_options');
        btnOptions.setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnOptions);
        
        btnOptions.on('pointerover', () => { if (btnOptions.texture.key === 'btn_options') btnOptions.play('hover_options'); });
        btnOptions.on('pointerout', () => { if (btnOptions.texture.key === 'btn_options') { btnOptions.anims.stop(); btnOptions.setFrame(0); } });
        btnOptions.on('pointerdown', () => {
            if (btnOptions.texture.key === 'btn_options_click') return;
            btnOptions.setTexture('btn_options_click');
            btnOptions.play('click_options');
            
            btnOptions.once('animationcomplete', () => {
                window.alert("Controlos padrão: Setas para mover, Shift para correr, J para Orbe.");
                btnOptions.setTexture('btn_options');
                btnOptions.setFrame(0);
            });
        });

        // ==========================================================================
        // 🔘 BOTÃO 5: "EXIT" (Y: 750)
        // ==========================================================================
        this.anims.create({ key: 'hover_exit', frames: this.anims.generateFrameNumbers('btn_exit', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_exit', frames: this.anims.generateFrameNumbers('btn_exit_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnExit = this.add.sprite(480, 750, 'btn_exit');
        btnExit.setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnExit);
        
        btnExit.on('pointerover', () => { if (btnExit.texture.key === 'btn_exit') btnExit.play('hover_exit'); });
        btnExit.on('pointerout', () => { if (btnExit.texture.key === 'btn_exit') { btnExit.anims.stop(); btnExit.setFrame(0); } });
        btnExit.on('pointerdown', () => {
            if (btnExit.texture.key === 'btn_exit_click') return;
            btnExit.setTexture('btn_exit_click');
            btnExit.play('click_exit');
            
            btnExit.once('animationcomplete', () => {
                if (this.sound.get('musica_menu')) this.sound.get('musica_menu').stop();
                if (this.sound.get('som_noite')) this.sound.get('som_noite').stop();
                localStorage.removeItem('orin_nickname');
                location.reload();
            });
        });

        // ==========================================================================
        // 📜 MARCA DE ÁGUA DO VIAJANTE
        // ==========================================================================
        let textoViajante = this.add.text(w - 50, h - 50, `Viajante: ${this.nomeJogador}`, {
            fontFamily: retroFont,
            fontSize: '24px',
            fill: '#aaaaaa'
        });
        textoViajante.setOrigin(1, 0.5).setAlpha(0); 
        this.elementosMenu.push(textoViajante);
    }
}