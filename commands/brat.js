const fs = require('fs');
const path = require('path');
const { Jimp, loadFont } = require('jimp');
const { measureText } = require('@jimp/plugin-print');
const { writeExifImg } = require('../lib/exif');

const FONT_PATH = path.join(__dirname, '../node_modules/@jimp/plugin-print/dist/fonts/open-sans/open-sans-64-black/open-sans-64-black.fnt');
const WIDTH = 512;
const HEIGHT = 512;
const PADDING = 30;
const MAX_WIDTH = WIDTH - PADDING * 2;
const LINE_HEIGHT = 74;

async function getLines(font, text) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = measureText(font, testLine);
        if (testWidth > MAX_WIDTH && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function renderJustified(image, font, lines, startY) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineWords = line.split(' ');
        const y = startY + i * LINE_HEIGHT;
        if (lineWords.length === 1 || i === lines.length - 1) {
            image.print({ font, x: PADDING, y, text: line });
            continue;
        }
        let totalWordWidth = 0;
        for (const word of lineWords) totalWordWidth += measureText(font, word);
        const spacePerGap = (MAX_WIDTH - totalWordWidth) / (lineWords.length - 1);
        let x = PADDING;
        for (const word of lineWords) {
            image.print({ font, x: Math.round(x), y, text: word });
            x += measureText(font, word) + spacePerGap;
        }
    }
}

function renderJustifiedFull(image, font, lines, startY) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineWords = line.split(' ');
        const y = startY + i * LINE_HEIGHT;
        if (lineWords.length === 1) {
            image.print({ font, x: PADDING, y, text: line });
            continue;
        }
        let totalWordWidth = 0;
        for (const word of lineWords) totalWordWidth += measureText(font, word);
        const spacePerGap = (MAX_WIDTH - totalWordWidth) / (lineWords.length - 1);
        let x = PADDING;
        for (const word of lineWords) {
            image.print({ font, x: Math.round(x), y, text: word });
            x += measureText(font, word) + spacePerGap;
        }
    }
}

async function sendSticker(sock, chatId, message, imgBuffer) {
    const webpPath = await writeExifImg(imgBuffer, { packname: 'Zelvora', author: 'Axel' });
    const webpBuffer = fs.readFileSync(webpPath);
    try { fs.unlinkSync(webpPath) } catch (_) {}
    await sock.sendMessage(chatId, { sticker: webpBuffer }, { quoted: message });
}

function getText(message, cmd) {
    const userMessage = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    return userMessage.slice(cmd.length).trim();
}

// .brat — justified, CENTER canvas
async function bratCommand(sock, chatId, message) {
    const text = getText(message, '.brat');
    if (!text) return sock.sendMessage(chatId, { text: 'Contoh: .brat teks kamu' }, { quoted: message });
    try {
        const image = new Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });
        const font = await loadFont(FONT_PATH);
        const lines = await getLines(font, text);
        const totalHeight = lines.length * LINE_HEIGHT;
        const startY = Math.max(PADDING, (HEIGHT - totalHeight) / 2);
        renderJustified(image, font, lines, startY);
        await sendSticker(sock, chatId, message, await image.getBuffer('image/png'));
    } catch (e) {
        console.error('Error generating brat sticker:', e);
        await sock.sendMessage(chatId, { text: '❌ Gagal generate stiker .brat.' }, { quoted: message });
    }
}

// .bratc — justified, pojok kiri atas
async function bratcCommand(sock, chatId, message) {
    const text = getText(message, '.bratc');
    if (!text) return sock.sendMessage(chatId, { text: 'Contoh: .bratc teks kamu' }, { quoted: message });
    try {
        const image = new Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });
        const font = await loadFont(FONT_PATH);
        const lines = await getLines(font, text);
        renderJustified(image, font, lines, PADDING);
        await sendSticker(sock, chatId, message, await image.getBuffer('image/png'));
    } catch (e) {
        console.error('Error generating bratc sticker:', e);
        await sock.sendMessage(chatId, { text: '❌ Gagal generate stiker .bratc.' }, { quoted: message });
    }
}

// .bratf — justified FULL, pojok kiri atas
async function bratfCommand(sock, chatId, message) {
    const text = getText(message, '.bratf');
    if (!text) return sock.sendMessage(chatId, { text: 'Contoh: .bratf teks kamu' }, { quoted: message });
    try {
        const image = new Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });
        const font = await loadFont(FONT_PATH);
        const lines = await getLines(font, text);
        renderJustifiedFull(image, font, lines, PADDING);
        await sendSticker(sock, chatId, message, await image.getBuffer('image/png'));
    } catch (e) {
        console.error('Error generating bratf sticker:', e);
        await sock.sendMessage(chatId, { text: '❌ Gagal generate stiker .bratf.' }, { quoted: message });
    }
}

// .bratcf — justified FULL, CENTER canvas
async function bratcfCommand(sock, chatId, message) {
    const text = getText(message, '.bratcf');
    if (!text) return sock.sendMessage(chatId, { text: 'Contoh: .bratcf teks kamu' }, { quoted: message });
    try {
        const image = new Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });
        const font = await loadFont(FONT_PATH);
        const lines = await getLines(font, text);
        const totalHeight = lines.length * LINE_HEIGHT;
        const startY = Math.max(PADDING, (HEIGHT - totalHeight) / 2);
        renderJustifiedFull(image, font, lines, startY);
        await sendSticker(sock, chatId, message, await image.getBuffer('image/png'));
    } catch (e) {
        console.error('Error generating bratcf sticker:', e);
        await sock.sendMessage(chatId, { text: '❌ Gagal generate stiker .bratcf.' }, { quoted: message });
    }
}

module.exports = { bratCommand, bratcCommand, bratfCommand, bratcfCommand };
