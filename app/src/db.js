const mysql = require('mysql2/promise');

// La conexión se configura solo con variables de entorno (sin secretos en el código).
// - En Docker, docker-compose fija DB_HOST=db (el NOMBRE DEL SERVICIO en la red de Docker).
// - En local (npm run start:local), se toman de app/.env; si DB_HOST no está, usa 127.0.0.1.
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function waitForDb(retries = 15, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log(`Conectado a MySQL en ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}`);
      return;
    } catch (err) {
      console.log(`Esperando la base de datos (intento ${i}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('No fue posible conectar con la base de datos');
}

module.exports = { pool, waitForDb };
