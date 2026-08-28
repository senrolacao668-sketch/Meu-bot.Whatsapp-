// ╔══════════════════════════════╗
// ║   CONFIGURAÇÕES DO BOT       ║
// ╚══════════════════════════════╝
// Tudo aqui vem de variáveis de ambiente (defina no Railway em
// Settings > Variables). Isso evita ter que editar código pra mudar algo,
// e mantém segredos fora do GitHub.

module.exports = {
  // Nome exibido no menu e nos logs
  NOME_BOT: process.env.NOME_BOT || 'Meu Bot',

  // Nome do dono
  NOME_DONO: process.env.NOME_DONO || 'Dono',

  // Número do dono, formato internacional sem "+" (ex: 5511999999999)
  NUMERO_DONO: process.env.NUMERO_DONO || '',

  // Prefixo dos comandos (ex: !, /, #, .)
  PREFIXO: process.env.PREFIXO || '!',

  // Onde a sessão do WhatsApp fica salva. No Railway, aponte isso para
  // o caminho de um Volume (ex: /data/auth_info) — sem isso, a sessão
  // se perde a cada novo deploy e você precisa parear de novo.
  AUTH_DIR: process.env.AUTH_DIR || './auth_info',

  // Senha simples pra proteger a página de pareamento (rota /parear).
  // Troque isso! Qualquer pessoa que souber essa senha e a URL do seu
  // app pode tentar gerar um código de pareamento.
  SENHA_PAINEL: process.env.SENHA_PAINEL || 'troque-esta-senha',

  // ── Integração de IA (opcional) ──────────────────────────────────
  // Configurável pra qualquer endpoint compatível com a API da OpenAI
  // (ex: OpenRouter, que oferece modelos Qwen). Deixe AI_API_KEY vazio
  // para desativar o comando !ia.
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_BASE_URL: process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1',
  AI_MODEL: process.env.AI_MODEL || 'qwen/qwen-2.5-72b-instruct',
};
