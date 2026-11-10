const mysql = require('mysql2/promise');

// La conexión se configura solo con variables de entorno (sin secretos en el código).
// - En Docker, docker-compose fija HOST_DB=db (el NOMBRE DEL SERVICIO en la red de Docker).
// - En local (npm run start:local), se toman del .env de la raíz; si HOST_DB no está, usa 127.0.0.1.
const config = {
  host: process.env.HOST_DB || '127.0.0.1',
  port: Number(process.env.PORT_DB || 3306),
  user: process.env.USER_DB,
  password: process.env.PASS_DB,
};
const DB_NAME = process.env.DB;

const pool = mysql.createPool({
  ...config,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Crea la base de datos si no existe (por ejemplo, en un MySQL local o de un servidor).
// En Docker no hace falta: el contenedor la crea con MYSQL_DATABASE.
async function createDatabase() {
  const conn = await mysql.createConnection(config);
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(DB_NAME)} ` +
        'CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
    );
    console.log(`Base de datos "${DB_NAME}" creada`);
  } finally {
    await conn.end();
  }
}

// Crea la tabla si no existe (misma estructura que db/init.sql).
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id         INT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
      text       TEXT      NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function waitForDb(retries = 15, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      await ensureSchema();
      console.log(`Conectado a MySQL en ${config.host}:${config.port} (base "${DB_NAME}")`);
      return;
    } catch (err) {
      if (err.code === 'ER_BAD_DB_ERROR') {
        console.log(`La base de datos "${DB_NAME}" no existe; creándola...`);
        try {
          await createDatabase();
          continue; // reintenta de inmediato con la base ya creada
        } catch (createErr) {
          console.log(`No se pudo crear la base de datos: ${createErr.message}`);
        }
      } else {
        console.log(`Esperando la base de datos (intento ${i}/${retries}): ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('No fue posible conectar con la base de datos');
}

module.exports = { pool, waitForDb };
