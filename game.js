const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1500 },
            debug: false // Podes mudar para true se precisares de ver as hitboxes
        }
    },
    pixelArt: true,
    fps: { target: 60, forceSetTimeOut: true },
    // Adicionamos as cenas por ordem de execução (Level1 substitui a antiga TestScene)
// Adicionamos as cenas por ordem de execução
    scene: [BootScene, LoadingScene, MenuScene, SceneAndar, ConnectionScene, SceneTutorial, Level1, SceneGrutaExterior, SceneGruta, SceneGrutaDescida]};

// Iniciar o jogo
new Phaser.Game(config);
