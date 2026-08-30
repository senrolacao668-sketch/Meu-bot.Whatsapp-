// ╔══════════════════════════════════════════════════════╗
// ║   server.js — ponto de entrada                        ║
// ║   Sobe um painel web (pra digitar o número e ver o    ║
// ║   código de pareamento) e mantém o bot conectado.      ║
// ╚══════════════════════════════════════════════════════╝

const express = require('express');
const path = require('path');
const config = require('./config');
const { conectar, solicitarCodigo, getStatus, getUltimoCodigo, getUltimoQR, eventos } = require('./bot');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Protege as rotas de controle com a senha definida em config.SENHA_PAINEL
function checarSenha(req, res, next) {
  const senha = req.body?.senha || req.query?.senha;
  if (senha !== config.SENHA_PAINEL) {
    return res.status(401).json({ erro: 'Senha incorreta.' });
  }
  next();
}

app.get('/api/status', (req, res) => {
  res.json({ status: getStatus(), codigo: getUltimoCodigo(), qr: getUltimoQR() });
});

app.post('/api/parear', checarSenha, async (req, res) => {
  try {
    const { numero } = req.body;
    const codigo = await solicitarCodigo(numero);
    res.json({ ok: true, codigo });
  } catch (err) {
    res.status(400).json({ ok: false, erro: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Painel disponível na porta ${PORT}`);
});

// Inicia a conexão com o WhatsApp assim que o servidor sobe.
conectar().catch((err) => {
  console.error('❌ Erro fatal ao iniciar o bot:', err);
});
