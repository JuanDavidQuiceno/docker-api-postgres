const express = require('express');
const { pool, waitForDb } = require('./db');

const app = express();
app.use(express.json());

const PORT = Number(process.env.APP_PORT || 3000);

// Estado de la app y de la conexión con el contenedor de base de datos
app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', db_host: process.env.DB_HOST, db_time: rows[0].now });
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
    const { rows } = await pool.query(
      'INSERT INTO notes (text) VALUES ($1) RETURNING id, text, created_at',
      [text]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leer todas las notas (lectura desde el contenedor db)
app.get('/notes', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, text, created_at FROM notes ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

waitForDb()
  .then(() => {
    app.listen(PORT, () => console.log(`API escuchando en el puerto ${PORT}`));
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
