const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Allowed file names (security: only allow these three)
const ALLOWED_FILES = {
  index: 'index.html',
  nini: 'nini.html',
  event: 'event-modelhouse.html',
};

// Base directory: one level up from server.js (i.e., ma-hp/)
const BASE_DIR = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/file?name=index|nini|event
app.get('/api/file', (req, res) => {
  const name = req.query.name;
  if (!ALLOWED_FILES[name]) {
    return res.status(400).json({ error: '無効なファイル名です。index, nini, event のいずれかを指定してください。' });
  }
  const filePath = path.join(BASE_DIR, ALLOWED_FILES[name]);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Read error:', err);
      return res.status(500).json({ error: 'ファイルの読み込みに失敗しました。' });
    }
    res.json({ name, content: data });
  });
});

// POST /api/save { name, content }
app.post('/api/save', (req, res) => {
  const { name, content } = req.body;
  if (!ALLOWED_FILES[name]) {
    return res.status(400).json({ error: '無効なファイル名です。' });
  }
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'コンテンツが不正です。' });
  }
  const filePath = path.join(BASE_DIR, ALLOWED_FILES[name]);
  // Backup original before saving
  const backupPath = filePath + '.bak';
  fs.copyFile(filePath, backupPath, (backupErr) => {
    // Even if backup fails, proceed with save
    fs.writeFile(filePath, content, 'utf8', (err) => {
      if (err) {
        console.error('Write error:', err);
        return res.status(500).json({ error: 'ファイルの保存に失敗しました。' });
      }
      res.json({ success: true, message: '保存しました。' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`株式会社ma HP編集サーバー起動中: http://localhost:${PORT}`);
  console.log(`管理対象ディレクトリ: ${BASE_DIR}`);
});
