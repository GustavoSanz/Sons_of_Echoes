class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    init(data) {
        this.mensagemErro = data.mensagemErro || data.erro || null;
    }
    
    create() {
        let w = this.cameras.main.width;
        let h = this.cameras.main.height;

        // 1. Escudo de proteção e verificação de atualizações no GitHub
        fetch('https://raw.githubusercontent.com/GustavoSanz/Sons_of_Echoes/refs/heads/main/versao.json')
        .then(resposta => {
            if (!resposta.ok) throw new Error(`Erro de rede: ${resposta.status}`);
            return resposta.json();
        })
        .then(dados => {
            // Compara a versão do GitHub com a versão local
            if (dados.versao_oficial !== window.VERSAO_JOGO) {
                
                // Tranca todas as interações de fundo com película opaca
                let fundoAviso = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.95).setDepth(9998).setInteractive();
                
                let titulo = this.add.text(w/2, h/2 - 120, '[ ATUALIZAÇÃO DISPONÍVEL ]\n\nUma nova versão do Sons of Echoes está pronta!', {
                    fontFamily: 'retroFont',
                    fontSize: '40px',
                    fill: '#00ffff',
                    align: 'center'
                }).setOrigin(0.5).setDepth(9999);

                let textoVersao = this.add.text(w/2, h/2 - 10, `A tua versão: ${window.VERSAO_JOGO}\nVersão atual: ${dados.versao_oficial}`, {
                    fontFamily: 'retroFont',
                    fontSize: '30px',
                    fill: '#ff4444',
                    align: 'center'
                }).setOrigin(0.5).setDepth(9999);
                
                // Botão Interativo: Descarregar na própria App
                let btnBaixar = this.add.text(w/2 - 160, h/2 + 120, '> DESCARREGAR <', {
                    fontFamily: 'retroFont',
                    fontSize: '30px',
                    fill: '#00ff00'
                }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

                // Botão Interativo: Ignorar aviso (Permite jogar Singleplayer offline)
                let btnIgnorar = this.add.text(w/2 + 160, h/2 + 120, '> IGNORAR <', {
                    fontFamily: 'retroFont',
                    fontSize: '30px',
                    fill: '#aaaaaa'
                }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

                // Efeitos visuais de Hover nos botões
                btnBaixar.on('pointerover', () => btnBaixar.setFill('#ffffff'));
                btnBaixar.on('pointerout', () => btnBaixar.setFill('#00ff00'));
                btnIgnorar.on('pointerover', () => btnIgnorar.setFill('#ff0000'));
                btnIgnorar.on('pointerout', () => btnIgnorar.setFill('#aaaaaa'));

                // Ação de Ignorar: Destrói o ecrã de bloqueio
                btnIgnorar.on('pointerdown', () => {
                    fundoAviso.destroy();
                    titulo.destroy();
                    textoVersao.destroy();
                    btnBaixar.destroy();
                    btnIgnorar.destroy();
                });

                // Ação de Download: Remove botões e inicia a transferência
                btnBaixar.on('pointerdown', () => {
                    btnBaixar.destroy();
                    btnIgnorar.destroy();
                    textoVersao.destroy();
                    
                    // URL direta do teu GitHub (Sem proxies!)
                    let urlAsset = `https://github.com/GustavoSanz/Sons_of_Echoes/releases/download/v${dados.versao_oficial}/Sons.of.Echoes.Setup.${dados.versao_oficial}.exe`;
                    
                    this.iniciarFluxoDownload(urlAsset, titulo);
                });
            }
        })
        .catch(erro => {
            console.log('Modo Offline: Não foi possível verificar as atualizações.', erro);
        });

        // Fundo animado original
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

        // Camada de interação inicial
        if (this.mensagemErro) {
            this.prepararRestoDoMenu(w, h);
            this.dispararFadeDoTitulo();
            this.iniciarAudioMenu();
        } else {
            this.peliculaInicio = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 1.0).setOrigin(0.5).setDepth(2000).setInteractive();

            this.textoInicio = this.add.text(w / 2, h / 2, 'Clica para entrar nas Trevas...', {
                fontFamily: 'retroFont',
                fontSize: '48px',
                fill: '#ffffff'
            }).setOrigin(0.5).setDepth(2001);

            this.prepararRestoDoMenu(w, h);

            this.peliculaInicio.on('pointerdown', () => {
                this.peliculaInicio.disableInteractive();

                this.tweens.add({
                    targets: this.textoInicio,
                    alpha: 0,
                    duration: 400,
                    onComplete: () => {
                        this.textoInicio.destroy();
                        let videoIntro = this.add.video(w / 2, h / 2, 'intro_video').setOrigin(0.5).setDepth(2500);
                        
                        videoIntro.on('playing', () => { videoIntro.setDisplaySize(w, h); });
                        videoIntro.play();

                        let podeSaltar = true;
                        this.input.once('pointerdown', () => {
                            if (podeSaltar && videoIntro && videoIntro.isPlaying()) {
                                videoIntro.stop();
                                videoIntro.emit('complete');
                            }
                        });

                        videoIntro.once('complete', () => {
                            podeSaltar = false;
                            videoIntro.destroy();
                            
                            this.tweens.add({
                                targets: this.peliculaInicio,
                                alpha: 0,
                                duration: 800,
                                onComplete: () => { this.peliculaInicio.destroy(); }
                            });

                            this.iniciarAudioMenu();
                            this.dispararFadeDoTitulo();
                        });
                    }
                });
            });
        }

        // Sistema de som aleatório de monstros
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

    // =========================================================================
    // ⬇️ SISTEMA DE DOWNLOAD DIRETO E ANIMAÇÕES
    // =========================================================================
    iniciarFluxoDownload(url, textoTitulo) {
        let w = this.cameras.main.width;
        let h = this.cameras.main.height;

        textoTitulo.setText('[ DESCARREGANDO JOGO... ]');

        // Criação gráfica do invólucro e da barra de preenchimento
        let barraFundo = this.add.rectangle(w / 2, h / 2 + 20, 600, 40, 0x222222).setOrigin(0.5).setDepth(9999);
        let barraProgresso = this.add.rectangle(w / 2 - 300, h / 2 + 20, 0, 40, 0x00ff00).setOrigin(0, 0.5).setDepth(9999);
        
        let textoPercentagem = this.add.text(w / 2, h / 2 + 80, 'A preparar ligação...', {
            fontFamily: 'retroFont',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(9999);

        // Execução da pipeline HTTP assíncrona
        fetch(url)
        .then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP Erro! Código: ${resposta.status}`);
            
            const totalBytes = parseInt(resposta.headers.get('content-length'), 10);
            if (isNaN(totalBytes)) {
                textoPercentagem.setText('A descarregar (Tamanho indefinido)...');
            }

            const leitor = resposta.body.getReader();
            let bytesRecebidos = 0;
            let pedaçosDeMemoria = [];

            // Função recursiva para ler buffers sequenciais
            const lerPedaco = () => {
                return leitor.read().then(({ done, value }) => {
                    if (done) {
                        return new Blob(pedaçosDeMemoria);
                    }

                    bytesRecebidos += value.length;
                    pedaçosDeMemoria.push(value);

                    // ✨ ANIMAÇÃO DOS PACOTES DE DADOS (CHUNKS) ✨
                    let posX_inicial = Phaser.Math.Between(w / 2 - 300, w / 2 + 300);
                    let posY_inicial = h / 2 - 80 - Math.random() * 50; 
                    let corVisual = Phaser.Utils.Array.GetRandom([0x00ffff, 0x00ff00, 0xffffff]); 
                    
                    let visualChunk = this.add.rectangle(posX_inicial, posY_inicial, 6, 6, corVisual).setDepth(10000);
                    let destinoX = (w / 2 - 300) + barraProgresso.width;

                    this.tweens.add({
                        targets: visualChunk,
                        x: destinoX,
                        y: h / 2 + 20, 
                        alpha: 0, 
                        scale: 0.2, 
                        duration: Phaser.Math.Between(200, 400),
                        ease: 'Quad.easeIn',
                        onComplete: () => { visualChunk.destroy(); }
                    });
                    
                    // Atualização em tempo real das métricas da UI
                    if (totalBytes) {
                        let progressoRatio = bytesRecebidos / totalBytes;
                        let percentagem = Math.round(progressoRatio * 100);
                        
                        barraProgresso.width = 600 * progressoRatio;
                        
                        let mbRecebidos = (bytesRecebidos / (1024 * 1024)).toFixed(1);
                        let mbTotais = (totalBytes / (1024 * 1024)).toFixed(1);
                        textoPercentagem.setText(`${mbRecebidos}MB / ${mbTotais}MB (${percentagem}%)`);
                    } else {
                        let mbRecebidos = (bytesRecebidos / (1024 * 1024)).toFixed(1);
                        textoPercentagem.setText(`${mbRecebidos}MB descarregados...`);
                    }

                    return lerPedaco(); // Pede o próximo pacote!
                });
            };

            return lerPedaco();
        })
        .then(blobFinal => {
            // Sucesso total da operação via Electron/Navegador sem bloqueio
            barraFundo.destroy();
            barraProgresso.destroy();
            textoPercentagem.destroy();
            
            textoTitulo.setText('[ DOWNLOAD CONCLUÍDO! ]');
            
            let textoSucesso = this.add.text(w / 2, h / 2 + 40, 'O ficheiro foi guardado.\nPor favor, instala o novo executável.', {
                fontFamily: 'retroFont',
                fontSize: '25px',
                fill: '#00ff00',
                align: 'center'
            }).setOrigin(0.5).setDepth(9999);

            let urlLocal = window.URL.createObjectURL(blobFinal);
            let ancoraDownload = document.createElement('a');
            ancoraDownload.href = urlLocal;
            ancoraDownload.download = "Sons_of_Echoes_Atualizacao.exe"; // Nome genérico para não ter conflitos de variáveis
            document.body.appendChild(ancoraDownload);
            ancoraDownload.click();
            
            document.body.removeChild(ancoraDownload);
            window.URL.revokeObjectURL(urlLocal);
        })
        .catch(erro => {
            // =========================================================
            // 🚨 PLANO B: SE O CORS BLOQUEAR A ANIMAÇÃO (NO LIVE SERVER)
            // =========================================================
            console.error('Falha na transferência direta (CORS bloqueou):', erro);
            
            textoPercentagem.setText('A transferir via navegador...');
            
            // Força o navegador a descarregar o ficheiro diretamente
            let ancoraDownload = document.createElement('a');
            ancoraDownload.href = url;
            document.body.appendChild(ancoraDownload);
            ancoraDownload.click(); 
            document.body.removeChild(ancoraDownload);

            textoTitulo.setText('[ DOWNLOAD INICIADO ]');
            
            // Limpa a barra gráfica porque o download está a ser feito pelo Chrome
            this.time.delayedCall(3500, () => {
                if(barraFundo) barraFundo.destroy();
                if(barraProgresso) barraProgresso.destroy();
                if(textoPercentagem) textoPercentagem.destroy();
                textoTitulo.setText('[ VERIFICA AS TUAS TRANSFERÊNCIAS ]');
            });
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
        logoTitle.setOrigin(0.5).setDepth(10).setScale(1.8).setAlpha(0);

        let alvosFade = [logoTitle, ...this.elementosMenu];

        this.tweens.add({
            targets: alvosFade,
            alpha: 1,
            duration: 1200,
            onComplete: () => {
                if (!localStorage.getItem('orin_nickname')) {
                    document.getElementById('name-input-container').style.display = 'block';
                } else {
                    if (typeof window.verificarChangelogAuto === 'function') {
                        window.verificarChangelogAuto();
                    }
                }
            }
        });

        logoTitle.play('play_titulo');
    }

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
        this.nomeJogador = localStorage.getItem('orin_nickname') || "Desconhecido";

        if (this.mensagemErro) {
            this.sound.play('som_erro', { volume: 0.6 }); 

            let caixaErro = this.add.rectangle(w / 2, h / 2 - 20, 500, 80, 0xcc0000).setOrigin(0.5).setDepth(100);
            caixaErro.setStrokeStyle(2, 0xffffff); 

            let txtErro = this.add.text(w / 2, h / 2 - 20, this.mensagemErro, {
                fontFamily: retroFont,
                fontSize: '26px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5).setDepth(101);

            this.time.delayedCall(5000, () => {
                this.tweens.add({
                    targets: [caixaErro, txtErro],
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => {
                        caixaErro.destroy();
                        txtErro.destroy();
                        this.mensagemErro = null;
                    }
                });
            });
        }

        // Configurações Globais de Animações e Botões de Ação do Menu
        this.anims.create({ key: 'hover_new_game', frames: this.anims.generateFrameNumbers('btn_new_game', { start: 0, end: 10 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_new_game', frames: this.anims.generateFrameNumbers('btn_new_game_click', { start: 0, end: 10 }), frameRate: 15, repeat: 0 });

        let btnNewGame = this.add.sprite(480, 430, 'btn_new_game').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0); 
        this.elementosMenu.push(btnNewGame);
        
        btnNewGame.on('pointerover', () => { if (btnNewGame.texture.key === 'btn_new_game') btnNewGame.play('hover_new_game'); });
        btnNewGame.on('pointerout', () => { if (btnNewGame.texture.key === 'btn_new_game') { btnNewGame.anims.stop(); btnNewGame.setFrame(0); } });
        btnNewGame.on('pointerdown', () => {
            if (btnNewGame.texture.key === 'btn_new_game_click') return;
            btnNewGame.setTexture('btn_new_game_click').play('click_new_game');
            this.iniciarTransitionJogo('SceneAndar', { modo: 'singleplayer', nome: this.nomeJogador });
        });

        this.anims.create({ key: 'hover_continue', frames: this.anims.generateFrameNumbers('btn_continue', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_continue', frames: this.anims.generateFrameNumbers('btn_continue_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnContinue = this.add.sprite(480, 510, 'btn_continue').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnContinue);
        
        btnContinue.on('pointerover', () => { if (btnContinue.texture.key === 'btn_continue') btnContinue.play('hover_continue'); });
        btnContinue.on('pointerout', () => { if (btnContinue.texture.key === 'btn_continue') { btnContinue.anims.stop(); btnContinue.setFrame(0); } });
        btnContinue.on('pointerdown', () => {
            if (btnContinue.texture.key === 'btn_continue_click') return;
            btnContinue.setTexture('btn_continue_click').play('click_continue');
            this.iniciarTransitionJogo('L1', { modo: 'singleplayer', nome: this.nomeJogador });
        });

        this.anims.create({ key: 'hover_multiplayer', frames: this.anims.generateFrameNumbers('btn_multiplayer', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_multiplayer', frames: this.anims.generateFrameNumbers('btn_multiplayer_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnMultiplayer = this.add.sprite(480, 590, 'btn_multiplayer').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnMultiplayer);
        
        btnMultiplayer.on('pointerover', () => { if (btnMultiplayer.texture.key === 'btn_multiplayer') btnMultiplayer.play('hover_multiplayer'); });
        btnMultiplayer.on('pointerout', () => { if (btnMultiplayer.texture.key === 'btn_multiplayer') { btnMultiplayer.anims.stop(); btnMultiplayer.setFrame(0); } });
        btnMultiplayer.on('pointerdown', () => {
            if (btnMultiplayer.texture.key === 'btn_multiplayer_click') return;
            btnMultiplayer.setTexture('btn_multiplayer_click').play('click_multiplayer');
            this.iniciarTransitionJogo('ConnectionScene', { isSpectatorMode: false, nome: this.nomeJogador });
        });

        this.anims.create({ key: 'hover_options', frames: this.anims.generateFrameNumbers('btn_options', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_options', frames: this.anims.generateFrameNumbers('btn_options_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnOptions = this.add.sprite(480, 670, 'btn_options').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnOptions);
        
        btnOptions.on('pointerover', () => { if (btnOptions.texture.key === 'btn_options') btnOptions.play('hover_options'); });
        btnOptions.on('pointerout', () => { if (btnOptions.texture.key === 'btn_options') { btnOptions.anims.stop(); btnOptions.setFrame(0); } });
        btnOptions.on('pointerdown', () => {
            if (btnOptions.texture.key === 'btn_options_click') return;
            btnOptions.setTexture('btn_options_click').play('click_options');
            btnOptions.once('animationcomplete', () => {
                window.alert("Controlos padrão: Setas para mover, Shift para correr, J para Orbe.");
                btnOptions.setTexture('btn_options').setFrame(0);
            });
        });

        this.anims.create({ key: 'hover_exit', frames: this.anims.generateFrameNumbers('btn_exit', { start: 0, end: 11 }), frameRate: 15, repeat: -1 });
        this.anims.create({ key: 'click_exit', frames: this.anims.generateFrameNumbers('btn_exit_click', { start: 0, end: 11 }), frameRate: 15, repeat: 0 });

        let btnExit = this.add.sprite(480, 750, 'btn_exit').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0);
        this.elementosMenu.push(btnExit);
        
        btnExit.on('pointerover', () => { if (btnExit.texture.key === 'btn_exit') btnExit.play('hover_exit'); });
        btnExit.on('pointerout', () => { if (btnExit.texture.key === 'btn_exit') { btnExit.anims.stop(); btnExit.setFrame(0); } });
        btnExit.on('pointerdown', () => {
            if (btnExit.texture.key === 'btn_exit_click') return;
            btnExit.setTexture('btn_exit_click').play('click_exit');
            btnExit.once('animationcomplete', () => {
                if (this.sound.get('musica_menu')) this.sound.get('musica_menu').stop();
                if (this.sound.get('som_noite')) this.sound.get('som_noite').stop();
                window.close();
            });
        });

        let btnChangelog = this.add.text(20, 20, 'Ver Changelog', { 
            fontFamily: 'Arial', 
            fontSize: '18px', 
            color: '#ffffff' 
        }).setInteractive({ useHandCursor: true });
        btnChangelog.on('pointerdown', () => { window.abrirChangelog(); });

        this.textoViajante = this.add.text(w - 50, h - 50, `Viajante: ${this.nomeJogador}`, {
            fontFamily: retroFont,
            fontSize: '24px',
            fill: '#aaaaaa'
        }).setOrigin(1, 0.5).setAlpha(0); 
        this.elementosMenu.push(this.textoViajante);

        this.textoViajante.setInteractive({ useHandCursor: true });
        this.textoViajante.on('pointerdown', () => {
            const container = document.getElementById('name-input-container');
            if (container) container.style.display = 'block';
        });

        window.atualizarNomeMenu = (novoNome) => {
            this.nomeJogador = novoNome;
            if (this.textoViajante) this.textoViajante.setText(`Viajante: ${novoNome}`);
        };
    }
}