// ╔══════════════════════════════════════════════╗
// ║   COMANDO: !ia                               ║
// ║   Conversa com um modelo de IA (ex: Qwen 2.5)║
// ║   via qualquer endpoint compatível com a API ║
// ║   da OpenAI (ex: OpenRouter).                ║
// ╚══════════════════════════════════════════════╝

const config = require('../config');

module.exports = {
  nome: 'ia',
  alias: ['ia', 'ai', 'pergunta'],
  descricao: 'Conversa com a IA. Ex: !ia qual a capital do Brasil?',

  async executar(sock, from, Info, args) {
    if (!config.AI_API_KEY) {
      return sock.sendMessage(
        from,
        { text: '🤖 O comando de IA ainda não foi configurado. Defina AI_API_KEY nas variáveis de ambiente.' },
        { quoted: Info }
      );
    }

    const pergunta = args.join(' ').trim();
    if (!pergunta) {
      return sock.sendMessage(
        from,
        { text: `❓ Use assim: *${config.PREFIXO}ia sua pergunta aqui*` },
        { quoted: Info }
      );
    }

    await sock.sendMessage(from, { react: { text: '🤔', key: Info.key } });

    try {
      const resposta = await fetch(`${config.AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.AI_MODEL,
          messages: [
            { role: 'system', content: `Você é ${config.NOME_BOT}, um assistente de WhatsApp educado e direto. Respostas curtas.` },
            { role: 'user', content: pergunta },
          ],
          max_tokens: 500,
        }),
      });

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(`API retornou ${resposta.status}: ${erroTexto.slice(0, 200)}`);
      }

      const dados = await resposta.json();
      const texto = dados?.choices?.[0]?.message?.content?.trim() || '🤖 Não consegui gerar uma resposta.';

      await sock.sendMessage(from, { text: texto }, { quoted: Info });
      await sock.sendMessage(from, { react: { text: '✅', key: Info.key } });
    } catch (err) {
      console.error('❌ Erro no comando !ia:', err);
      await sock.sendMessage(from, { react: { text: '❌', key: Info.key } });
      await sock.sendMessage(from, { text: '❌ Não consegui falar com a IA agora. Tente de novo daqui a pouco.' }, { quoted: Info });
    }
  },
};
