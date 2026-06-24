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

        // Verifica se estamos no Live Server (Browser)
        const isBrowser = !navigator.userAgent.toLowerCase().includes('electron');

        // Se estiveres no teu laboratório de testes (Chrome), usa o Plano B manual
        if (isBrowser) {
            this.verificarAtualizacaoBrowser(w, h);
        } else {
            console.log("A correr no Electron: O módulo isolado 'auto-updater.js' está a tratar das atualizações.");
        }

        // =========================================================
        // ANIMAÇÕES E INTERAÇÕES BASE DO MENU
        // =========================================================
        this.anims.create({ key: 'menu_idle', frames: this.anims.generateFrameNumbers('menu_bg_anim', { start: 0, end: 13 }), frameRate: 10, repeat: -1 });
        let bgMenu = this.add.sprite(w / 2, h / 2, 'menu_bg_anim').setDisplaySize(w, h);
        bgMenu.play('menu_idle');

        this.anims.create({ key: 'play_titulo', frames: this.anims.generateFrameNumbers('titulo_animado', { start: 0, end: 14 }), frameRate: 12, repeat: 0 });

        this.elementosMenu = [];

        if (this.mensagemErro) {
            this.prepararRestoDoMenu(w, h);
            this.dispararFadeDoTitulo();
            this.iniciarAudioMenu();
        } else {
            this.peliculaInicio = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 1.0).setOrigin(0.5).setDepth(2000).setInteractive();
            this.textoInicio = this.add.text(w / 2, h / 2, 'Clica para entrar nas Trevas...', { fontFamily: 'retroFont', fontSize: '48px', fill: '#ffffff' }).setOrigin(0.5).setDepth(2001);

            this.prepararRestoDoMenu(w, h);

            this.peliculaInicio.on('pointerdown', () => {
                this.peliculaInicio.disableInteractive();
                this.tweens.add({
                    targets: this.textoInicio, alpha: 0, duration: 400, onComplete: () => {
                        this.textoInicio.destroy();
                        let videoIntro = this.add.video(w / 2, h / 2, 'intro_video').setOrigin(0.5).setDepth(2500);
                        videoIntro.on('playing', () => videoIntro.setDisplaySize(w, h));
                        videoIntro.play();

                        let podeSaltar = true;
                        this.input.once('pointerdown', () => { if (podeSaltar && videoIntro.isPlaying()) { videoIntro.stop(); videoIntro.emit('complete'); } });

                        videoIntro.once('complete', () => {
                            podeSaltar = false; videoIntro.destroy();
                            this.tweens.add({ targets: this.peliculaInicio, alpha: 0, duration: 800, onComplete: () => this.peliculaInicio.destroy() });
                            this.iniciarAudioMenu();
                            this.dispararFadeDoTitulo();
                        });
                    }
                });
            });
        }

