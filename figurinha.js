// ╔══════════════════════════════════════════╗
// ║   LIB — CONVERSÃO DE IMAGEM EM FIGURINHA ║
// ╚══════════════════════════════════════════╝
// Usa ffmpeg + node-webpmux para gerar stickers compatíveis com WhatsApp

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const webp = require('node-webpmux');

// Converte exec para async/await
const execAsync = promisify(exec);

// Pasta temporária para arquivos intermediários
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Cria a pasta temp se não existir
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Converte um Buffer de imagem (jpg/png/gif/mp4) em um Buffer WebP de sticker
 * @param {Buffer} buffer — Buffer da mídia original
 * @param {boolean} isVideo — true se for vídeo/gif animado
 * @param {string} packName — nome do pacote do sticker
 * @param {string} authorName — autor do sticker
 * @returns {Buffer} — Buffer do sticker WebP pronto para envio
 */
async function converterFigurinha(buffer, isVideo = false, packName = 'Diamante Bot', authorName = '💎') {
  const timestamp = Date.now();

  // Define os caminhos dos arquivos temporários
  const inputFile = path.join(TEMP_DIR, `input_${timestamp}.${isVideo ? 'mp4' : 'jpg'}`);
  const outputFile = path.join(TEMP_DIR, `output_${timestamp}.webp`);
  const finalFile = path.join(TEMP_DIR, `final_${timestamp}.webp`);

  // Salva o buffer de entrada em disco
  fs.writeFileSync(inputFile, buffer);

  try {
    // Monta o comando ffmpeg correto para imagem ou vídeo
    let ffmpegCmd;

    if (isVideo) {
      // Vídeo/GIF animado → WebP animado (até 9 segundos, 10fps, 320x320)
      ffmpegCmd = [
        `ffmpeg -i "${inputFile}" -t 9`,
        `-vf "fps=10,scale=320:320:force_original_aspect_ratio=decrease,`,
        `pad=320:320:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba"`,
        `-vcodec libwebp -lossless 0 -qscale 40 -preset default -loop 0 -an -vsync 0 -y`,
        `"${outputFile}"`,
      ].join(' ');
    } else {
      // Imagem estática → WebP estático (512x512)
      ffmpegCmd = [
        `ffmpeg -i "${inputFile}"`,
        `-vf "scale=512:512:force_original_aspect_ratio=decrease,`,
        `pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba"`,
        `-vcodec libwebp -lossless 1 -qscale 75 -preset picture -an -vsync 0 -y`,
        `"${outputFile}"`,
      ].join(' ');
    }

    // Executa o ffmpeg
    await execAsync(ffmpegCmd);

    // Verifica se o arquivo foi gerado
    if (!fs.existsSync(outputFile)) {
      throw new Error('ffmpeg não gerou o arquivo WebP. Verifique se o ffmpeg está instalado.');
    }

    // Adiciona metadados EXIF ao sticker (nome do pack e autor)
    const img = new webp.Image();
    await img.load(outputFile);

    const exifData = {
      'sticker-pack-id': `diamante-bot-${timestamp}`,
      'sticker-pack-name': packName.substring(0, 80),
      'sticker-pack-publisher': authorName.substring(0, 30),
      'emojis': ['💎'],
    };

    // Cabeçalho EXIF mínimo para o WhatsApp reconhecer os metadados
    const exifHeader = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(exifData), 'utf8');
    exifHeader.writeUInt32LE(jsonBuffer.length, 14);
    img.exif = Buffer.concat([exifHeader, jsonBuffer]);

    // Salva o sticker final com os metadados
    await img.save(finalFile);

    // Lê o sticker gerado e retorna como Buffer
    const result = fs.readFileSync(finalFile);
    return result;

  } finally {
    // Limpa os arquivos temporários após 5 segundos
    setTimeout(() => {
      [inputFile, outputFile, finalFile].forEach((f) => {
        if (fs.existsSync(f)) {
          try { fs.unlinkSync(f); } catch {}
        }
      });
    }, 5000);
  }
}

module.exports = { converterFigurinha };
