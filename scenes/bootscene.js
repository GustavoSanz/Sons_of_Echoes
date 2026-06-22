class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.spritesheet('loading_bar', 'assets/Menu/Loading_Bar.png', { frameWidth: 783, frameHeight: 81 });
    }

    create() {
        this.scene.start('LoadingScene');
    }
}

class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        let w = this.cameras.main.width;
        let h = this.cameras.main.height;
        
        // 🔥 TEXTO GRANDE E BARRA RESTAURADA
        let loadingText = this.add.text(w / 2, h / 2 - 80, 'A Carregar as Trevas...', { 
            fontFamily: retroFont, 
            fontSize: '42px', 
            fill: '#ffffff' 
        }).setOrigin(0.5);

        this.loadingSprite = this.add.sprite(w / 2, h / 2 + 20, 'loading_bar').setOrigin(0.5).setScale(1.2);
        
        this.load.on('progress', (v) => {
            this.loadingSprite.setFrame(Math.floor(v * 12));
        });

        this.load.on('complete', () => {
            loadingText.destroy();
        });
        
        // ASSETS DO MENU
        this.load.spritesheet('menu_bg_anim', 'assets/Menu/Manu_spritesheet.png', { frameWidth: 640, frameHeight: 360 });
        this.load.spritesheet('titulo_animado', 'assets/Menu/Titulo_Spritesheet.png', { frameWidth: 349, frameHeight: 113 });
        
        this.load.spritesheet('btn_new_game', 'assets/Menu/Botoes/New_game_hover.png', { frameWidth: 207, frameHeight: 22 });
        this.load.spritesheet('btn_new_game_click', 'assets/Menu/Botoes/New_game_click_final.png', { frameWidth: 207, frameHeight: 22 });
        this.load.spritesheet('btn_continue', 'assets/Menu/Botoes/Continue_hover.png', { frameWidth: 207, frameHeight: 22 });
        this.load.spritesheet('btn_continue_click', 'assets/Menu/Botoes/Continue_click.png', { frameWidth: 207, frameHeight: 22 });
        this.load.spritesheet('btn_multiplayer', 'assets/Menu/Botoes/Multiplayer_hover.png', { frameWidth: 207, frameHeight: 30 });
        this.load.spritesheet('btn_multiplayer_click', 'assets/Menu/Botoes/Multiplayer_click.png', { frameWidth: 207, frameHeight: 30 });
        this.load.spritesheet('btn_options', 'assets/Menu/Botoes/Options_hover.png', { frameWidth: 207, frameHeight: 29 });
        this.load.spritesheet('btn_options_click', 'assets/Menu/Botoes/Options_click.png', { frameWidth: 207, frameHeight: 29 });
        this.load.spritesheet('btn_exit', 'assets/Menu/Botoes/Exit_hover.png', { frameWidth: 207, frameHeight: 24 });
        this.load.spritesheet('btn_exit_click', 'assets/Menu/Botoes/Exit_click.png', { frameWidth: 207, frameHeight: 24 });
         

        // 🎵 ÁUDIOS
        this.load.audio('musica_menu', 'assets/audio/Audio_Menu.mp3');
        this.load.audio('som_noite', 'assets/audio/Noite.mp3');
        this.load.audio('grunhido1', 'assets/audio/grunhido1.mp3');
        this.load.audio('grunhido2', 'assets/audio/grunhido2.mp3');
        this.load.audio('som_chuva', 'assets/audio/Rain.mp3'); 
        this.load.audio('som_impacto', 'assets/audio/snd_impact.wav'); 
        this.load.audio('som_fala', 'assets/audio/snd_txtund.wav'); 
        this.load.audio('som_fala1', 'assets/audio/SND_TXT1.wav'); 
        this.load.audio('som_hurt', 'assets/audio/snd_hurt1.wav'); 
        this.load.audio('som_hurt_c', 'assets/audio/snd_hurt1_c.wav'); 
        this.load.audio('som_vitoria', 'assets/audio/snd_dumbvictory.wav');

        // 🎬 VÍDEOS
        this.load.video('intro_video', 'assets/Menu/Intro_v2.mp4');
        this.load.video('intro_inicio', 'assets/Fundo/CenaInicial/Intro_Inicio.mp4'); 

        // ASSETS CENA INICIAL
        const pastCenaIni = 'assets/Fundo/CenaInicial/';
        this.load.image('andar_fundo', pastCenaIni + 'fundo1.png');
        this.load.image('andar_arvores', pastCenaIni + 'arvores_02.png');
        this.load.image('andar_chao', pastCenaIni + 'Chao3.png');
        this.load.spritesheet('chuva_anim', pastCenaIni + 'Chuva.png', { frameWidth: 480, frameHeight: 270 });

        // ==========================================
        // 🌉 ASSETS DO TUTORIAL
        // ==========================================
        this.load.image('tuto_fundo', 'assets/Fundo/Tutorial/fundo.png'); 
        this.load.image('tuto_arvores', 'assets/Fundo/Tutorial/Arvores_02.png');
        this.load.image('tuto_ponte', 'assets/Fundo/Tutorial/Ponte_03.png');
        this.load.image('tuto_frente', 'assets/Fundo/Tutorial/frente_04.png');


        // ASSETS JOGO / UI
        const pastFundo = 'assets/Fundo/Parallax/';
        this.load.image('bg_1', pastFundo + 'Fundo.png');
        this.load.image('bg_2', pastFundo + 'Floresta_background.png');
        this.load.image('bg_3', pastFundo + 'Arvores_02.png');
        this.load.image('bg_4', pastFundo + 'chaofundo_03.png');
        this.load.image('bg_5', pastFundo + 'arvores_frente_05.png');
        this.load.image('bg_6', pastFundo + 'chaofrente_4.png');
        
        this.load.image('gruta_exterior', 'assets/Fundo/Gruta/Gruta_Background.png'); // Confirma se a pasta é esta!


       // Carrega o vídeo da gruta (ajusta o caminho da pasta se necessário)
        this.load.video('Gruta_Dentro', 'assets/Fundo/Fundo_dentro/Gruta_Dentro.mp4');
        
        this.load.image('Gruta_Fundo', 'assets/Fundo/Profundo/Gruta_fundo.png');
        this.load.image('Gruta_plataformas', 'assets/Fundo/Profundo/gruta_plataformas_02.png');


        this.load.image('fundo_subida', 'assets/Fundo/Profundo/Gruta_fundo.png');
        this.load.image('plataformas_subida', 'assets/Fundo/Profundo/gruta_plataformas_02.png');


        this.load.spritesheet('barravida_sprite', 'assets/Vida/BarraVida.png', { frameWidth: 927, frameHeight: 194 });
        this.load.spritesheet('barramana_sprite', 'assets/Vida/mana_bar.png', { frameWidth: 820, frameHeight: 159 });
        this.load.spritesheet('estatua_mana', 'assets/Objetos/Mana_Statue.png', { frameWidth: 419, frameHeight: 719 });
        this.load.spritesheet('orbe_magico', 'assets/Objetos/orbe_magico.png', { frameWidth: 368, frameHeight: 189 });
        this.load.spritesheet('moeda_sprite', 'assets/Objetos/Gemm.png', { frameWidth: 106, frameHeight: 145 });

        // PERSONAGENS 
        const pastOri = 'assets/Personagem/';
        this.load.spritesheet('idle_Original', pastOri + 'Idle.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('walk_Original', pastOri + 'Walk.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('jump_Original', pastOri + 'Jump.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('run_Original', pastOri + 'Run.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('hurt_Original', pastOri + 'Hurt.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('crouch_Original', pastOri + 'Agachar.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('walk_crouch_Original', pastOri + 'Walk_agachar.png', { frameWidth: 250, frameHeight: 190 });
        this.load.spritesheet('death1_Original', pastOri + 'Death01.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('death2_Original', pastOri + 'Death02.png', { frameWidth: 200, frameHeight: 190 });
        this.load.spritesheet('magic1_Original', pastOri + 'Power.png', { frameWidth: 193, frameHeight: 182 }); 

        const pastAzu = 'assets/Personagem/Multiplayer/Azul_escuro/';
        this.load.spritesheet('idle_Azul', pastAzu + 'Idle_DB.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('walk_Azul', pastAzu + 'Walk_DB.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('jump_Azul', pastAzu + 'Jump_DB.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('run_Azul', pastAzu + 'Run_DB.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('hurt_Azul', pastAzu + 'Hurt_DB.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('crouch_Azul', pastAzu + 'Agachar_DB.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('walk_crouch_Azul', pastAzu + 'Walk_agachar_DB.png', { frameWidth: 250, frameHeight: 190 });
        this.load.spritesheet('death1_Azul', pastAzu + 'Death01_DB.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('death2_Azul', pastAzu + 'Death02_DB.png', { frameWidth: 200, frameHeight: 190 });
        this.load.spritesheet('magic1_Azul', 'assets/Personagem/Power.png', { frameWidth: 193, frameHeight: 182 }); 

        const pastCin = 'assets/Personagem/Multiplayer/Cinzento/';
        this.load.spritesheet('idle_Cinzento', pastCin + 'Idle_grey.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('walk_Cinzento', pastCin + 'Walk_grey.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('jump_Cinzento', pastCin + 'Jump_grey.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('run_Cinzento', pastCin + 'Run_grey.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('hurt_Cinzento', pastCin + 'Hurt_grey.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('crouch_Cinzento', pastCin + 'Agachar_grey.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('walk_crouch_Cinzento', pastCin + 'Walk_agachar_grey.png', { frameWidth: 250, frameHeight: 190 });
        this.load.spritesheet('death1_Cinzento', pastCin + 'Death01_grey.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('death2_Cinzento', pastCin + 'Death02_grey.png', { frameWidth: 200, frameHeight: 190 });
        this.load.spritesheet('magic1_Cinzento', 'assets/Personagem/Power.png', { frameWidth: 193, frameHeight: 182 }); 

        const pastPre = 'assets/Personagem/Multiplayer/Preto/';
        this.load.spritesheet('idle_Preto', pastPre + 'Idle_Black.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('walk_Preto', pastPre + 'Walk_Black.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('jump_Preto', pastPre + 'Jump_Black.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('run_Preto', pastPre + 'Run_Black.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('hurt_Preto', pastPre + 'Hurt_Black.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('crouch_Preto', pastPre + 'Agachar_Black.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('walk_crouch_Preto', pastPre + 'Walk_agachar_Black.png', { frameWidth: 250, frameHeight: 190 });
        this.load.spritesheet('death1_Preto', pastPre + 'Death01_Black.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('death2_Preto', pastPre + 'Death02_Black.png', { frameWidth: 200, frameHeight: 190 });
        this.load.spritesheet('magic1_Preto', 'assets/Personagem/Power.png', { frameWidth: 193, frameHeight: 182 }); 

        const pastRox = 'assets/Personagem/Multiplayer/Roxo/';
        this.load.spritesheet('idle_Roxo', pastRox + 'Idle_p.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('walk_Roxo', pastRox + 'Walk_p.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('jump_Roxo', pastRox + 'Jump_p.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('run_Roxo', pastRox + 'Run_p.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('hurt_Roxo', pastRox + 'Hurt_p.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('crouch_Roxo', pastRox + 'Agachar_p.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('walk_crouch_Roxo', pastRox + 'Walk_agachar_p.png', { frameWidth: 250, frameHeight: 190 });
        this.load.spritesheet('death1_Roxo', pastRox + 'Death01_p.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('death2_Roxo', pastRox + 'Death02_p.png', { frameWidth: 200, frameHeight: 190 });
        this.load.spritesheet('magic1_Roxo', 'assets/Personagem/Power.png', { frameWidth: 193, frameHeight: 182 }); 

        const pastVer = 'assets/Personagem/Multiplayer/Verde/';
        this.load.spritesheet('idle_Verde', pastVer + 'Idle_Green.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('walk_Verde', pastVer + 'Walk_Green.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('jump_Verde', pastVer + 'Jump_Green.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('run_Verde', pastVer + 'Run_Green.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('hurt_Verde', pastVer + 'Hurt_Green.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('crouch_Verde', pastVer + 'Agachar_Green.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('walk_crouch_Verde', pastVer + 'Walk_agachar_Green.png', { frameWidth: 250, frameHeight: 190 });
        this.load.spritesheet('death1_Verde', pastVer + 'Death01_Green.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('death2_Verde', pastVer + 'Death02_Green.png', { frameWidth: 200, frameHeight: 190 });
        this.load.spritesheet('magic1_Verde', 'assets/Personagem/Power.png', { frameWidth: 193, frameHeight: 182 }); 

        const pastVerm = 'assets/Personagem/Multiplayer/Vermelho/';
        this.load.spritesheet('idle_Vermelho', pastVerm + 'Idle_Red.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('walk_Vermelho', pastVerm + 'Walk_Red.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('jump_Vermelho', pastVerm + 'Jump_Red.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('run_Vermelho', pastVerm + 'Run_Red.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('hurt_Vermelho', pastVerm + 'Hurt_Red.png', { frameWidth: 150, frameHeight: 190 });
        this.load.spritesheet('crouch_Vermelho', pastVerm + 'Agachar_Red.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('walk_crouch_Vermelho', pastVerm + 'Walk_agachar_Red.png', { frameWidth: 250, frameHeight: 190 });
        this.load.spritesheet('death1_Vermelho', pastVerm + 'Death01_Red.png', { frameWidth: 180, frameHeight: 190 });
        this.load.spritesheet('death2_Vermelho', pastVerm + 'Death02_Red.png', { frameWidth: 200, frameHeight: 190 });
        this.load.spritesheet('magic1_Vermelho', 'assets/Personagem/Power.png', { frameWidth: 193, frameHeight: 182 }); 

        // MONSTROS E INIMIGOS
        const pastMonstro = 'assets/Monstro/'; 
        this.load.spritesheet('monstro_chill', pastMonstro + 'chill.png', { frameWidth: 206, frameHeight: 70 });
        this.load.spritesheet('monstro_aware', pastMonstro + 'chill_Aware.png', { frameWidth: 300, frameHeight: 70 });
        this.load.spritesheet('monstro_walk', pastMonstro + 'Walk.png', { frameWidth: 235, frameHeight: 70 });
        this.load.spritesheet('monstro_attack', pastMonstro + 'attack.png', { frameWidth: 322, frameHeight: 99 });
        this.load.spritesheet('monstro_arremecar', pastMonstro + 'arremecar.png', { frameWidth: 242, frameHeight: 111 });
        this.load.spritesheet('monstro_power', pastMonstro + 'power.png', { frameWidth: 470, frameHeight: 49 });
        
        const pastKlebinho = 'assets/Monstro/Klebinho/'; 
        this.load.spritesheet('klebinho_idle', pastKlebinho + 'Idle.png', { frameWidth: 72, frameHeight: 64 });
        this.load.spritesheet('klebinho_attack', pastKlebinho + 'Attack-.png', { frameWidth: 116, frameHeight: 76 });
        this.load.spritesheet('klebinho_walk', pastKlebinho + 'Walk.png', { frameWidth: 60, frameHeight: 68 });
        this.load.spritesheet('klebinho_flecha', pastKlebinho + 'Flecha.png', { frameWidth: 276, frameHeight: 208 });

        const pastCleiton = 'assets/Objetos/';
        this.load.spritesheet('cleiton_idle', pastCleiton + 'Fruit-ezgif.com-gif-to-sprite-converter.png', { frameWidth: 448, frameHeight: 432 });
        this.load.spritesheet('cleiton_cura', pastCleiton + 'Fruit_2-ezgif.com-gif-to-sprite-converter.png', { frameWidth: 448, frameHeight: 432 });

        // ==========================================
        // 🎒 IMAGENS DO INVENTÁRIO (Corrigido para assets/Inventario/)
        // ==========================================
        const pastInv = 'assets/Inventario/'; 
        this.load.image('inv_fechado', pastInv + 'Inventario_fechado.png');
        this.load.image('inv_aberto', pastInv + 'Inventario_Personagem.png');
    }

    create() {
        this.scene.start('MenuScene');
    }
}