// ~/haxhost/sala.js
// LEMBRE-SE DE SALVAR ESTE ARQUIVO COMO UTF-8

const HaxballJS = require('haxball.js');

const roomName = process.argv[2];
const scriptAdminPassword = process.argv[3];
const haxToken = process.argv[4];

if (!roomName || !scriptAdminPassword || !haxToken) {
    console.error("ERRO_SALA_JS_ARGS: Faltando nome da sala, senha de admin ou token HaxBall!");
    console.log("ERROR_CREATING_ROOM:Argumentos invalidos para sala.js (nome, senha admin, token)");
    process.exit(1);
}

const haxTokenSubstring = haxToken ? haxToken.substring(0, 10) : "NULO";
console.log(`[SALA.JS INICIO] Processo ${process.pid}. Recebido: Nome='${roomName}', SenhaAdmin='${scriptAdminPassword.substring(0,3)}...', Token='${haxTokenSubstring}...'`);

HaxballJS().then((HBInit) => {
    console.log(`[SALA.JS ${process.pid}] HBInit obtido. Tentando criar a sala...`);
    try {
        const room = HBInit({
            roomName: roomName,
            password: null,
            maxPlayers: 16,
            public: true,
            token: haxToken,
            geo: { code: "BR", lat: -23.55, lon: -46.63 }
        });

        console.log(`[SALA.JS ${process.pid}] Chamada HBInit({...}) feita.`);

        if (!room) {
            console.error(`[SALA.JS ${process.pid}] CRÍTICO: Objeto 'room' é NULO ou INDEFINIDO após HBInit!`);
            console.log("ERROR_CREATING_ROOM:Falha_critica_HBInit_room_nulo");
            process.exit(1);
            return;
        }

        let linkPrinted = false;
        const roomLinkTimeoutMs = 20000; 
        let roomStartTime = null;

        const printRoomLinkAndSetup = (link) => {
            if (!linkPrinted && link) {
                console.log("ROOM_LINK_PUBLIC:" + link);
                linkPrinted = true;
                roomStartTime = Date.now();

                if (linkErrorTimeout) clearTimeout(linkErrorTimeout);

                const internalLog = (message) => { console.log(`[SALA ${roomName} - PID ${process.pid}] ${message}`); };
                internalLog(`Sala "${roomName}" iniciada! Link: ${link}`);

                try {
                    room.setScoreLimit(3);
                    room.setTimeLimit(3); 
                    const DUAS_HORAS_EM_MS = 2 * 60 * 60 * 1000;
                    internalLog(`Esta sala será fechada em aproximadamente 2 horas.`);

                    setTimeout(() => {
                        internalLog(`Fechando sala "${roomName}" após 2 horas.`);
                        try {
                            room.sendAnnouncement("🕒 Tempo esgotado! Esta sala temporária da Hax Host será fechada em instantes. Obrigado por jogar!", null, 0xFFCC00, "bold", 1);
                        } catch(e) { internalLog("Erro ao enviar announcement de tempo esgotado (sala pode já ter fechado): " + e.message); }
                       
                        setTimeout(() => {
                            try { room.stopGame(); } catch(e){ internalLog("Erro ao tentar room.stopGame(): " + e.message); }
                            internalLog("Saindo do processo da sala.");
                            process.exit(0);
                        }, 5000); 
                    }, DUAS_HORAS_EM_MS);

                    room.onPlayerJoin = (player) => {
                        internalLog(`Jogador entrou: ${player.name} (ID: ${player.id})`);
                        room.sendAnnouncement(`👋 Bem-vindo(a) ${player.name} à sala "${roomName}" da Hax Host!`, player.id, 0x66FF66, "normal", 0);
                       
                        let tempoRestanteMinutos = Math.floor((DUAS_HORAS_EM_MS - (Date.now() - roomStartTime)) / 60000);
                        if (tempoRestanteMinutos < 0) tempoRestanteMinutos = 0;
                        room.sendAnnouncement(`⏳ Esta é uma sala temporária e fechará em aproximadamente ${tempoRestanteMinutos} minuto(s).`, player.id, 0x66CCFF, "italic", 0);
                        room.sendAnnouncement(`🔑 Se você é o criador com a senha '${scriptAdminPassword.substring(0,3)}...', digite !admin SUA_SENHA_COMPLETA para obter privilégios.`, player.id, 0xFFFF66, "italic", 0);
                    };
                    room.onPlayerLeave = (player) => { internalLog(`Jogador saiu: ${player.name}`); };
                    room.onPlayerChat = (player, message) => {
                        internalLog(`Chat: ${player.name}: ${message}`);
                        if (message.startsWith("!admin ")) {
                            const senhaTentada = message.substring("!admin ".length).trim();
                            if (senhaTentada === scriptAdminPassword) {
                                room.setPlayerAdmin(player.id, true);
                                room.sendAnnouncement(`⭐ ${player.name} agora é administrador da sala!`, null, 0x00FF00, "bold", 1);
                                internalLog(`${player.name} (ID: ${player.id}) se tornou admin.`);
                            } else {
                                room.sendAnnouncement("❌ Senha de admin incorreta.", player.id, 0xFF0000, "bold", 2);
                                internalLog(`Tentativa de admin falhou para ${player.name} (ID: ${player.id}).`);
                            }
                            return false; 
                        }
                        return true;
                    };
                    room.onKicked = (kickedPlayer, reason, ban, byPlayer) => { internalLog(`${kickedPlayer.name} foi kickado por ${byPlayer ? byPlayer.name : "sistema"} (${reason}) ${ban ? " (banido)" : ""}`); };
                    room.onGameStart = (byPlayer) => { internalLog(`Jogo iniciado ${byPlayer ? 'por ' + byPlayer.name : ''}`)};
                    room.onGameStop = (byPlayer) => { internalLog(`Jogo parado ${byPlayer ? 'por ' + byPlayer.name : ''}`)};
                    room.onGamePause = (byPlayer) => { internalLog(`Jogo pausado ${byPlayer ? 'por ' + byPlayer.name : ''}`)};
                    room.onGameUnpause = (byPlayer) => { internalLog(`Jogo despausado ${byPlayer ? 'por ' + byPlayer.name : ''}`)};
                } catch(e_setup) {
                    internalLog(`ERRO durante setup pós-link: ${e_setup.message}`);
                }
            }
        };

        if (room && room.roomId) {
             printRoomLinkAndSetup(`https://www.haxball.com/play?c=${room.roomId}`);
        }
        room.onRoomLink = (link) => {
            console.log(`[SALA.JS ${process.pid}] Evento onRoomLink disparado! Link: ${link}`);
            printRoomLinkAndSetup(link);
        };

        const linkErrorTimeout = setTimeout(() => {
            if (!linkPrinted) {
                console.error(`[SALA.JS ${process.pid}] Timeout (${roomLinkTimeoutMs/1000}s): Link não obtido. Token: ${haxTokenSubstring}...`);
                console.log(`ERROR_CREATING_ROOM:Timeout_ao_obter_link_verifique_token_ou_API_HaxBall`);
                try { if (room && typeof room.stopGame === 'function') room.stopGame(); } catch(e) { /* ignora */ }
                process.exit(1);
            }
        }, roomLinkTimeoutMs);

    } catch (e) {
        console.error(`[SALA.JS ${process.pid}] Erro GERAL no try principal (ao chamar HBInit ou configurar sala):`, e);
        console.log("ERROR_CREATING_ROOM:" + (e.message || "Erro_na_inicializacao_interna_da_sala"));
        process.exit(1);
    }
}).catch((err) => {
    console.error(`[SALA.JS ${process.pid}] ERRO FATAL no HaxballJS() ou Promise Rejeitada:`, err);
    console.log("ERROR_CREATING_ROOM:" + (err.message || "Erro_fatal_na_biblioteca_HaxballJS"));
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[SALA.JS ${process.pid}] Unhandled Rejection at:`, promise, 'reason:', reason);
  console.log("ERROR_CREATING_ROOM:Unhandled_Rejection_no_sala_js");
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error(`[SALA.JS ${process.pid}] Uncaught Exception:`, err);
  console.log("ERROR_CREATING_ROOM:Uncaught_Exception_no_sala_js");
  process.exit(1);
});
