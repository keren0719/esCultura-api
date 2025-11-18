// src/controllers/usersController.js
const { pool } = require('../db');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Clave secreta para JWT (usa variable de entorno en producción)
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta';

async function getAllUsers(req,res) {
  try {
    const [rows] = await pool.query
    (
        `SELECT 
            US.username AS Nombre
            ,US.email AS Correo
            ,(CASE WHEN US.is_active = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END) AS Estado 
            ,RO.role_name AS Rol
            ,US.Id AS id
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

async function createUser(req, res) 
{
  if(!req.body)
  {
    return res.status(400).json({ message: 'Estructura incorrecta' });
  }

  const { name, email, password, rol } = req.body;

  if (!name || !email || !password || !rol) return res.status(400).json({ message: 'Faltan campos (name, email)' });
  
  try 
  {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query('INSERT INTO users (username, email,password,role_id,is_active) VALUES (?,?,?,?,?)', [name, email,hashedPassword,rol,1]);
    const insertedId = result.insertId;
    const [rows] = await pool.query('SELECT username, created_at FROM users WHERE id = ?', [insertedId]);
    res.status(201).json(rows[0]);
  } catch (err) 
  {
    console.error(err);
    // Manejo simple de error de clave única
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }
    res.status(500).json({ message: 'Error al crear usuario: ' + err.message });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Debe proporcionar correo y contraseña.' });

    // Buscar usuario
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.email, u.password, u.is_active, r.role_code AS role 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE email = ?`,
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: 'Credenciales incorrectas.' });

    const user = rows[0];

    // Validar estado
    if (user.is_active !== 1)
      return res.status(403).json({ message: 'Usuario inactivo. Contacte al administrador.' });

    // Comparar contraseña (bcrypt)
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword)
      return res.status(401).json({ message: 'Credenciales incorrectas.' });

    // Crear token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.role_id },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Enviar respuesta formateada
    res.status(200).json({
      httpStatus: 'OK',
      detail: { message: 'Inicio de sesión exitoso' },
      payload: {
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      httpStatus: 'ERROR',
      detail: { message: 'Error al procesar inicio de sesión: ' + err.message },
    });
  }
}

module.exports = { getAllUsers, getUserById, createUser, loginUser };
