// ╔══════════════════════════════════════╗
// ║   COMANDO: !menu                     ║
// ╚══════════════════════════════════════╝

const fs = require('fs');
const path = require('path');
const config = require('../config');

function getDataHoraBrasilia() {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const hora = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return { data, hora };
}

function gerarTextoMenu() {
  const { data, hora } = getDataHoraBrasilia();
  const p = config.PREFIXO;

  return (
    `╔══════════════════════╗\n` +
    `   ✨ ${config.NOME_BOT} ✨\n` +
    `╚══════════════════════╝\n\n` +
    `📅 ${data}  •  ⏰ ${hora}\n` +
    `👑 Dono: ${config.NOME_DONO}\n\n` +
    `──────── ◆ ADM ◆ ────────\n\n` +
    `🔨 ${p}ban — Remove membro do grupo\n` +
    `⬆️ ${p}promote — Torna membro admin\n` +
    `⬇️ ${p}demote — Remove admin do membro\n\n` +
    `──────── ◆ DIVERSÃO ◆ ────────\n\n` +
    `🖼️ ${p}figu — Transforma imagem/vídeo em figurinha\n\n` +
    `──────── ◆ IA ◆ ────────\n\n` +
    `🤖 ${p}ia [pergunta] — Conversa com a IA\n\n` +
    `──────── ✦ ────────\n` +
    `*${config.NOME_BOT}* sempre a postos!`
  );
}

module.exports = {
  nome: 'menu',
  alias: ['menu', 'ajuda', 'help', 'comandos'],
  descricao: 'Exibe a lista de comandos disponíveis',

  async executar(sock, from, Info, args) {
    const textoMenu = gerarTextoMenu();
    const imagemPath = path.resolve(process.cwd(), 'perfil.png');

    if (fs.existsSync(imagemPath)) {
      await sock.sendMessage(from, { image: { url: imagemPath }, caption: textoMenu }, { quoted: Info });
    } else {
      await sock.sendMessage(from, { text: textoMenu }, { quoted: Info });
    }
  },
};
