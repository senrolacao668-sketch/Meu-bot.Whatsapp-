// ╔══════════════════════════════════════════════════════╗
// ║   bot.js — Conexão com o WhatsApp via Baileys         ║
// ║   Pareamento por número acionado pela web (não pelo   ║
// ║   terminal), pra rodar 24h num servidor sem Termux.   ║
// ╚══════════════════════════════════════════════════════╝

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const config = require('./config');

// Emite eventos que o server.js escuta para atualizar o painel web:
// 'pairing-code', 'status' ('aguardando' | 'conectado' | 'desconectado'), 'qr-cleared'
const eventos = new EventEmitter();

let sock = null;
let status = 'iniciando';
let ultimoCodigo = null;

function carregarComandos() {
  const pasta = path.join(__dirname, 'comandos');
  const comandos = new Map();
  const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith('.js'));

  for (const arquivo of arquivos) {
    delete require.cache[require.resolve(path.join(pasta, arquivo))];
    const modulo = require(path.join(pasta, arquivo));
    if (modulo.nome) comandos.set(modulo.nome.toLowerCase(), modulo);
    if (Array.isArray(modulo.alias)) {
      for (const alias of modulo.alias) comandos.set(alias.toLowerCase(), modulo);
    }
  }
  console.log(`✅ ${comandos.size} comandos/aliases carregados.`);
  return comandos;
}

async function conectar() {
  const authDir = path.resolve(config.AUTH_DIR);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  const comandos = carregarComandos();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false, // não usamos QR — usamos Pairing Code pela web
    browser: [config.NOME_BOT, 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      status = 'conectado';
      eventos.emit('status', status);
      console.log(`✅ ${config.NOME_BOT} conectado com sucesso!`);
    }

    if (connection === 'close') {
      status = 'desconectado';
      eventos.emit('status', status);

      const motivo = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = motivo === DisconnectReason.loggedOut;

      if (loggedOut) {
        console.log('⚠️  Sessão encerrada pelo WhatsApp. Apagando dados salvos...');
        if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
        ultimoCodigo = null;
        status = 'aguardando-pareamento';
        eventos.emit('status', status);
      } else {
        console.log('🔄 Conexão perdida. Reconectando em 5s...');
        setTimeout(() => conectar(), 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const from = msg.key.remoteJid;

      const texto =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption ||
        '';

      if (!texto.startsWith(config.PREFIXO)) continue;

      const partes = texto.slice(config.PREFIXO.length).trim().split(/\s+/);
      const nomeComando = partes[0].toLowerCase();
      const args = partes.slice(1);

      const comando = comandos.get(nomeComando);
      if (!comando) continue;

      try {
        await comando.executar(sock, from, msg, args);
      } catch (err) {
        console.error(`❌ Erro ao executar ${config.PREFIXO}${nomeComando}:`, err);
        await sock.sendMessage(
          from,
          { text: `❌ Erro ao executar *${config.PREFIXO}${nomeComando}*. Tente novamente.` },
          { quoted: msg }
        );
      }
    }
  });

  if (!sock.authState.creds.registered) {
    status = 'aguardando-pareamento';
    eventos.emit('status', status);
  }

  return sock;
}

// Chamado pela rota web quando o usuário digita o número no painel.
async function solicitarCodigo(numero) {
  if (!sock) throw new Error('Bot ainda não inicializado.');
  if (sock.authState.creds.registered) {
    throw new Error('Este bot já está pareado com um número. Desconecte primeiro.');
  }
  const numeroLimpo = numero.replace(/[^0-9]/g, '');
  if (!numeroLimpo) throw new Error('Número inválido.');

  const codigo = await sock.requestPairingCode(numeroLimpo);
  ultimoCodigo = codigo;
  eventos.emit('pairing-code', codigo);
  return codigo;
}

function getStatus() {
  return status;
}

function getUltimoCodigo() {
  return ultimoCodigo;
}

module.exports = { conectar, solicitarCodigo, getStatus, getUltimoCodigo, eventos };
