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

        // =========================================================
        // 🕵️ DETETOR DE AMBIENTES (ELECTRON VS BROWSER)
        // =========================================================
        const isElectron = navigator.userAgent.toLowerCase().includes('electron');

        if (isElectron && typeof window.require !== 'undefined') {
            // =====================================================
            // 🚀 MODO DESKTOP FORÇADO (ELECTRON)
            // =====================================================
            const { ipcRenderer } = window.require('electron');

            // 1. O Electron avisa que há atualização: Mostramos o Ecrã de Bloqueio!
            ipcRenderer.once('update-available', (event, info) => {
                this.prepararEcraAtualizacaoVisual(w, h, info.version);
            });

            // 2. O Electron envia a velocidade e os bytes: Enchemos a barra e largamos partículas!
            ipcRenderer.on('download-progress', (event, progressObj) => {
                this.atualizarBarraElectron(w, h, progressObj);
            });

            // 3. O Electron avisa que o download acabou: Enviamos ordem de reiniciar!
            ipcRenderer.once('update-downloaded', () => {
                this.textoUpdateTitulo.setText('[ REINICIANDO PARA INSTALAR... ]');
                this.textoUpdateDetalhe.setText('O Sons of Echoes vai fechar e reabrir sozinho.');
                
                // Dá 2 segundos para o jogador ler, e manda a ordem de reboot ao motor nativo!
                this.time.delayedCall(2000, () => {
                    ipcRenderer.send('reiniciar-e-instalar');
                });
            });

        } else {
            // =====================================================
            // 🌐 MODO TESTES / BROWSER (LIVE SERVER)
            // =====================================================
            this.verificarAtualizacaoBrowser(w, h);
        }

        // =========================================================
        // CÓDIGO NORMAL DO MENU (Fundo, Título, Áudio, etc)
        // =========================================================
        this.anims.create({
            key: 'menu_idle',
            frames: this.anims.generateFrameNumbers('menu_bg_anim', { start: 0, end: 13 }),
            frameRate: 10,
            repeat: -1
        });
        let bgMenu = this.add.sprite(w / 2, h / 2, 'menu_bg_anim').setDisplaySize(w, h);
        bgMenu.play('menu_idle');

        this.anims.create({
            key: 'play_titulo',
            frames: this.anims.generateFrameNumbers('titulo_animado', { start: 0, end: 14 }),
            frameRate: 12,
            repeat: 0
        });

        this.elementosMenu = [];

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

        this.eventoMonstros = this.time.addEvent({
            delay: 5000,
            loop: true,
            callback: () => {
                let sonsBichos = ['grunhido1', 'grunhido2'];
                let somEscolhido = Phaser.Utils.Array.GetRandom(sonsBichos);
                let posicaoAudio = Phaser.Math.FloatBetween(-0.9, 0.9);

                this.sound.play(somEscolhido, { volume: 0.4, rate: Phaser.Math.FloatBetween(0.6, 0.85), pan: posicaoAudio });
                this.eventoMonstros.delay = Phaser.Math.Between(6000, 16000);
            }
        });
    }

    // =========================================================================
    // 🖥️ FERRAMENTAS VISUAIS DE ATUALIZAÇÃO DO ELECTRON
    // =========================================================================
    prepararEcraAtualizacaoVisual(w, h, novaVersao) {
        // Põe um painel gigantesco com prioridade máxima para trancar o menu do jogo
        this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.98).setDepth(10000).setInteractive();

        this.textoUpdateTitulo = this.add.text(w / 2, h / 2 - 120, '[ A ATUALIZAR O JOGO ]', {
            fontFamily: 'retroFont', fontSize: '40px', fill: '#00ffff', align: 'center'
        }).setOrigin(0.5).setDepth(10001);

        this.add.text(w / 2, h / 2 - 50, `A aplicar a nova versão ${novaVersao} silenciosamente...`, {
            fontFamily: 'retroFont', fontSize: '26px', fill: '#aaaaaa', align: 'center'
        }).setOrigin(0.5).setDepth(10001);

        // Barra de progresso base
        this.barraFundoElectron = this.add.rectangle(w / 2, h / 2 + 30, 600, 40, 0x222222).setOrigin(0.5).setDepth(10001);
        this.barraVerdeElectron = this.add.rectangle(w / 2 - 300, h / 2 + 30, 0, 40, 0x00ff00).setOrigin(0, 0.5).setDepth(10001);

        this.textoUpdateDetalhe = this.add.text(w / 2, h / 2 + 90, 'A preparar ficheiros... (0%)', {
            fontFamily: 'retroFont', fontSize: '24px', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(10001);
    }

    atualizarBarraElectron(w, h, progress) {
        if (!this.barraVerdeElectron) return;

        // O Electron envia 'progress.percent' como um número (ex: 45.5)
        let percentagemExata = progress.percent; 
        
        // Atualiza a largura da barra
        this.barraVerdeElectron.width = 600 * (percentagemExata / 100);

        // Formata os bytes para MB
        let mbDescarregados = (progress.transferred / 1024 / 1024).toFixed(1);
        let mbTotais = (progress.total / 1024 / 1024).toFixed(1);

        this.textoUpdateDetalhe.setText(`${mbDescarregados}MB / ${mbTotais}MB (${Math.round(percentagemExata)}%)`);

        // Efeito de partículas
        for(let i = 0; i < 2; i++) {
            let posX_inicial = Phaser.Math.Between(w / 2 - 300, w / 2 + 300);
            let visualChunk = this.add.rectangle(posX_inicial, h / 2 - 20, 6, 6, 0x00ff00).setDepth(10002);
            
            this.tweens.add({
                targets: visualChunk,
                x: (w / 2 - 300) + this.barraVerdeElectron.width,
                y: h / 2 + 30, 
                alpha: 0, 
                duration: 300,
                onComplete: () => visualChunk.destroy()
            });
        }
    }

    // =========================================================================
    // 🌐 SISTEMA DE VERIFICAÇÃO PARA O BROWSER (Plano B do Live Server)
    // =========================================================================
    verificarAtualizacaoBrowser(w, h) {
        fetch('https://raw.githubusercontent.com/GustavoSanz/Sons_of_Echoes/refs/heads/main/versao.json')
        .then(resposta => {
            if (!resposta.ok) throw new Error(`Erro de rede: ${resposta.status}`);
            return resposta.json();
        })
        .then(dados => {
            if (dados.versao_oficial !== window.VERSAO_JOGO) {
                let fundoAviso = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.95).setDepth(9998).setInteractive();
                
                let titulo = this.add.text(w/2, h/2 - 120, '[ ATUALIZAÇÃO DISPONÍVEL ]\n\nUma nova versão do Sons of Echoes está pronta!', {
                    fontFamily: 'retroFont', fontSize: '40px', fill: '#00ffff', align: 'center'
                }).setOrigin(0.5).setDepth(9999);

                let textoVersao = this.add.text(w/2, h/2 - 10, `A tua versão: ${window.VERSAO_JOGO}\nVersão atual: ${dados.versao_oficial}`, {
                    fontFamily: 'retroFont', fontSize: '30px', fill: '#ff4444', align: 'center'
                }).setOrigin(0.5).setDepth(9999);
                
                let btnBaixar = this.add.text(w/2 - 160, h/2 + 120, '> DESCARREGAR <', {
                    fontFamily: 'retroFont', fontSize: '30px', fill: '#00ff00'
                }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

                let btnIgnorar = this.add.text(w/2 + 160, h/2 + 120, '> IGNORAR <', {
                    fontFamily: 'retroFont', fontSize: '30px', fill: '#aaaaaa'
                }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

                btnBaixar.on('pointerover', () => btnBaixar.setFill('#ffffff'));
                btnBaixar.on('pointerout', () => btnBaixar.setFill('#00ff00'));
                btnIgnorar.on('pointerover', () => btnIgnorar.setFill('#ff0000'));
                btnIgnorar.on('pointerout', () => btnIgnorar.setFill('#aaaaaa'));

                btnIgnorar.on('pointerdown', () => {
                    fundoAviso.destroy(); titulo.destroy(); textoVersao.destroy(); btnBaixar.destroy(); btnIgnorar.destroy();
                });

                btnBaixar.on('pointerdown', () => {
                    btnBaixar.destroy(); btnIgnorar.destroy(); textoVersao.destroy();
                    let urlAsset = `https://github.com/GustavoSanz/Sons_of_Echoes/releases/download/v${dados.versao_oficial}/Sons.of.Echoes.Setup.${dados.versao_oficial}.exe`;
                    this.iniciarFluxoDownloadVisual(urlAsset, titulo, dados.versao_oficial);
                });
            }
        })
        .catch(erro => console.log('Modo Offline.', erro));
    }

    iniciarFluxoDownloadVisual(url, textoTitulo, versaoAlvo) {
        let w = this.cameras.main.width; let h = this.cameras.main.height;
        textoTitulo.setText('[ DESCARREGANDO JOGO... ]');

        let barraFundo = this.add.rectangle(w / 2, h / 2 + 20, 600, 40, 0x222222).setOrigin(0.5).setDepth(9999);
        let barraProgresso = this.add.rectangle(w / 2 - 300, h / 2 + 20, 0, 40, 0x00ff00).setOrigin(0, 0.5).setDepth(9999);
        let textoPercentagem = this.add.text(w / 2, h / 2 + 80, 'A preparar ligação...', { fontFamily: 'retroFont', fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5).setDepth(9999);

        fetch(url)
        .then(resposta => {
            if (!resposta.ok) throw new Error(`HTTP Erro: ${resposta.status}`);
            
            const totalBytes = parseInt(resposta.headers.get('content-length'), 10);
            const leitor = resposta.body.getReader();
            let bytesRecebidos = 0;
            let pedaçosDeMemoria = [];

            const lerPedaco = () => {
                return leitor.read().then(({ done, value }) => {
                    if (done) return new Blob(pedaçosDeMemoria);

                    bytesRecebidos += value.length;
                    pedaçosDeMemoria.push(value);

                    let posX_inicial = Phaser.Math.Between(w / 2 - 300, w / 2 + 300);
                    let posY_inicial = h / 2 - 80 - Math.random() * 50; 
                    let corVisual = Phaser.Utils.Array.GetRandom([0x00ffff, 0x00ff00, 0xffffff]); 
                    
                    let visualChunk = this.add.rectangle(posX_inicial, posY_inicial, 6, 6, corVisual).setDepth(10000);
                    let destinoX = (w / 2 - 300) + barraProgresso.width;

                    this.tweens.add({
                        targets: visualChunk, x: destinoX, y: h / 2 + 20, alpha: 0, scale: 0.2, duration: Phaser.Math.Between(200, 400), ease: 'Quad.easeIn', onComplete: () => visualChunk.destroy()
                    });
                    
                    if (totalBytes) {
                        let progressoRatio = bytesRecebidos / totalBytes;
                        barraProgresso.width = 600 * progressoRatio;
                        let mbRecebidos = (bytesRecebidos / (1024 * 1024)).toFixed(1);
                        let mbTotais = (totalBytes / (1024 * 1024)).toFixed(1);
                        textoPercentagem.setText(`${mbRecebidos}MB / ${mbTotais}MB (${Math.round(progressoRatio * 100)}%)`);
                    }
                    return lerPedaco();
                });
            };
            return lerPedaco();
        })
        .then(blobFinal => {
            barraFundo.destroy(); barraProgresso.destroy(); textoPercentagem.destroy();
            textoTitulo.setText('[ DOWNLOAD CONCLUÍDO! ]');
            this.add.text(w / 2, h / 2 + 40, 'Ficheiro guardado. Por favor instala o executável.', { fontFamily: 'retroFont', fontSize: '25px', fill: '#00ff00', align: 'center' }).setOrigin(0.5).setDepth(9999);

            let urlLocal = window.URL.createObjectURL(blobFinal);
            let ancoraDownload = document.createElement('a');
            ancoraDownload.href = urlLocal; ancoraDownload.download = `Sons.of.Echoes.Setup.${versaoAlvo}.exe`;
            document.body.appendChild(ancoraDownload); ancoraDownload.click();
            document.body.removeChild(ancoraDownload); window.URL.revokeObjectURL(urlLocal);
        })
        .catch(erro => {
            console.error('CORS bloqueou:', erro);
            textoPercentagem.setText('A transferir via navegador...');
            let ancoraDownload = document.createElement('a');
            ancoraDownload.href = url; document.body.appendChild(ancoraDownload); ancoraDownload.click(); document.body.removeChild(ancoraDownload);

            textoTitulo.setText('[ DOWNLOAD INICIADO ]');
            this.time.delayedCall(3500, () => {
                if(barraFundo) barraFundo.destroy(); if(barraProgresso) barraProgresso.destroy(); if(textoPercentagem) textoPercentagem.destroy();
                textoTitulo.setText('[ VERIFICA AS TUAS TRANSFERÊNCIAS ]');
            });
        });
    }

    // =========================================================================
    // MÉTODOS DE BASE DO MENU (Áudio, Transições, Interações)
    // =========================================================================
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
        let logoTitle = this.add.sprite(480, 220, 'titulo_animado').setOrigin(0.5).setDepth(10).setScale(1.8).setAlpha(0);
        let alvosFade = [logoTitle, ...this.elementosMenu];

        this.tweens.add({
            targets: alvosFade, alpha: 1, duration: 1200,
            onComplete: () => {
                if (!localStorage.getItem('orin_nickname')) {
                    document.getElementById('name-input-container').style.display = 'block';
                } else if (typeof window.verificarChangelogAuto === 'function') {
                    window.verificarChangelogAuto();
                }
            }
        });
        logoTitle.play('play_titulo');
    }

    iniciarTransitionJogo(cenaDestino, dadosPassados) {
        if (this.eventoMonstros) this.eventoMonstros.remove(); 
        this.sound.stopByKey('grunhido1'); this.sound.stopByKey('grunhido2');

        let musica = this.sound.get('musica_menu'); let somNoite = this.sound.get('som_noite');

        if (musica) {
            this.tweens.add({
                targets: musica, volume: 0, duration: 400, onComplete: () => {
                    musica.setSeek(245);
                    this.tweens.add({ targets: musica, volume: 0.7, duration: 2500, ease: 'Sine.easeInOut' });
                }
            });
        }
        if (somNoite) this.tweens.add({ targets: somNoite, volume: 0, duration: 4000 });

        this.cameras.main.fadeOut(4000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (musica) musica.stop(); if (somNoite) somNoite.stop();
            this.scene.start(cenaDestino, dadosPassados);
        });
    }

    prepararRestoDoMenu(w, h) {
        this.nomeJogador = localStorage.getItem('orin_nickname') || "Desconhecido";

        if (this.mensagemErro) {
            this.sound.play('som_erro', { volume: 0.6 }); 
            let caixaErro = this.add.rectangle(w / 2, h / 2 - 20, 500, 80, 0xcc0000).setOrigin(0.5).setDepth(100).setStrokeStyle(2, 0xffffff); 
            let txtErro = this.add.text(w / 2, h / 2 - 20, this.mensagemErro, { fontFamily: 'retroFont', fontSize: '26px', fill: '#ffffff', align: 'center' }).setOrigin(0.5).setDepth(101);

            this.time.delayedCall(5000, () => {
                this.tweens.add({
                    targets: [caixaErro, txtErro], alpha: 0, duration: 1000, onComplete: () => {
                        caixaErro.destroy(); txtErro.destroy(); this.mensagemErro = null;
                    }
                });
            });
        }

        const criarBotaoAnimado = (chaveSprite, y, animClick, onDownFunc) => {
            this.anims.create({ key: `hover_${chaveSprite}`, frames: this.anims.generateFrameNumbers(chaveSprite, { start: 0, end: 10 }), frameRate: 15, repeat: -1 });
            this.anims.create({ key: `click_${chaveSprite}`, frames: this.anims.generateFrameNumbers(animClick, { start: 0, end: 10 }), frameRate: 15, repeat: 0 });

            let btn = this.add.sprite(480, y, chaveSprite).setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0); 
            this.elementosMenu.push(btn);
            
            btn.on('pointerover', () => { if (btn.texture.key === chaveSprite) btn.play(`hover_${chaveSprite}`); });
            btn.on('pointerout', () => { if (btn.texture.key === chaveSprite) { btn.anims.stop(); btn.setFrame(0); } });
            btn.on('pointerdown', () => {
                if (btn.texture.key === animClick) return;
                btn.setTexture(animClick).play(`click_${chaveSprite}`);
                onDownFunc(btn);
            });
        };

        criarBotaoAnimado('btn_new_game', 430, 'btn_new_game_click', () => this.iniciarTransitionJogo('SceneAndar', { modo: 'singleplayer', nome: this.nomeJogador }));
        criarBotaoAnimado('btn_continue', 510, 'btn_continue_click', () => this.iniciarTransitionJogo('L1', { modo: 'singleplayer', nome: this.nomeJogador }));
        criarBotaoAnimado('btn_multiplayer', 590, 'btn_multiplayer_click', () => this.iniciarTransitionJogo('ConnectionScene', { isSpectatorMode: false, nome: this.nomeJogador }));
        
        criarBotaoAnimado('btn_options', 670, 'btn_options_click', (btn) => {
            btn.once('animationcomplete', () => {
                window.alert("Controlos padrão: Setas para mover, Shift para correr, J para Orbe.");
                btn.setTexture('btn_options').setFrame(0);
            });
        });

        criarBotaoAnimado('btn_exit', 750, 'btn_exit_click', (btn) => {
            btn.once('animationcomplete', () => {
                if (this.sound.get('musica_menu')) this.sound.get('musica_menu').stop();
                if (this.sound.get('som_noite')) this.sound.get('som_noite').stop();
                window.close();
            });
        });

        let btnChangelog = this.add.text(20, 20, 'Ver Changelog', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setInteractive({ useHandCursor: true });
        btnChangelog.on('pointerdown', () => window.abrirChangelog());

        this.textoViajante = this.add.text(w - 50, h - 50, `Viajante: ${this.nomeJogador}`, { fontFamily: 'retroFont', fontSize: '24px', fill: '#aaaaaa' }).setOrigin(1, 0.5).setAlpha(0).setInteractive({ useHandCursor: true });
        this.elementosMenu.push(this.textoViajante);
        
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