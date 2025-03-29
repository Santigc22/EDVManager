require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
      },
});

pool.connect()
    .then(() => console.log("📦 Conexión a la base de datos exitosa"))
    .catch(err => console.error("❌ Error en la conexión a la base de datos", err));

module.exports = pool;
