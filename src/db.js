// src/db.js
// const mysql = require("mysql2/promise");
// require("dotenv").config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "admin",
//   database: process.env.DB_NAME || "esCulturaDB",
//   port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// async function testConnection() {
//   try {
//     const conn = await pool.getConnection();
//     await conn.ping();
//     conn.release();
//     console.log("MySQL: conexión OK");
//   } catch (err) {
//     console.error("MySQL: error de conexión", err);
//     throw err;
//   }
// }

// module.exports = { pool, testConnection };


const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST_P || "localhost",
  user: process.env.DB_USER_P || "root",
  password: process.env.DB_PASSWORD_P || "admin",
  database: process.env.DB_NAME_P || "esCulturaDB",
  port: process.env.DB_PORT_P ? Number(process.env.DB_PORT_P) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log("Conexión exitosa a MySQL");
}

module.exports = { pool, testConnection };
