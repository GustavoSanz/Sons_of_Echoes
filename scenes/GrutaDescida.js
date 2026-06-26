class SceneGrutaDescida extends Phaser.Scene {
    constructor() { super({ key: 'SceneGrutaDescida' }); }
    
    // ==========================================
    // 📦 CARREGAMENTO DO MAPA TILED
    // ==========================================
    preload() {
        // MUITO IMPORTANTE: Substitui pelo caminho correto do teu ficheiro JSON!
        // Se já carregas isto no teu ecrã de Loading, podes apagar este preload.
        this.load.tilemapTiledJSON('mapa_gruta', 'assets/Fundo/Profundo/gruta_hitboxes.json');
    }

    init(data) {
        this.dadosJogador = data || {};
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

        // Fundos forçados a bater certo com os limites do mapa
        this.add.image(0, 0, 'Gruta_Fundo').setOrigin(0, 0).setDepth(0).setDisplaySize(wMapa, hMapa);
        this.add.image(0, 0, 'Gruta_plataformas').setOrigin(0, 0).setDepth(1).setDisplaySize(wMapa, hMapa);

        // ==========================================
        // 🧱 HITBOXES (MÉTODO PROFISSIONAL - TILED)
        // ==========================================
        this.platforms = this.physics.add.staticGroup();
        this.blocosVisuais = [];

        // 1. Inicia o mapa do Tiled
        const map = this.make.tilemap({ key: 'mapa_gruta' });
        
        // 2. Lê a camada de objetos chamada "Colisoes" (TEM de ter este nome exato no Tiled)
        const layerColisoes = map.getObjectLayer('Colisoes');

        // 3. Constrói tudo automaticamente!
        if (layerColisoes) {
            layerColisoes.objects.forEach(objeto => {
                let centroX = objeto.x + (objeto.width / 2);
                let centroY = objeto.y + (objeto.height / 2);

                let retangulo = this.add.rectangle(centroX, centroY, objeto.width, objeto.height, 0x00ff00, this.modoXRay ? 0.4 : 0).setDepth(9999);
                this.physics.add.existing(retangulo, true);
                this.platforms.add(retangulo);
                this.blocosVisuais.push(retangulo);
            });
        }

        // Chão de segurança (Gatilho de Fim de Nível) - Mantido manual para a transição!
        let chaoFisica = this.add.rectangle(wMapa/2, hMapa - 50, wMapa, 100, 0xff0000, this.modoXRay ? 0.4 : 0); 
        this.physics.add.existing(chaoFisica, true); 
        this.blocosVisuais.push(chaoFisica);
        this.terminouDescida = false;

        // ==========================================
        // 🗿 ESTÁTUA DE MANA (Mantida comentada como deixaste)
        // ==========================================
        /* if (!this.anims.exists('estatua_fechada')) {
            this.anims.create({ key: 'estatua_fechada', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
            this.anims.create({ key: 'estatua_aberta', frames: this.anims.generateFrameNumbers('estatua_mana', { start: 4, end: 7 }), frameRate: 6, repeat: -1 });
        }
        this.estatua = this.physics.add.sprite(1200, 400, 'estatua_mana').setScale(0.45).setDepth(4.5);
        this.physics.add.collider(this.estatua, this.platforms);
        this.estatua.body.setAllowGravity(false);
        this.estatua.isAvailable = true;
        this.estatua.play('estatua_aberta');
        this.ultimoTickMana = 0;
        */

        // ==========================================
        // 🧙‍♂️ O JOGADOR (ORIN) E TRANSIÇÕES
        // ==========================================
        this.player = new Player(this, 1400, 200, this.minhaCor);
        
        // CORREÇÃO: Guardar o collider na variável para o "Modo Voo" conseguir desligá-lo!
        this.colisaoPlataformas = this.physics.add.collider(this.player, this.platforms);
        
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        
        if (this.dadosJogador.vidaAtual !== undefined) this.player.vidaAtual = this.dadosJogador.vidaAtual;
        if (this.dadosJogador.manaAtual !== undefined) this.player.manaAtual = this.dadosJogador.manaAtual;

        // Bater no fundo da gruta passa para a próxima cena
        this.physics.add.overlap(this.player, chaoFisica, () => {
            if (!this.terminouDescida) {
                this.terminouDescida = true;
                this.cameras.main.fadeOut(2500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('SceneBoss', {
                        vidaAtual: this.player.vidaAtual,
                        manaAtual: this.player.manaAtual,
                        cor: this.minhaCor,
                        hasCleiton: this.hasCleiton
                    });
                });
            }
        });

        // UI Base
        this.add.rectangle(0, 0, vw, 150, 0x000000).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
        this.add.rectangle(0, vh, vw, 150, 0x000000).setOrigin(0, 1).setScrollFactor(0).setDepth(90);

        this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        
        this.vidaUI = this.add.sprite(30, 20, 'barravida_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.manaUI = this.add.sprite(30, 110, 'barramana_sprite').setOrigin(0, 0).setScrollFactor(0).setScale(0.5).setDepth(100); 
        this.vidaUI.setFrame(this.player.vidaAtual);
        this.manaUI.setFrame(15 - this.player.manaAtual);

        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // ==========================================
        // 🚀 MODO NOCLIP E MODO X-RAY
        // ==========================================
        this.textoCoords = this.add.text(20, 20, 'X: 0 | Y: 0', { 
            fontFamily: 'monospace', fontSize: '24px', fill: '#ffffff', backgroundColor: '#000000' 
        }).setScrollFactor(0).setDepth(2000);

        this.modoXRay = true;
        this.input.keyboard.on('keydown-H', () => {
            this.modoXRay = !this.modoXRay;
            this.blocosVisuais.forEach(bloco => {
                bloco.setFillStyle(bloco.fillColor, this.modoXRay ? 0.4 : 0);
            });
            console.log("X-Ray das Hitboxes:", this.modoXRay ? "LIGADO" : "DESLIGADO");
        });

        this.modoVoo = true;
        
        // Aplica o voo mal o Orin nasce
        this.player.body.setAllowGravity(false);
        this.colisaoPlataformas.active = false;

        this.input.keyboard.on('keydown-F', () => {
            this.modoVoo = !this.modoVoo;
            this.player.body.setAllowGravity(!this.modoVoo);
            this.colisaoPlataformas.active = !this.modoVoo;
            
            if (!this.modoVoo) this.player.setVelocity(0, 0); 
            console.log("Modo Voo (Noclip):", this.modoVoo ? "LIGADO" : "DESLIGADO");
        });

        let avisoTeclas = this.add.text(vw - 20, 20, '[PRESSIONA "H" PARA HITBOXES | "F" PARA VOAR]', { 
            fontFamily: 'monospace', fontSize: '18px', fill: '#00ff00', backgroundColor: '#000000' 
        }).setScrollFactor(0).setOrigin(1, 0).setDepth(2000);
        this.time.delayedCall(8000, () => avisoTeclas.destroy());

        // ==========================================
        // 🎢 RAMPAS MATEMÁTICAS (TERRAIN SNAPPING)
        // ==========================================
        // Formato: [X_Esquerda, Y_Esquerda, X_Direita, Y_Direita]
        this.rampasMatematicas = [
            
            [1163, 386, 1622, 510],
            
            // Adiciona aqui todas as rampas que precisares...
        ];

        // ==========================================
        // 🛹 A PRANCHA MÁGICA (Para o Terrain Snapping)
        // ==========================================
        // Criamos uma plataforma pequenina e invisível
        this.pranchaMagica = this.add.rectangle(0, -1000, 40, 20, 0xff00ff, this.modoXRay ? 0.6 : 0);
        this.physics.add.existing(this.pranchaMagica, true); // true = é uma plataforma estática
        this.physics.add.collider(this.player, this.pranchaMagica); // O Orin colide com ela!
        this.blocosVisuais.push(this.pranchaMagica); // Para a veres no X-Ray!
    }

    update(time, delta) {
        let ponteiro = this.input.activePointer;
        let pontoMundo = this.cameras.main.getWorldPoint(ponteiro.x, ponteiro.y);

        if (this.textoCoords) {
            this.textoCoords.setText(`X: ${Math.round(pontoMundo.x)} | Y: ${Math.round(pontoMundo.y)}`);
        }

        if (!this.player || !this.player.active) return;
        
        if (this.estatua && this.estatua.isAvailable) {
            if (Math.abs(this.player.x - this.estatua.x) < 80 && Math.abs(this.player.y - this.estatua.y) < 100 && this.player.cursors.down.isDown) {
                if (Phaser.Input.Keyboard.JustDown(this.player.cursors.down)) {
                    this.sound.play('som_txtund'); 
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

        let orinBloqueado = (this.player.isDead || this.player.isCasting || this.player.isHurt || this.modoVoo);
        this.player.updatePlayer(time, orinBloqueado);

        // ==========================================
        // 🚁 CONTROLO DO DRONE (VOO)
        // ==========================================
        if (this.modoVoo) {
            let velVoo = 1200; 
            this.player.setVelocity(0, 0); 
            
            if (this.player.cursors.left.isDown) this.player.setVelocityX(-velVoo);
            if (this.player.cursors.right.isDown) this.player.setVelocityX(velVoo);
            if (this.player.cursors.up.isDown) this.player.setVelocityY(-velVoo);
            if (this.player.cursors.down.isDown) this.player.setVelocityY(velVoo);
        }

        // ==========================================
        // 🧲 MOTOR DE TERRAIN SNAPPING (ELEVADOR + BOTAS MAGNÉTICAS)
        // ==========================================
        if (!this.modoVoo) {
            let estaNaRampa = false;

            for (let rampa of this.rampasMatematicas) {
                // Blindagem de segurança caso meças da direita para a esquerda
                let xEsq = Math.min(rampa[0], rampa[2]);
                let xDir = Math.max(rampa[0], rampa[2]);
                let yEsq = rampa[0] < rampa[2] ? rampa[1] : rampa[3];
                let yDir = rampa[0] < rampa[2] ? rampa[3] : rampa[1];

                // 1. O Orin está no espaço horizontal desta rampa?
                if (this.player.x >= xEsq && this.player.x <= xDir) {
                    
                    let m = (yDir - yEsq) / (xDir - xEsq);
                    
                    // 🛠️ Afinador (Se ele flutuar, aumenta este número para baixar a prancha)
                    let afinarAltura = 20; 
                    let alturaDoChao = yEsq + m * (this.player.x - xEsq) + afinarAltura;

                    // 🪄 ELEVADOR: Movemos a prancha exatamente para debaixo dele na linha matemática.
                    this.pranchaMagica.setX(this.player.x);
                    this.pranchaMagica.setY(alturaDoChao + (this.pranchaMagica.height / 2));
                    this.pranchaMagica.body.updateFromGameObject();

                    // ==========================================
                    // 🧲 BOTAS MAGNÉTICAS (A Fix da Descida!)
                    // ==========================================
                    let pesDoOrin = this.player.body.bottom;
                    let distanciaParaPrancha = alturaDoChao - pesDoOrin;

                    // Se a prancha desceu (foi mais fundo) e o Orin está prestes a flutuar...
                    // (O > -15 e < 30 garante que só puxa se ele estiver perto do chão.
                    // O velocity.y >= 0 garante que não lhe corta o salto a meio!)
                    if (distanciaParaPrancha > -15 && distanciaParaPrancha < 30 && this.player.body.velocity.y >= 0) {
                        
                        // Puxa o Orin IMEDIATAMENTE para baixo, colando-o à prancha!
                        this.player.y += distanciaParaPrancha; 
                        
                        // Atualiza a física para a câmara e o boneco não tremerem
                        this.player.body.updateFromGameObject();
                        
                        // Pára a gravidade (para não acumular velocidade de queda e estragar a animação)
                        this.player.body.setVelocityY(0); 
                    }

                    estaNaRampa = true;
                    break; 
                }
            }

            // Se ele saiu da rampa (foi para o chão plano ou saltou para fora)
            if (!estaNaRampa) {
                // Esconde a prancha lá bem no alto para ele não bater nela acidentalmente
                this.pranchaMagica.setY(-1000);
                this.pranchaMagica.body.updateFromGameObject();
            }
        }
    }
}