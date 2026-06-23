const express = require('express');
const app = express();

// CORREÇÃO 1: Mudei de 'http' para 'server' para bater certo com a linha 10!
const server = require('http').createServer(app);

// Define a versão oficial do jogo aqui!
const { VERSAO_JOGO } = require('./config.js');

const io = require('socket.io')(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(express.static(__dirname));

const jogadores = {};
const CORES_DISPONIVEIS = ['Original', 'Azul', 'Cinzento', 'Preto', 'Roxo', 'Verde', 'Vermelho'];
const MAX_JOGADORES = 7; 

let estatuaPronta = true;

function obterCorLivre() {
    const coresEmUso = Object.values(jogadores).map(j => j.cor);
    for (let cor of CORES_DISPONIVEIS) {
        if (!coresEmUso.includes(cor)) return cor;
    }
    return null;
}

io.on('connection', (socket) => {
    
    // 🛡️ VERIFICAÇÃO DE VERSÃO
    const versaoCliente = socket.handshake.query.versao;

    // CORREÇÃO 2: Alterado de VERSAO_OFICIAL para VERSAO_JOGO
    if (versaoCliente !== VERSAO_JOGO) {
        console.log(`❌ Jogador rejeitado: Versão ${versaoCliente || 'Desconhecida'} (Exigida: ${VERSAO_JOGO})`);
        
        // Envia o aviso para o jogador e corta a chamada
        socket.emit('erroVersao', { exigida: VERSAO_JOGO });
        socket.disconnect();
        return; 
    }

    // ==========================================
    // Se a versão estiver correta, o jogo segue!
    // ==========================================
    console.log('Um Viajante conectou-se com a versão correta!');
    
    // CORREÇÃO 3: Fui buscar o nome que o jogador envia no socket!
    const nomeDoJogador = socket.handshake.query.nome || "Orin Misterioso";

    const nomeFinal = (nomeDoJogador && nomeDoJogador.trim() !== "") ? nomeDoJogador.trim() : "Orin Misterioso";
    
    const nomeExiste = Object.values(jogadores).some(j => j.nome.toLowerCase() === nomeFinal.toLowerCase());
    if (nomeExiste) {
        console.log(`⛔ Bloqueado: Impostor tentou usar "${nomeFinal}"!`);
        socket.emit('nomeDuplicado', { code: 'ERR-001', nome: nomeFinal });
        socket.broadcast.emit('alertaServidor', `[SISTEMA] Um clone tentou roubar o nome "${nomeFinal}" e foi banido!`);
        socket.disconnect(true);
        return;
    }

    console.log(`🔮 ${nomeFinal} entrou na floresta! ID:`, socket.id);
    
    const corAtribuida = obterCorLivre();
    const offsetX = 400 + (Object.keys(jogadores).length * 60);

    jogadores[socket.id] = {
        x: offsetX, y: 700, id: socket.id, animacao: 'idle', flipX: false, cor: corAtribuida, ping: 0, 
        nome: nomeFinal
    };

    socket.emit('jogadoresAtuais', jogadores);
    socket.broadcast.emit('novoJogador', jogadores[socket.id]);
    
    // CORREÇÃO 5: Apaguei uma chaveta perdida que tinhas aqui e estragava o resto do ficheiro!

    socket.on('fecharEstatua', () => {
        if (estatuaPronta) {
            estatuaPronta = false;
            io.emit('estatuaSincroniza', false); 
            setTimeout(() => {
                estatuaPronta = true;
                io.emit('estatuaSincroniza', true); 
            }, 10000); 
        }
    });

    socket.on('pongCalculo', (tempoEnviado) => {
        if (jogadores[socket.id]) jogadores[socket.id].ping = Date.now() - tempoEnviado;
    });

    socket.on('jogadorMovimento', (dadosMovimento) => {
        if (jogadores[socket.id]) {
            jogadores[socket.id].x = dadosMovimento.x;
            jogadores[socket.id].y = dadosMovimento.y;
            jogadores[socket.id].animacao = dadosMovimento.animacao;
            jogadores[socket.id].flipX = dadosMovimento.flipX;
            socket.broadcast.emit('jogadorMovimentado', jogadores[socket.id]);
        }
    });

    socket.on('jogadorMorreu', () => {
        socket.broadcast.emit('removerMortoCompleto', socket.id);
    });

    socket.on('disconnect', () => {
        // CORREÇÃO 4: O "isEspectador" não existia, declarei-o para não dar erro.
        const isEspectador = socket.handshake.query.isSpectatorMode === 'true';
        if (!isEspectador && jogadores[socket.id]) { 
            delete jogadores[socket.id];
            io.emit('jogadorDesconectado', socket.id);
        }
    });

}); // <-- A chaveta principal do 'io.on' fecha aqui!

setInterval(() => { io.emit('pingServidor', Date.now()); }, 2000);

// CORREÇÃO 1: Alterado para 'server'
server.listen(3000, () => { console.log('⚡ Servidor a rolar! Lotação Máxima: 7 Jogadores.'); });