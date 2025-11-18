const { pool } = require('../db');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')     // reemplazar no alfanumérico por guiones
    .replace(/^-+|-+$/g, '')         // quitar guiones al inicio o fin
    .substring(0, 120);
}

async function createCategory(req, res) {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El nombre es obligatorio." });
    }

    const slug = slugify(nombre);

    const [result] = await pool.query(
      `INSERT INTO categorias (nombre, slug) VALUES (?, ?)`,
      [nombre, slug]
    );

    res.json({
      id: result.insertId,
      nombre,
      slug
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear categoría: " + err.message });
  }
}

async function getAllCategories(req, res) {
  try {
    const [rows] = await pool.query(`SELECT id, nombre, slug FROM categorias ORDER BY nombre ASC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener categorías: " + err.message });
  }
}

async function getCategoryById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`SELECT id, nombre, slug FROM categorias WHERE id = ?`, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener la categoría: " + err.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El nombre es obligatorio." });
    }

    const slug = slugify(nombre);

    const [result] = await pool.query(
      `UPDATE categorias SET nombre = ?, slug = ? WHERE id = ?`,
      [nombre, slug, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }

    res.json({ id, nombre, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar categoría: " + err.message });
  }
}

// =====================
// Eliminar categoría
// =====================
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `DELETE FROM categorias WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Categoría no encontrada." });
    }

    res.json({ message: "Categoría eliminada correctamente." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar categoría: " + err.message });
  }
}

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};