class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, cor) {
        super(scene, x, y, 'idle_' + cor);
        this.scene = scene;
        this.cor = cor;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.85);
        this.setDepth(5);
        this.body.setCollideWorldBounds(true);
        this.body.setSize(50, 140);
        this.body.setOffset(50, 50);

        this.vidaMax = 5;
        this.vidaAtual = 5;
        this.manaMax = 15;
        this.manaAtual = 15;
        
        this.isDead = false;
        this.isLyingDead = false;
        this.isCasting = false;
        this.isHurt = false;
        this.isInvulneravel = false;
        this.ultimoTiroTime = 0;
        this.estadoAtual = 'idle';
        this.tiroDisparado = false; // 🔥 Variável nova de segurança para o tiro

        if (!this.scene.isSpectatorMode) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
            this.keyJ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
            this.keyK = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
            this.keyL = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
        }

        this.on('animationcomplete', this.animacaoCompletada, this);
        this.on('animationupdate', this.animacaoEmAndamento, this);
        
        this.play('idle_' + this.cor);
    }

    animacaoCompletada(anim) {
        if (anim.key.includes('magic1')) { 
            this.isCasting = false; 
            this.tiroDisparado = false; // Reset da segurança
            this.mudarAnimacao('idle'); 
        } else if (anim.key.includes('hurt')) { 
            this.isHurt = false; 
            this.mudarAnimacao('idle'); 
        } else if (anim.key.includes('death1')) { 
            if (this.scene.isMultiplayer && this.scene.socket) this.scene.socket.emit('jogadorMorreu'); 
            if (this.scene.minhaLabel) this.scene.minhaLabel.destroy(); 
            this.destroy(); 
        } else if (anim.key.includes('death2')) { 
            this.setVelocity(0, 0); 
            this.body.setSize(120, 40); 
            this.body.setOffset(40, 150); 
            this.isLyingDead = true; 
            if (this.scene.minhaLabel) this.scene.minhaLabel.setVisible(false); 
        }
    }

    animacaoEmAndamento(anim, f) {
        // 🔥 Agora verifica se a frame passou da 6 e se ainda não atirou (Anti-Bug)
        if (anim.key.includes('magic1') && f.index >= 6 && !this.tiroDisparado) { 
            this.tiroDisparado = true;
            this.atirarMagia(); 
        }
    }

    mudarAnimacao(ch) { 
        if (!this.anims || this.scene.isSpectatorMode) return; 
        if (this.estadoAtual === ch) return; 
        this.estadoAtual = ch; 
        let a = ch + '_' + this.cor; 
        if (this.scene.anims.exists(a)) { this.play(a, true); }
    }

    receberDano() {
        if (this.isDead || this.isInvulneravel || this.scene.isSpectatorMode) return;
        this.scene.sound.play('som_hurt');
        this.isCasting = false; 
        this.vidaAtual--; 
        if (this.vidaAtual < 0) this.vidaAtual = 0; 
        
        if (this.scene.vidaUI) this.scene.vidaUI.setFrame(this.vidaAtual);
        
        if (this.vidaAtual <= 0) { 
            this.isDead = true; 
            this.setVelocityX(0); 
            this.mudarAnimacao('death2'); 
        } else { 
            this.isHurt = true; 
            this.setVelocityX(0); 
            this.mudarAnimacao('hurt'); 
            this.isInvulneravel = true; 
            this.setAlpha(0.6); 
            this.scene.time.delayedCall(200, () => { if (!this.isDead && this.active) this.setAlpha(1.0); }); 
            this.scene.time.delayedCall(1000, () => { this.isInvulneravel = false; if (!this.isDead && this.active) this.setAlpha(1.0); }); 
        }
    }

    atirarMagia() {
        if (this.scene.isSpectatorMode || this.isDead) return;
        const dir = this.flipX ? -1 : 1; 
        new OrbeMagico(this.scene, this.x + (51 * dir), this.y + 9, this.flipX);
    }

    updatePlayer(time, variaveisExternasBloqueadas) {
        if (this.scene.isSpectatorMode || this.isDead || this.isLyingDead) return;

        let isMagic = (this.estadoAtual === 'magic1' || this.isCasting);
        this.setOrigin(isMagic ? (this.flipX ? 0.6114 : 0.3886) : 0.5, isMagic ? 0.522 : 0.5);

        let oD = 50; let oE = 55;
        if (this.estadoAtual === 'walk_crouch') { oD = 100; oE = 105; }
        else if (isMagic) { oD = 50; oE = 98; }
        this.body.setOffset(this.flipX ? oE : oD, 50);

        let orinBloqueado = (this.isCasting || this.isHurt || variaveisExternasBloqueadas);

        // ==========================================
        // 1. BLOCO DE AÇÕES (ATAQUE E MORTE)
        // ==========================================
        if (!orinBloqueado) {
            if (Phaser.Input.Keyboard.JustDown(this.keyK)) { 
                this.vidaAtual = 0; if(this.scene.vidaUI) this.scene.vidaUI.setFrame(this.vidaAtual); 
                this.isDead = true; this.setVelocityX(0); this.mudarAnimacao('death1'); 
                return; 
            }
            else if (Phaser.Input.Keyboard.JustDown(this.keyL)) { 
                this.vidaAtual = 0; if(this.scene.vidaUI) this.scene.vidaUI.setFrame(this.vidaAtual); 
                this.isDead = true; this.setVelocityX(0); this.mudarAnimacao('death2'); 
                return; 
            }
            else if (Phaser.Input.Keyboard.JustDown(this.keyJ) && time > this.ultimoTiroTime + 800) {
                const noChao = this.body.blocked.down || this.body.touching.down;
                if (noChao && this.manaAtual >= 3) { 
                    this.manaAtual -= 3; 
                    if(this.scene.manaUI) this.scene.manaUI.setFrame(15 - this.manaAtual); 
                    this.isCasting = true; 
                    this.tiroDisparado = false;
                    this.ultimoTiroTime = time; 
                    this.setVelocityX(0); 
                    this.mudarAnimacao('magic1'); 
                    
                    // 🔥 O SEGREDO DO BUG ESTÁ AQUI! Pára a função para não cancelar a magia!
                    return; 
                }
            }
        }

        // Se estiver a castar ou magoado, salta a parte de andar imediatamente
        if (this.isCasting || this.isHurt || variaveisExternasBloqueadas) return;

        // ==========================================
        // 2. BLOCO DE MOVIMENTO
        // ==========================================
        const noChao = this.body.blocked.down || this.body.touching.down; 
        const aCorrer = this.shiftKey.isDown; 
        const aAgachar = this.cursors.down.isDown; 
        const pE = this.cursors.left.isDown; 
        const pD = this.cursors.right.isDown;
        let an = this.estadoAtual; 
        let pr = this.anims.getProgress();
        
        if (noChao) {
            if (aAgachar) { 
                if (an !== 'crouch' && an !== 'crouch_idle' && an !== 'walk_crouch') { this.setVelocityX(0); this.mudarAnimacao('crouch'); } 
                else if (an === 'crouch' && pr < 1) { this.setVelocityX(0); } 
                else { 
                    if (pE) { this.setVelocityX(-150); this.flipX = true; this.mudarAnimacao('walk_crouch'); } 
                    else if (pD) { this.setVelocityX(150); this.flipX = false; this.mudarAnimacao('walk_crouch'); } 
                    else { this.setVelocityX(0); this.mudarAnimacao('crouch_idle'); } 
                } 
            } else { 
                if (an === 'crouch' || an === 'crouch_idle' || an === 'walk_crouch') { this.setVelocityX(0); this.mudarAnimacao('stand_up'); } 
                else if (an === 'stand_up' && pr < 1) { this.setVelocityX(0); } 
                else { 
                    if (pE) { this.setVelocityX(aCorrer ? -500 : -250); this.flipX = true; this.mudarAnimacao(aCorrer ? 'run' : 'walk'); } 
                    else if (pD) { this.setVelocityX(aCorrer ? 500 : 250); this.flipX = false; this.mudarAnimacao(aCorrer ? 'run' : 'walk'); } 
                    else { this.setVelocityX(0); this.mudarAnimacao('idle'); } 
                } 
            }
            if (this.cursors.up.isDown && !aAgachar) { this.setVelocityY(-800); }
        } else { 
            if (pE) { this.setVelocityX(aCorrer ? -500 : -250); this.flipX = true; } 
            else if (pD) { this.setVelocityX(aCorrer ? 500 : 250); this.flipX = false; } 
            else { this.setVelocityX(0); } 
            if (this.body.velocity.y < 0) { this.mudarAnimacao('jump'); } else { this.mudarAnimacao('fall'); } 
        }
    }
}