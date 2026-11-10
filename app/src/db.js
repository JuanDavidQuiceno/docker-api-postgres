const { Pool } = require('pg');

// La conexión se configura solo con variables de entorno (sin secretos en el código).
// DB_HOST debe ser el NOMBRE DEL SERVICIO en docker-compose ("db"), no localhost ni una IP.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function waitForDb(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log(`Conectado a PostgreSQL en ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}`);
      return;
    } catch (err) {
      console.log(`Esperando la base de datos (intento ${i}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('No fue posible conectar con la base de datos');
}

module.exports = { pool, waitForDb };
