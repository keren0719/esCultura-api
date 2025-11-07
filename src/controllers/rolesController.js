const { pool } = require('../db');

async function getAllRoles(req,res) {
  try {
    const [rows] = await pool.query
    (
        `SELECT 
             RO.id AS Id
            ,RO.role_name AS Nombre
        FROM roles RO
        WHERE is_active = 1 AND role_code <> 'ADMIN'`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener roles: ' + err.message});
  }
}

module.exports = { getAllRoles };
