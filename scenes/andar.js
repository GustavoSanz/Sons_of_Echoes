class SceneAndar extends Phaser.Scene {
    constructor() { super({ key: 'SceneAndar' }); }
    
    init(data) { this.dadosJogador = data; }

    create() {
        let w = this.cameras.main.width; let h = this.cameras.main.height;
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(2000, 0, 0, 0); 

        // ==========================================
        // 🎵 1. SOM DA CHUVA (FADE IN)
        // ==========================================
        this.somChuva = this.sound.add('som_chuva', { loop: true, volume: 0 }); 
        this.somChuva.play();
        this.tweens.add({ targets: this.somChuva, volume: 0.6, duration: 2000, ease: 'Linear' });

        // ==========================================
        // 🌲 2. FUNDO PERFEITO
        // ==========================================
        this.add.image(w / 2, h / 2, 'andar_fundo').setDisplaySize(w, h).setDepth(0);
        this.add.image(w / 2, h / 2, 'andar_arvores').setDisplaySize(w, h).setDepth(1);
        this.add.image(w / 2, h / 2, 'andar_chao').setDisplaySize(w, h).setDepth(2);

        // ==========================================
        // 🌧️ 3. CHUVA VISUAL
        // ==========================================
        this.anims.create({ key: 'chuva_loop', frames: this.anims.generateFrameNumbers('chuva_anim', { start: 0, end: 4 }), frameRate: 15, repeat: -1 });
        this.chuvaSprite = this.add.sprite(w / 2, h / 2, 'chuva_anim').setDisplaySize(w, h).setDepth(10).setAlpha(0.6).play('chuva_loop');

        // ==========================================
        // 🧙‍♂️ 4. ORIN E A COREOGRAFIA
        // ==========================================
        this.anims.create({ key: 'walk_orig', frames: this.anims.generateFrameNumbers('walk_Original'), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'idle_orig', frames: this.anims.generateFrameNumbers('idle_Original'), frameRate: 10, repeat: -1 });
        
        let alturaRelva = (h / 2) + 160; 
        this.player = this.add.sprite(-150, alturaRelva, 'idle_Original').setOrigin(0.5, 1).setDepth(5).setScale(0.55).play('walk_orig');

        // FASE 1: Caminha até ao meio
        this.tweens.add({
            targets: this.player, x: w / 2, duration: 5000, ease: 'Linear',
            onComplete: () => {
                this.player.play('idle_orig'); 
                
                // CHAMA O DIÁLOGO
                this.mostrarFalaImprovisada(w, h, () => {
                    
                    // FASE 2: Caminha para fora do ecrã
                    this.player.play('walk_orig');
                    this.tweens.add({
                        targets: this.player, x: w + 200, duration: 4000, ease: 'Linear', delay: 200, 
                        onComplete: () => { this.dispararIntroInicio(w, h); }
                    });
                });
            }
        });
    }

    // ==========================================
    // 💬 LÓGICA DA CAIXA DE DIÁLOGO (MÚLTIPLAS FALAS)
    // ==========================================
    mostrarFalaImprovisada(w, h, callbackContinuar) {
        this.caixaDialogo = this.add.group();
        let fundoCaixa = this.add.rectangle(w / 2, h - 120, 800, 150, 0x000000, 0.85).setStrokeStyle(4, 0xffffff).setDepth(100);
        let retratoCaixa = this.add.rectangle(w / 2 - 300, h - 120, 100, 100, 0x555555).setStrokeStyle(2, 0xffffff).setDepth(101);
        let textoNome = this.add.text(w / 2 - 220, h - 170, "Orin", { fontFamily: retroFont, fontSize: '32px', fill: '#00ffff' }).setDepth(101);
        let textoFala = this.add.text(w / 2 - 220, h - 130, "", { fontFamily: retroFont, fontSize: '28px', fill: '#ffffff', wordWrap: { width: 580 } }).setDepth(101);
        let textoContinuar = this.add.text(w / 2 + 380, h - 60, "Clica para avançar \u25B6", { fontFamily: retroFont, fontSize: '20px', fill: '#aaaaaa' }).setOrigin(1, 1).setDepth(101).setAlpha(0);
        
        this.caixaDialogo.addMultiple([fundoCaixa, retratoCaixa, textoNome, textoFala, textoContinuar]);
        this.caixaDialogo.setAlpha(0);

        // 📜 A TUA MINI HISTÓRIA AQUI!
        let historia = [
            "A tempestade está a piorar. Os ecos deste castelo estão cada vez mais altos...",
            "Sinto uma magia corrompida a emanar daquelas pedras. Os Klebinhos eram apenas o aviso.",
            "Tenho de encontrar a origem desta escuridão... antes que consuma tudo."
        ];
        
        let paginaAtual = 0;
        let escrevendo = false;
        let timerTexto = null;

        // Função que digita o texto letra a letra
        let iniciarEscrita = () => {
            escrevendo = true;
            textoFala.setText("");
            textoContinuar.setAlpha(0);
            let mensagemAtual = historia[paginaAtual];
            let contadorLetras = 0;

            timerTexto = this.time.addEvent({
                delay: 45, // Velocidade do texto
                repeat: mensagemAtual.length - 1,
                callback: () => {
                    textoFala.text += mensagemAtual[contadorLetras];
                    
                    // Som corrigido para 'som_fala'
                    if (mensagemAtual[contadorLetras] !== ' ') {
                        this.sound.play('som_fala', { volume: 0.15 }); 
                    }
                    contadorLetras++;

                    // Quando a frase termina
                    if (contadorLetras === mensagemAtual.length) {
                        escrevendo = false;
                        textoContinuar.setAlpha(1);
                        this.tweens.add({ targets: textoContinuar, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
                    }
                }
            });
        };

        // 1. Fade In das caixas
        this.tweens.add({ 
            targets: this.caixaDialogo.getChildren(), alpha: 1, duration: 500,
            onComplete: () => {
                iniciarEscrita(); // Começa a primeira frase

                // 2. Lógica do Clique do Rato
                this.input.on('pointerdown', () => {
                    if (escrevendo) {
                        // Se clicar enquanto escreve, força a frase a aparecer toda de uma vez (Skip)
                        timerTexto.remove();
                        textoFala.setText(historia[paginaAtual]);
                        escrevendo = false;
                        textoContinuar.setAlpha(1);
                        this.tweens.add({ targets: textoContinuar, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
                    } else {
                        // Se já acabou de escrever, avança para a próxima frase
                        this.tweens.killTweensOf(textoContinuar); 
                        paginaAtual++;
                        
                        if (paginaAtual < historia.length) {
                            iniciarEscrita(); // Escreve a próxima linha
                        } else {
                            // Acabaram as falas, fecha a caixa de diálogo
                            this.input.off('pointerdown'); 
                            this.tweens.add({
                                targets: this.caixaDialogo.getChildren(), alpha: 0, duration: 400,
                                onComplete: () => { 
                                    this.caixaDialogo.destroy(true); 
                                    callbackContinuar(); // Segue para o vídeo
                                }
                            });
                        }
                    }
                });
            }
        });
    }

   // ==========================================
    // 🎬 5. CUTSCENE FINAL (Corte Direto)
    // ==========================================
    dispararIntroInicio(w, h) {
        if (this.somChuva) { 
            this.tweens.add({ targets: this.somChuva, volume: 0, duration: 1500 }); 
        }

        this.add.rectangle(w / 2, h / 2, w * 2, h * 2, 0x000000).setDepth(2499);
        let videoFinal = this.add.video(w / 2, h / 2, 'intro_inicio').setOrigin(0.5).setDepth(2500); 
        videoFinal.play();

        this.input.on('pointerdown', () => {
            this.tweens.add({
                targets: videoFinal, alpha: 0, duration: 1000,
                onComplete: () => { 
                    videoFinal.stop(); 
                    if (this.somChuva) this.somChuva.stop(); 
                    this.scene.start('SceneTutorial', this.dadosJogador); 
                }
            });
        });

        videoFinal.on('complete', () => {
            this.tweens.add({
                targets: videoFinal, alpha: 0, duration: 1000, ease: 'Linear',
                onComplete: () => { 
                    videoFinal.destroy(); 
                    if (this.somChuva) this.somChuva.stop(); 
                    this.scene.start('SceneTutorial', this.dadosJogador); 
                }
            });
        });
    }
}