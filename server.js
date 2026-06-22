const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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
    const isEspectador = socket.handshake.query.tipo === 'espectador';

    socket.emit('estadoInicialEstatua', estatuaPronta);

    socket.on('entrarNoJogo', (nomeDoJogador) => {
        if (isEspectador) {
            console.log('👁️ O Mestre ativou o Radar de Espectador! ID:', socket.id);
            socket.emit('jogadoresAtuais', jogadores); 
        } else {
            if (Object.keys(jogadores).length >= MAX_JOGADORES) {
                socket.emit('servidorCheio');
                socket.disconnect(true);
                return;
            }

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
        }
    });

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
        if (!isEspectador && jogadores[socket.id]) { 
            delete jogadores[socket.id];
            io.emit('jogadorDesconectado', socket.id);
        }
    });
});

setInterval(() => { io.emit('pingServidor', Date.now()); }, 2000);

http.listen(3000, () => { console.log('⚡ Servidor a rolar! Lotação Máxima: 7 Jogadores.'); });