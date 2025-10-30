// src/controllers/usersController.js
const { pool } = require('../db');

async function getAllUsers(req,res) {
  try {
    const [rows] = await pool.query
    (
        `SELECT 
            US.username AS Nombre
            ,US.email AS Correo
            ,(CASE WHEN US.is_active = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END) AS Estado 
            ,RO.role_name AS Rol
        FROM users US
        LEFT JOIN roles RO ON US.role_id = RO.id
        ORDER BY US.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuarios: ' + err.message});
  }
}

async function getUserById(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID inválido xd' });
  try {
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
}

async function createUser(req, res) {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Faltan campos (name, email)' });

  try {
    const [result] = await pool.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    const insertedId = result.insertId;
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [insertedId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    // Manejo simple de error de clave única
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }
    res.status(500).json({ message: 'Error al crear usuario' });
  }
}

module.exports = { getAllUsers, getUserById, createUser };