if (!isBrowser) {
            // =====================================================
            // 🚀 MODO DESKTOP FORÇADO (ELECTRON) - ESTILO GENSHIN
            // =====================================================
            const { ipcRenderer } = window.require('electron');

            // 1. Ouvimos a percentagem a chegar do auto-updater
            ipcRenderer.on('atualiza-barra-phaser', (event, progressObj) => {
                
                // Se a barra visual ainda não existir no ecrã, criamo-la!
                if (!this.barraVerdeElectron) {
                    this.prepararEcraAtualizacaoVisual(w, h, "Nova Versão"); // Chama aquela tua função visual
                }

                // Atualizamos a largura da barra e as partículas
                this.atualizarBarraElectron(w, h, progressObj);
            });

            // 2. Quando chegar aos 100%, o Phaser toma o controlo e avisa o jogador
            ipcRenderer.on('atualizacao-concluida', () => {
                this.textoUpdateTitulo.setText('[ REINICIANDO NAS TREVAS... ]');
                this.textoUpdateDetalhe.setText('A aplicar a magia de forma invisível...');
                
                // Espera 2 segundos para o jogador apreciar a barra a 100% e manda o Electron reiniciar
                this.time.delayedCall(2000, () => {
                    ipcRenderer.send('reiniciar-e-instalar'); // <-- Vais ter de criar este 'on' no main.js!
                });
            });
        }




        this.eventoMonstros = this.time.addEvent({
            delay: 5000, loop: true, callback: () => {
                let som = Phaser.Utils.Array.GetRandom(['grunhido1', 'grunhido2']);
                this.sound.play(som, { volume: 0.4, rate: Phaser.Math.FloatBetween(0.6, 0.85), pan: Phaser.Math.FloatBetween(-0.9, 0.9) });
                this.eventoMonstros.delay = Phaser.Math.Between(6000, 16000);
            }
        });
    }

    // =========================================================================
    // FALLBACK MANUAL PARA TESTES NO NAVEGADOR
    // =========================================================================
    verificarAtualizacaoBrowser(w, h) {
        fetch('https://raw.githubusercontent.com/GustavoSanz/Sons_of_Echoes/refs/heads/main/versao.json')
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(dados => {
            if (dados.versao_oficial !== window.VERSAO_JOGO) {
                let fundoAviso = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.95).setDepth(9998).setInteractive();
                let titulo = this.add.text(w/2, h/2 - 120, '[ ATUALIZAÇÃO DISPONÍVEL ]', { fontFamily: 'retroFont', fontSize: '40px', fill: '#00ffff' }).setOrigin(0.5).setDepth(9999);
                let txtVer = this.add.text(w/2, h/2 - 10, `Tua versão: ${window.VERSAO_JOGO}\nNova: ${dados.versao_oficial}`, { fontFamily: 'retroFont', fontSize: '30px', fill: '#ff4444', align: 'center' }).setOrigin(0.5).setDepth(9999);
                let btnBaixar = this.add.text(w/2 - 160, h/2 + 120, '> DESCARREGAR <', { fontFamily: 'retroFont', fontSize: '30px', fill: '#00ff00' }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });
                let btnIgnorar = this.add.text(w/2 + 160, h/2 + 120, '> IGNORAR <', { fontFamily: 'retroFont', fontSize: '30px', fill: '#aaaaaa' }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

                btnIgnorar.on('pointerdown', () => { fundoAviso.destroy(); titulo.destroy(); txtVer.destroy(); btnBaixar.destroy(); btnIgnorar.destroy(); });
                btnBaixar.on('pointerdown', () => {
                    btnBaixar.destroy(); btnIgnorar.destroy(); txtVer.destroy();
                    let urlAsset = `https://github.com/GustavoSanz/Sons_of_Echoes/releases/download/v${dados.versao_oficial}/Sons.of.Echoes.Setup.${dados.versao_oficial}.exe`;
                    this.animarDownloadFallback(urlAsset, titulo, dados.versao_oficial);
                });
            }
        }).catch(() => console.log('Live Server Offline.'));
    }

    animarDownloadFallback(url, titulo, versaoAlvo) {
        let w = this.cameras.main.width; let h = this.cameras.main.height;
        titulo.setText('[ DESCARREGANDO... ]');
        let barraProg = this.add.rectangle(w / 2 - 300, h / 2 + 20, 0, 40, 0x00ff00).setOrigin(0, 0.5).setDepth(9999);
        let txtPercent = this.add.text(w / 2, h / 2 + 80, 'A iniciar...', { fontFamily: 'retroFont', fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5).setDepth(9999);

        fetch(url).then(res => {
            const total = parseInt(res.headers.get('content-length'), 10);
            const leitor = res.body.getReader();
            let rcv = 0; let chunks = [];

            const ler = () => leitor.read().then(({ done, value }) => {
                if (done) return new Blob(chunks);
                rcv += value.length; chunks.push(value);
                
                // Animação Chunks
                let chk = this.add.rectangle(Phaser.Math.Between(w/2-300, w/2+300), h/2-60-Math.random()*50, 6, 6, 0x00ffff).setDepth(10000);
                this.tweens.add({ targets: chk, x: (w/2-300)+barraProg.width, y: h/2+20, alpha: 0, duration: 300, onComplete: () => chk.destroy() });
                
                if (total) {
                    barraProg.width = 600 * (rcv / total);
                    txtPercent.setText(`${(rcv/1024/1024).toFixed(1)}MB / ${(total/1024/1024).toFixed(1)}MB`);
                }
                return ler();
            });
            return ler();
        }).then(blob => {
            titulo.setText('[ CONCLUÍDO! Instala o .exe ]'); txtPercent.destroy();
            let a = document.createElement('a'); a.href = window.URL.createObjectURL(blob); a.download = `Sons.of.Echoes.Setup.${versaoAlvo}.exe`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(a.href);
        }).catch(err => {
            txtPercent.setText('A transferir via Chrome...');
            let a = document.createElement('a'); a.href = url; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });
    }

    // =========================================================================
    // MÉTODOS DE BASE (Áudio, Botões)
    // =========================================================================
    iniciarAudioMenu() {
        if (!this.sound.get('musica_menu')) this.sound.add('musica_menu', { loop: true, volume: 0.6 }).play({ seek: 70 });
        else if (!this.sound.get('musica_menu').isPlaying) this.sound.get('musica_menu').play({ seek: 70 });
        
        if (!this.sound.get('som_noite')) this.sound.add('som_noite', { loop: true, volume: 0.25 }).play();
        else if (!this.sound.get('som_noite').isPlaying) this.sound.get('som_noite').play();
    }

    dispararFadeDoTitulo() {
        let title = this.add.sprite(480, 220, 'titulo_animado').setOrigin(0.5).setDepth(10).setScale(1.8).setAlpha(0);
        this.tweens.add({
            targets: [title, ...this.elementosMenu], alpha: 1, duration: 1200,
            onComplete: () => {
                if (!localStorage.getItem('orin_nickname')) document.getElementById('name-input-container').style.display = 'block';
                else if (typeof window.verificarChangelogAuto === 'function') window.verificarChangelogAuto();
            }
        });
        title.play('play_titulo');
    }

    iniciarTransitionJogo(cenaDestino, dados) {
        if (this.eventoMonstros) this.eventoMonstros.remove(); 
        this.sound.stopByKey('grunhido1'); this.sound.stopByKey('grunhido2');
        let m = this.sound.get('musica_menu'); let n = this.sound.get('som_noite');

        if (m) this.tweens.add({ targets: m, volume: 0, duration: 400, onComplete: () => { m.setSeek(245); this.tweens.add({ targets: m, volume: 0.7, duration: 2500 }); } });
        if (n) this.tweens.add({ targets: n, volume: 0, duration: 4000 });

        this.cameras.main.fadeOut(4000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (m) m.stop(); if (n) n.stop(); this.scene.start(cenaDestino, dados);
        });
    }

    prepararRestoDoMenu(w, h) {
        this.nomeJogador = localStorage.getItem('orin_nickname') || "Desconhecido";

        if (this.mensagemErro) {
            this.sound.play('som_erro', { volume: 0.6 }); 
            let cx = this.add.rectangle(w / 2, h / 2 - 20, 500, 80, 0xcc0000).setOrigin(0.5).setDepth(100).setStrokeStyle(2, 0xffffff); 
            let txt = this.add.text(w / 2, h / 2 - 20, this.mensagemErro, { fontFamily: 'retroFont', fontSize: '26px', fill: '#ffffff', align: 'center' }).setOrigin(0.5).setDepth(101);
            this.time.delayedCall(5000, () => this.tweens.add({ targets: [cx, txt], alpha: 0, duration: 1000, onComplete: () => { cx.destroy(); txt.destroy(); this.mensagemErro = null; } }));
        }

        const criarBtn = (img, y, imgClk, clickFunc) => {
            this.anims.create({ key: `h_${img}`, frames: this.anims.generateFrameNumbers(img, { start: 0, end: 10 }), frameRate: 15, repeat: -1 });
            this.anims.create({ key: `c_${img}`, frames: this.anims.generateFrameNumbers(imgClk, { start: 0, end: 10 }), frameRate: 15, repeat: 0 });
            let b = this.add.sprite(480, y, img).setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).setDepth(15).setScale(2.0).setAlpha(0); 
            this.elementosMenu.push(b);
            b.on('pointerover', () => { if (b.texture.key === img) b.play(`h_${img}`); });
            b.on('pointerout', () => { if (b.texture.key === img) { b.anims.stop(); b.setFrame(0); } });
            b.on('pointerdown', () => { if (b.texture.key !== imgClk) { b.setTexture(imgClk).play(`c_${img}`); clickFunc(b); } });
        };

        criarBtn('btn_new_game', 430, 'btn_new_game_click', () => this.iniciarTransitionJogo('SceneAndar', { modo: 'singleplayer', nome: this.nomeJogador }));
        criarBtn('btn_continue', 510, 'btn_continue_click', () => this.iniciarTransitionJogo('L1', { modo: 'singleplayer', nome: this.nomeJogador }));
        criarBtn('btn_multiplayer', 590, 'btn_multiplayer_click', () => this.iniciarTransitionJogo('ConnectionScene', { isSpectatorMode: false, nome: this.nomeJogador }));
        criarBtn('btn_options', 670, 'btn_options_click', (b) => b.once('animationcomplete', () => { window.alert("Controlos: Setas p/ mover, Shift p/ correr, J p/ Orbe."); b.setTexture('btn_options').setFrame(0); }));
        criarBtn('btn_exit', 750, 'btn_exit_click', (b) => b.once('animationcomplete', () => { if(this.sound.get('musica_menu')) this.sound.get('musica_menu').stop(); window.close(); }));

        this.add.text(20, 20, 'Ver Changelog', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff' }).setInteractive({ useHandCursor: true }).on('pointerdown', () => window.abrirChangelog());
        this.textoViajante = this.add.text(w - 50, h - 50, `Viajante: ${this.nomeJogador}`, { fontFamily: 'retroFont', fontSize: '24px', fill: '#aaaaaa' }).setOrigin(1, 0.5).setAlpha(0).setInteractive({ useHandCursor: true });
        this.elementosMenu.push(this.textoViajante);
        this.textoViajante.on('pointerdown', () => { let c = document.getElementById('name-input-container'); if(c) c.style.display = 'block'; });
        window.atualizarNomeMenu = (n) => { this.nomeJogador = n; if(this.textoViajante) this.textoViajante.setText(`Viajante: ${n}`); };
    }
}