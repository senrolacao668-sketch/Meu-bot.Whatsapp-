// ╔══════════════════════════════════════════════╗
// ║   COMANDO: !ban                              ║
// ║   Remove um membro do grupo (apenas ADM)    ║
// ╚══════════════════════════════════════════════╝

const config = require('../config');

module.exports = {
  // Nome que ativa este comando
  nome: 'ban',
  alias: ['ban', 'remover', 'kick'],

  // Descrição exibida no menu
  descricao: '(ADM) Remove o membro mencionado do grupo',

  // Função executada quando o comando é chamado
  async executar(sock, from, Info, args) {
    try {
      // ── 1. Verifica se é um grupo ────────────────────────────────
      if (!from.endsWith('@g.us')) {
        return sock.sendMessage(
          from,
          { text: '❌ Este comando só funciona em grupos!' },
          { quoted: Info }
        );
      }

      // ── 2. Busca os dados do grupo ───────────────────────────────
      const metadata = await sock.groupMetadata(from);
      const participantes = metadata.participants;

      // Quem enviou o comando
      const remetente = Info.key.participant || Info.key.remoteJid;

      // Verifica se o remetente é administrador do grupo
      const remetenteParticipante = participantes.find((p) => p.id === remetente);
      const isAdmin = remetenteParticipante?.admin === 'admin' || remetenteParticipante?.admin === 'superadmin';

      // Verifica se o remetente é o dono do bot
      const numeroDono = config.NUMERO_DONO.replace(/[^0-9]/g, '');
      const isDono = remetente.replace(/[^0-9]/g, '').startsWith(numeroDono);

      // ── 3. Bloqueia se não for admin nem dono ────────────────────
      if (!isAdmin && !isDono) {
        return sock.sendMessage(
          from,
          { text: '❌ Apenas *administradores* podem usar o *!ban*.' },
          { quoted: Info }
        );
      }

      // ── 4. Verifica se o bot é admin ─────────────────────────────
      const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      const botParticipante = participantes.find((p) => p.id === botId || p.id.startsWith(sock.user?.id?.split(':')[0]));
      const botEhAdmin = botParticipante?.admin === 'admin' || botParticipante?.admin === 'superadmin';

      if (!botEhAdmin) {
        return sock.sendMessage(
          from,
          { text: '🤖 Preciso ser *administrador* do grupo para remover alguém!' },
          { quoted: Info }
        );
      }

      // ── 5. Identifica quem deve ser banido ───────────────────────
      const ctx = Info.message?.extendedTextMessage?.contextInfo;
      let alvos = [];

      // Mencionados via @
      if (ctx?.mentionedJid && ctx.mentionedJid.length > 0) {
        alvos = [...ctx.mentionedJid];
      }
      // Mensagem citada (reply)
      if (ctx?.participant && !alvos.includes(ctx.participant)) {
        alvos.push(ctx.participant);
      }

      if (alvos.length === 0) {
        return sock.sendMessage(
          from,
          { text: `❌ Marque a mensagem da pessoa ou use *@menção* para indicar quem deve ser banido.\n\nExemplo: *${config.PREFIXO}ban @fulano*` },
          { quoted: Info }
        );
      }

      // ── 6. Processa cada alvo ─────────────────────────────────────
      let mensagem = `🔨 *BAN no grupo "${metadata.subject}"* 🔨\n\n`;
      const mencoes = []; // JIDs para marcar na mensagem

      for (const alvo of alvos) {
        const alvoParticipante = participantes.find((p) => p.id === alvo);
        const nomeAlvo = alvoParticipante?.notify || alvo.split('@')[0];

        // Protege o dono do bot de ser banido
        const alvoNumero = alvo.split('@')[0].replace(/[^0-9]/g, '');
        if (alvoNumero.startsWith(numeroDono)) {
          mensagem += `👑 @${nomeAlvo} sou o dono — sigo invencível! 😂\n`;
          mencoes.push(alvo);
          continue;
        }

        // Verifica se o alvo está no grupo
        if (!alvoParticipante) {
          mensagem += `⚠️ @${nomeAlvo} não está no grupo.\n`;
          mencoes.push(alvo);
          continue;
        }

        // Tenta remover o alvo
        try {
          await sock.groupParticipantsUpdate(from, [alvo], 'remove');
          mensagem += `🚨 @${nomeAlvo} foi *REMOVIDO(A)* com sucesso!\n`;
          mencoes.push(alvo);
        } catch {
          mensagem += `❌ Não consegui remover @${nomeAlvo}.\n`;
          mencoes.push(alvo);
        }
      }

      // ── 7. Envia a resposta com as menções ───────────────────────
      await sock.sendMessage(
        from,
        { text: mensagem.trim(), mentions: mencoes },
        { quoted: Info }
      );

    } catch (err) {
      console.error('❌ Erro no comando !ban:', err);
      await sock.sendMessage(
        from,
        { text: '❌ Ocorreu um erro ao tentar remover o membro.' },
        { quoted: Info }
      );
    }
  },
};
