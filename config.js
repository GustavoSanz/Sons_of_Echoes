const VERSAO_JOGO = "1.0.3";

// 1. Exporta para o Navegador (Phaser)
if (typeof window !== 'undefined') {
    window.VERSAO_JOGO = VERSAO_JOGO;
}

// 2. Exporta para o Servidor (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VERSAO_JOGO };
}