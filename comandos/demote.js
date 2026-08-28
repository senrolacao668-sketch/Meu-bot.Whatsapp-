// ╔══════════════════════════════════════════════╗
// ║   COMANDO: !demote                          ║
// ║   Remove admin do membro mencionado          ║
// ╚══════════════════════════════════════════════╝

const config = require('../config');

module.exports = {
  nome: 'demote',
  alias: ['demote', 'rebaixar'],
  descricao: '(ADM) Remove admin do membro mencionado do grupo',

  async executar(sock, from, Info, args) {
    try {
      if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ Este comando só funciona em grupos!' }, { quoted: Info });
      }

      const metadata = await sock.groupMetadata(from);
      const participantes = metadata.participants;
      const remetente = Info.key.participant || Info.key.remoteJid;

      const remetenteParticipante = participantes.find((p) => p.id === remetente);
      const isAdmin = remetenteParticipante?.admin === 'admin' || remetenteParticipante?.admin === 'superadmin';

      const numeroDono = config.NUMERO_DONO.replace(/[^0-9]/g, '');
      const isDono = numeroDono && remetente.replace(/[^0-9]/g, '').startsWith(numeroDono);

      if (!isAdmin && !isDono) {
        return sock.sendMessage(from, { text: '❌ Apenas *administradores* podem usar o *!demote*.' }, { quoted: Info });
      }

      const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      const botParticipante = participantes.find((p) => p.id === botId || p.id.startsWith(sock.user?.id?.split(':')[0]));
      const botEhAdmin = botParticipante?.admin === 'admin' || botParticipante?.admin === 'superadmin';

      if (!botEhAdmin) {
        return sock.sendMessage(from, { text: '🤖 Preciso ser *administrador* do grupo pra remover admin de alguém!' }, { quoted: Info });
      }

      const ctx = Info.message?.extendedTextMessage?.contextInfo;
      let alvos = [];
      if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) alvos = [...ctx.mentionedJid];
      if (ctx?.participant && !alvos.includes(ctx.participant)) alvos.push(ctx.participant);

      if (alvos.length === 0) {
        return sock.sendMessage(
          from,
          { text: `❌ Marque a mensagem da pessoa ou use *@menção*.\n\nExemplo: *${config.PREFIXO}demote @fulano*` },
          { quoted: Info }
        );
      }

      await sock.groupParticipantsUpdate(from, alvos, 'demote');
      await sock.sendMessage(
        from,
        { text: `⬇️ Membro(s) removido(s) de *administrador*!`, mentions: alvos },
        { quoted: Info }
      );
    } catch (err) {
      console.error('❌ Erro no comando !demote:', err);
      await sock.sendMessage(from, { text: '❌ Ocorreu um erro ao tentar remover o admin do membro.' }, { quoted: Info });
    }
  },
};
