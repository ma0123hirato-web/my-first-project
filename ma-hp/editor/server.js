const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Allowlist: only these three files may be read or written
const ALLOWED_FILES = {
  index: 'index.html',
  nini:  'nini.html',
  event: 'event-modelhouse.html',
};

// Base directory: one level up from server.js (ma-hp/)
const BASE_DIR = path.resolve(__dirname, '..');

app.use(cors());
// 50 MB limit to accommodate large HTML files with embedded base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ──────────────────────────────────────────────
// GET /api/file?name=index|nini|event
// ──────────────────────────────────────────────
app.get('/api/file', (req, res) => {
  const name = (req.query.name || '').trim();
  if (!ALLOWED_FILES[name]) {
    return res.status(400).json({
      error: '無効なファイル名です。index / nini / event のいずれかを指定してください。'
    });
  }
  const filePath = path.join(BASE_DIR, ALLOWED_FILES[name]);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('[READ ERROR]', filePath, err.message);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました: ' + err.message });
    }
    res.json({ name, filename: ALLOWED_FILES[name], content: data });
  });
});

// ──────────────────────────────────────────────
// POST /api/save  { name, content }
// ──────────────────────────────────────────────
app.post('/api/save', (req, res) => {
  const { name, content } = req.body || {};
  if (!ALLOWED_FILES[name]) {
    return res.status(400).json({ error: '無効なファイル名です。' });
  }
  if (typeof content !== 'string' || content.length === 0) {
    return res.status(400).json({ error: 'コンテンツが空または不正です。' });
  }
  const filePath   = path.join(BASE_DIR, ALLOWED_FILES[name]);
  const backupPath = filePath + '.bak';

  // Create backup first, then write
  fs.copyFile(filePath, backupPath, () => {
    // Ignore backup error — still attempt save
    fs.writeFile(filePath, content, 'utf8', (err) => {
      if (err) {
        console.error('[WRITE ERROR]', filePath, err.message);
        return res.status(500).json({ error: 'ファイルの保存に失敗しました: ' + err.message });
      }
      console.log('[SAVED]', ALLOWED_FILES[name], `(${content.length} bytes)`);
      res.json({ success: true, message: `${ALLOWED_FILES[name]} を保存しました。` });
    });
  });
});

// ──────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  株式会社ma HP 編集サーバー');
  console.log(`  http://localhost:${PORT}`);
  console.log(`  管理ディレクトリ: ${BASE_DIR}`);
  console.log('');
});
