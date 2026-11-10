const path = require('path');
const express = require('express');
const { pool, waitForDb } = require('./db');

const app = express();
app.use(express.json());

// Front: página estática (app/public) servida por la misma API en "/"
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

// Estado de la app y de la conexión con el contenedor de base de datos
app.get('/health', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS now, VERSION() AS version');
    res.json({
      status: 'ok',
      db_host: process.env.HOST_DB || '127.0.0.1',
      db_version: rows[0].version,
      db_time: rows[0].now,
    });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// Guardar una nota (escritura en el contenedor db)
app.post('/notes', async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'El campo "text" es obligatorio' });
  }
  try {
    const [result] = await pool.query('INSERT INTO notes (text) VALUES (?)', [text]);
    const [rows] = await pool.query(
      'SELECT id, text, created_at FROM notes WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leer todas las notas (lectura desde el contenedor db)
app.get('/notes', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, text, created_at FROM notes ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

waitForDb()
  .then(() => {
    app.listen(PORT, HOST, () => console.log(`API escuchando en ${HOST}:${PORT}`));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
