# Meu Bot — WhatsApp 24h sem Termux

Bot de WhatsApp (Baileys) que conecta pela internet, sem precisar de terminal
aberto. Você digita o número numa página web, recebe um código de 8 dígitos,
digita no seu WhatsApp e pronto — fica rodando 24h no servidor.

## O que tem aqui
- `server.js` — sobe o painel web e o bot
- `bot.js` — conexão com o WhatsApp (Baileys)
- `comandos/` — `menu`, `ban`, `promote`, `demote`, `figu` (figurinha), `ia`
- `public/index.html` — painel onde você digita o número e vê o código

## Passo a passo — GitHub + Railway

### 1. Suba este projeto pro GitHub
- Crie um repositório novo (pode ser **privado** — recomendo, já que o bot
  fica ligado à sua conta pessoal).
- Suba todos estes arquivos. O `.gitignore` já protege a pasta `auth_info/`
  (sua sessão) e o `.env` de irem parar no GitHub.

### 2. Crie o projeto no Railway
- Nas telas que você mandou: `New Project` → `Login with GitHub` → escolha o
  repositório.
- O Railway detecta o `package.json` e roda `npm start` sozinho.

### 3. Configure as variáveis de ambiente
Em **Settings → Variables**, copie o conteúdo de `.env.example` e preencha
com seus dados reais. O mais importante:
- `SENHA_PAINEL` — troque por uma senha forte (o painel fica público na
  internet, essa senha impede estranhos de tentar parear com o seu bot).
- `NUMERO_DONO` — seu número, protege você de ser removido/banido por engano
  pelos próprios comandos do bot.

### 4. Adicione um Volume (importante!)
Sem isso, **toda vez que você atualizar o código e o Railway reimplantar, a
sessão do WhatsApp se perde** e você precisa parear de novo.
- No Railway: **Settings → Volumes → New Volume**, monte em `/data`.
- Defina a variável `AUTH_DIR=/data/auth_info`.

### 5. Gere um domínio público
- **Settings → Networking → Generate Domain**. O Railway te dá uma URL tipo
  `meubot-production.up.railway.app`.

### 6. Pareie o número
- Abra a URL gerada no navegador.
- Digite a `SENHA_PAINEL` e o número (com DDI, ex: `5511999999999`).
- Clique em "Gerar código de pareamento" — aparece um código de 8 dígitos.
- No seu celular: **WhatsApp → Dispositivos conectados → Conectar
  dispositivo → Conectar com número de telefone** e digite o código.
- Pronto — nas telas que você me mandou, é a mesma tela de "Dispositivos
  conectados" onde hoje aparecem "Google Chrome (Ubuntu)", "naufraBot
  diamante" etc. O seu bot novo vai aparecer ali com o nome que você definiu
  em `NOME_BOT`.

## Sobre os comandos
- `!ban @pessoa` — remove do grupo (admin only)
- `!promote @pessoa` — torna admin (admin only)
- `!demote @pessoa` — remove admin (admin only)
- `!figu` (marcando uma imagem/vídeo) — vira figurinha
- `!ia sua pergunta` — responde usando IA (precisa configurar `AI_API_KEY`)
- `!menu` — lista tudo

### Ligando a IA (Qwen 2.5 ou outro modelo)
O comando `!ia` funciona com qualquer API compatível com o formato da
OpenAI. Pra usar Qwen 2.5, o caminho mais simples é uma conta na
[OpenRouter](https://openrouter.ai) (tem modelos Qwen disponíveis):
1. Crie uma API key lá.
2. No Railway, defina `AI_API_KEY` com essa chave.
3. `AI_MODEL` já vem configurado como `qwen/qwen-2.5-72b-instruct` — troque
   se quiser outro modelo.

## Avisos importantes
- **Baileys é uma biblioteca não-oficial.** Usar isso viola os Termos de Uso
  do WhatsApp — o número pode ser banido a qualquer momento, sem aviso.
  Recomendo usar um número que não seja o seu principal.
- **Nunca compartilhe a pasta `auth_info/`** (ou o Volume onde ela mora) —
  quem tiver esses arquivos tem controle total da sua conta de WhatsApp, sem
  precisar de senha.
- Troque a `SENHA_PAINEL` antes de colocar no ar — a URL do Railway é
  pública, qualquer um que adivinhar ou descobrir o link pode tentar acessar
  o painel.

## Rodando localmente pra testar (opcional)
```bash
npm install
cp .env.example .env   # edite com seus dados
npm start
```
Depois abra `http://localhost:3000` no navegador.
