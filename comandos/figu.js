// ╔══════════════════════════════════════╗
// ║   COMANDO: !figu                     ║
// ║   Converte imagem/vídeo em figurinha ║
// ╚══════════════════════════════════════╝

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { converterFigurinha } = require('../lib/figurinha');
const config = require('../config');

module.exports = {
  // Nomes que ativam este comando
  nome: 'figu',
  alias: ['figu', 'figurinha', 's', 'sticker', 'f'],

  // Descrição exibida no menu
  descricao: 'Transforma a imagem ou vídeo marcado em figurinha',

  // Função executada quando o comando é chamado
  async executar(sock, from, Info, args) {
    try {
      // Mensagem original e mensagem citada (quoted)
      const msgContent = Info.message || {};
      const quoted = msgContent?.extendedTextMessage?.contextInfo?.quotedMessage || {};

      // Verifica se há imagem ou vídeo na mensagem atual ou na citada
      const temImagem = !!msgContent.imageMessage || !!quoted.imageMessage;
      const temVideo = !!msgContent.videoMessage || !!quoted.videoMessage;

      // Se não houver mídia, avisa o usuário
      if (!temImagem && !temVideo) {
        return sock.sendMessage(
          from,
          { text: `❌ Envie ou marque uma *imagem* ou *vídeo* junto com o comando *${config.PREFIXO}figu* para criar a figurinha.` },
          { quoted: Info }
        );
      }

      // Define o tipo de mídia e o objeto de mensagem correto
      const tipoMidia = temImagem ? 'image' : 'video';
      const objMidia = temImagem
        ? msgContent.imageMessage || quoted.imageMessage
        : msgContent.videoMessage || quoted.videoMessage;

      // Avisa o usuário que está processando
      await sock.sendMessage(from, { react: { text: '⏳', key: Info.key } });

      // Faz o download do conteúdo da mídia como stream
      const stream = await downloadContentFromMessage(objMidia, tipoMidia);

      // Junta os chunks do stream em um único Buffer
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Nome do pack e autor do sticker
      const packName = `💎 ${config.NOME_BOT}`;
      const authorName = `👑 ${config.NOME_DONO}`;

      // Converte para WebP usando ffmpeg
      const stickerBuffer = await converterFigurinha(buffer, tipoMidia === 'video', packName, authorName);

      // Envia o sticker de volta
      await sock.sendMessage(from, { sticker: stickerBuffer }, { quoted: Info });

      // Reação de sucesso
      await sock.sendMessage(from, { react: { text: '✅', key: Info.key } });

    } catch (err) {
      console.error('❌ Erro no comando !figu:', err);

      // Reação de erro e mensagem ao usuário
      await sock.sendMessage(from, { react: { text: '❌', key: Info.key } });
      await sock.sendMessage(
        from,
        { text: '❌ Não consegui gerar a figurinha. Certifique-se de que o *ffmpeg* está instalado e tente novamente.' },
        { quoted: Info }
      );
    }
  },
};
