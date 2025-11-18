const { pool } = require('../db');

// Crear reseña
async function createReview (req, res) {
  try {
    const { eventId } = req.params;
    const { autorId, comentario, calificacion } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: "ID del evento requerido." });
    }

    if (!autorId) {
      return res.status(400).json({ message: "ID del autor requerido." });
    }

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ message: "Calificación debe ser entre 1 y 5." });
    }

    const [result] = await pool.query(
      `
      INSERT INTO valoraciones (evento_id, nombre_autor, comentario, calificacion)
      VALUES (?, ?, ?, ?)
      `,
      [eventId, autorId, comentario || null, calificacion]
    );

    res.status(201).json({
      id: result.insertId,
      eventId,
      autorId,
      comentario,
      calificacion,
      fecha: new Date(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error al crear reseña: " + err.message });
  }
}


async function getReviewsByEvent(req, res) {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ message: "Evento no suministrado." });
    }

    const [rows] = await pool.query(
      `
      SELECT 
         v.id,
         u.username AS nombre_autor,
         v.comentario,
         v.calificacion,
         v.fecha
      FROM valoraciones v
      LEFT JOIN users u ON v.nombre_autor = u.id
      WHERE v.evento_id = ?
      ORDER BY v.fecha DESC
      `,
      [eventId]
    );

    const reviews = rows.map(r => ({
      id: r.id.toString(),
      user: {
        name: r.nombre_autor, // Este es el ID del usuario según tu diseño
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          r.nombre_autor
        )}`,
      },
      rating: r.calificacion,
      comment: r.comentario || "",
      createdAt: r.fecha,
    }));

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error al obtener reviews: " + err.message });
  }
}


// Obtener 1 reseña por ID
async function getReviewById (req, res) {
  try {
    const { reviewId } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        id,
        evento_id AS eventoId,
        nombre_autor AS autorId,
        comentario,
        calificacion,
        fecha
      FROM valoraciones
      WHERE id = ?
      `,
      [reviewId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Reseña no encontrada." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error al obtener reseña: " + err.message });
  }
}


// Actualizar reseña
async function updateReview (req, res) {
  try {
    const { reviewId } = req.params;
    const { comentario, calificacion } = req.body;

    if (calificacion && (calificacion < 1 || calificacion > 5)) {
      return res.status(400).json({ message: "Calificación debe ser entre 1 y 5." });
    }

    const [result] = await pool.query(
      `
      UPDATE valoraciones
      SET comentario = COALESCE(?, comentario),
          calificacion = COALESCE(?, calificacion)
      WHERE id = ?
      `,
      [comentario, calificacion, reviewId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reseña no encontrada." });
    }

    res.json({ message: "Reseña actualizada correctamente." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error al actualizar reseña: " + err.message });
  }
}


// Eliminar reseña
async function deleteReview  (req, res)  {
  try {
    const { reviewId } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM valoraciones
      WHERE id = ?
      `,
      [reviewId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Reseña no encontrada." });
    }

    res.json({ message: "Reseña eliminada correctamente." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error al eliminar reseña: " + err.message });
  }
}


module.exports = { createReview,getReviewsByEvent,getReviewById,updateReview,deleteReview};