const { pool } = require('../db');

// --------------------------------------------------
// Obtener todos los lugares
// --------------------------------------------------
async function getAllPlaces (req, res)  {
  try {
    const [rows] = await pool.query(`
      SELECT id, nombre, direccion, ciudad, capacidad
      FROM lugar
      ORDER BY nombre ASC
    `);

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      httpStatus: "500",
      detail: { message: "Error al obtener los lugares" },
    });
  }
};

// --------------------------------------------------
// Obtener un lugar por ID
// --------------------------------------------------
async function getPlaceById  (req, res) {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, direccion, ciudad, capacidad FROM lugar WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        httpStatus: "404",
        detail: { message: "Lugar no encontrado" },
      });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      httpStatus: "500",
      detail: { message: "Error al buscar el lugar" },
    });
  }
};

// --------------------------------------------------
// Crear un nuevo lugar
// --------------------------------------------------
async function createPlace (req, res) {
  const { nombre, direccion, ciudad, capacidad } = req.body;

  if (!nombre) {
    return res.status(400).json({
      httpStatus: "400",
      detail: { message: "El nombre es obligatorio" },
    });
  }

  try {
    const [result] = await pool.query(
      `
      INSERT INTO lugar (nombre, direccion, ciudad, capacidad)
      VALUES (?, ?, ?, ?)
    `,
      [nombre, direccion || null, ciudad || null, capacidad || null]
    );

    return res.json({
      httpStatus: "200",
      detail: { message: "Lugar creado correctamente" },
      payload: { id: result.insertId },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      httpStatus: "500",
      detail: { message: "Error al crear el lugar" },
    });
  }
};

// --------------------------------------------------
// Actualizar un lugar
// --------------------------------------------------
async function updatePlace  (req, res) {
  const { id } = req.params;
  const { nombre, direccion, ciudad, capacidad } = req.body;

  try {
    const [result] = await pool.query(
      `
      UPDATE lugar 
      SET nombre = ?, direccion = ?, ciudad = ?, capacidad = ?
      WHERE id = ?
    `,
      [nombre, direccion || null, ciudad || null, capacidad || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        httpStatus: "404",
        detail: { message: "Lugar no encontrado" },
      });
    }

    return res.json({
      httpStatus: "200",
      detail: { message: "Lugar actualizado correctamente" },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      httpStatus: "500",
      detail: { message: "Error al actualizar el lugar" },
    });
  }
};

// --------------------------------------------------
// Eliminar un lugar
// --------------------------------------------------
async function deletePlace  (req, res)  {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `DELETE FROM lugar WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        httpStatus: "404",
        detail: { message: "Lugar no encontrado" },
      });
    }

    return res.json({
      httpStatus: "200",
      detail: { message: "Lugar eliminado correctamente" },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      httpStatus: "500",
      detail: { message: "Error al eliminar el lugar" },
    });
  }
};


module.exports = {
  getAllPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace
};