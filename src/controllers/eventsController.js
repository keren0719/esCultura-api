const imagekit = require("../config/imagekit");
const { pool } = require('../db');
const slugify = require('slugify');

function buildDateTime(date, time) {
  return `${date} ${time}:00`;
}

async function listHomeEvents(req,res) {
  try {
    const [rows] = await pool.query
    (
        `
         SELECT 
        e.id AS id,
        e.titulo AS title,
        e.descripcion_corta AS description,
        c.nombre AS category,
        DATE_FORMAT(e.inicio, '%Y-%m-%d') AS date,
        DATE_FORMAT(e.inicio, '%H:%i') AS time,
        IFNULL(e.precio, 0) AS price,
        l.nombre AS location,
        COALESCE(
          (SELECT f.url 
           FROM fotos_evento f 
           WHERE f.evento_id = e.id AND f.destacada = 1 
           ORDER BY f.orden ASC 
           LIMIT 1),
          (SELECT f2.url 
           FROM fotos_evento f2 
           WHERE f2.evento_id = e.id 
           ORDER BY f2.orden ASC 
           LIMIT 1),
          ''
        ) AS images,
        e.inscritos AS attendees,
        COALESCE(e.capacidad, l.capacidad) AS capacity,
        COALESCE(ROUND(AVG(v.calificacion),1), 0) AS rating,
        e.estado AS status
      FROM eventos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      LEFT JOIN lugar l ON e.sede_id = l.id
      LEFT JOIN valoraciones v ON e.id = v.evento_id
      WHERE e.estado = 'publicado'
      GROUP BY e.id
      ORDER BY e.inicio ASC
      LIMIT 10;
        `
    );
    res.json(rows);
  } catch (err) 
  {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener eventos: ' + err.message});
  }
}

async function listExplorerEvents(req, res) {
  try {


    const [rows] = await pool.query(`
      SELECT 
        e.id AS id,
        e.titulo AS title,
        e.descripcion_corta AS description,
        c.nombre AS category,
        DATE_FORMAT(e.inicio, '%Y-%m-%d') AS date,
        DATE_FORMAT(e.inicio, '%H:%i') AS time,
        IFNULL(e.precio, 0) AS price,
        l.nombre AS location_name,
        l.direccion AS address,
        l.ciudad AS city,
        COALESCE(
          (SELECT f.url 
           FROM fotos_evento f 
           WHERE f.evento_id = e.id AND f.destacada = 1 
           ORDER BY f.orden ASC 
           LIMIT 1),
          (SELECT f2.url 
           FROM fotos_evento f2 
           WHERE f2.evento_id = e.id 
           ORDER BY f2.orden ASC 
           LIMIT 1),
          ''
        ) AS image_url,
        e.inscritos AS attendees,
        COALESCE(e.capacidad, l.capacidad) AS capacity,
        COALESCE(ROUND(AVG(v.calificacion),1), 0) AS rating,
        e.estado AS status,
        e.organizador_nombre AS organizer_name
      FROM eventos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      LEFT JOIN lugar l ON e.sede_id = l.id
      LEFT JOIN valoraciones v ON e.id = v.evento_id
      WHERE e.estado = 'publicado'
      GROUP BY e.id
      ORDER BY e.inicio ASC
      LIMIT 10;
    `);

    // Transformar los datos al formato esperado por el front
    const events = rows.map((row) => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      category: row.category,
      tags: [row.category?.toLowerCase() || 'evento'],
      date: row.date,
      time: row.time,
      duration: 180, // Si no tienes duración, puedes calcular o dejar fija
      capacity: row.capacity,
      price: parseFloat(row.price),
      location: `${row.address || ''}, ${row.city || ''}`,       
      organizer: {
        id: `org${row.id}`,
        name: row.organizer_name || 'Organizador desconocido',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          row.organizer_name || 'Organizador'
        )}`,
      },
      images: row.image_url ? [row.image_url] : [],
      purchaseLink: `https://example.com/event/${row.id}`,
      status: row.status,
      attendees: row.attendees,
      rating: parseFloat(row.rating),
      reviews: [],
    }));

    res.json(events);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: 'Error al obtener eventos: ' + err.message });
  }
}

async function createEvent(req, res) {
  const {
    name,
    location,
    description,
    category,
    date,
    time,
    capacity,
    price,
    user
  } = req.body;

  try {
    // slug limpio y bonito
    const slug = slugify(name, { lower: true, strict: true });

    const [slugExists] = await pool.query(
      "SELECT id FROM eventos WHERE slug = ? LIMIT 1",
      [slug]
    );

    const finalSlug = slugExists.length > 0 ? `${slug}-${Date.now()}` : slug;

    const inicio = buildDateTime(date, time);

    // Insertar evento
    const [result] = await pool.query(
      `
        INSERT INTO eventos (
          titulo, slug, descripcion_corta, descripcion_larga,
          categoria_id, sede_id, organizador_nombre,
          inicio, moneda, precio, capacidad,estado
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        name,
        finalSlug,
        description,
        description,
        category || null,
        location || null,
        user,
        inicio,
        "COP",
        price || null,
        capacity || null,
        "pendiente"
      ]
    );

    const eventId = result.insertId;

    // =======================================
    // SUBIR FOTOS A IMAGEKIT
    // =======================================
    if (req.files && req.files.photos) {

      for (let i = 0; i < req.files.photos.length; i++) {
        const file = req.files.photos[i];

        // subir a ImageKit
        const uploaded = await imagekit.upload({
          file: file.buffer,           // buffer de multer
          fileName: file.originalname, 
          folder: "/eventos",          // opcional
        });

        // URL CDN optimizada
        const cdnUrl = uploaded.url;

        // guardar en DB
        await pool.query(
          `
            INSERT INTO fotos_evento (
              evento_id, url, texto_alternativo, destacada, orden
            )
            VALUES (?,?,?,?,?)
          `,
          [eventId, cdnUrl, file.originalname, i === 0 ? 1 : 0, i]
        );
      }
    }

    res.json({
      httpStatus: "200",
      detail: { message: "Evento creado correctamente" },
      payload: { id: eventId, slug: finalSlug }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      httpStatus: "500",
      detail: { message: "Error al crear evento: " + err.message }
    });
  }
}

async function listEventsByUser(req, res) {
  try {
    // El frontend debe enviar el usuario por header, token o body
    const { idUser } = req.params;

    if (!idUser) {
      return res.status(400).json({ message: "Falta el usuario autenticado." });
    }

    const [rows] = await pool.query(`
      SELECT 
        e.id,
        e.titulo AS title,
        DATE_FORMAT(e.inicio, '%Y-%m-%d') AS date,
        c.nombre AS category,
        e.estado AS status,
        COALESCE(
          (SELECT f.url 
           FROM fotos_evento f 
           WHERE f.evento_id = e.id AND f.destacada = 1
           ORDER BY f.orden ASC
           LIMIT 1),
          (SELECT f2.url 
           FROM fotos_evento f2 
           WHERE f2.evento_id = e.id
           ORDER BY f2.orden ASC
           LIMIT 1),
          ''
        ) AS image
      FROM eventos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      WHERE e.organizador_nombre = ?
      ORDER BY e.inicio DESC
    `, [idUser]);

    res.json(rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error al obtener mis eventos: " + err.message });
  }
}

async function getEventById(req, res) {
  try {
    const { idEvent } = req.params;

    if (!idEvent) {
      return res.status(400).json({ message: "Evento no suministrado." });
    }

    // 1. OBTENER EVENTO
    const [rows] = await pool.query(
      `
      SELECT 
        e.id AS id,
        e.titulo AS title,
        e.descripcion_corta AS description,
        c.nombre AS category,
        DATE_FORMAT(e.inicio, '%Y-%m-%d') AS date,
        DATE_FORMAT(e.inicio, '%H:%i') AS time,
        IFNULL(e.precio, 0) AS price,
        l.nombre AS location_name,
        l.direccion AS address,
        l.ciudad AS city,
        e.inscritos AS attendees,
        COALESCE(e.capacidad, l.capacidad) AS capacity,
        COALESCE(ROUND(AVG(v.calificacion),1), 0) AS rating,
        e.estado AS status,
        u.username AS organizer_name
      FROM eventos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      LEFT JOIN lugar l ON e.sede_id = l.id
      LEFT JOIN valoraciones v ON e.id = v.evento_id
      LEFT JOIN users u ON e.organizador_nombre = u.id
      WHERE e.id = ?
      `,
      [idEvent]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Evento no encontrado." });
    }

    const row = rows[0];

    // 2. OBTENER TODAS LAS FOTOS DEL EVENTO
    const [photos] = await pool.query(
      `
      SELECT url 
      FROM fotos_evento 
      WHERE evento_id = ?
      ORDER BY destacada DESC, orden ASC
      `,
      [idEvent]
    );

    // Convertir fotos a array de strings
    const images = photos.map(p => p.url);

    // 3. ARMAR RESPUESTA
    const event = {
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      category: row.category,
      date: row.date,
      time: row.time,
      duration: 180,
      capacity: row.capacity,
      price: parseFloat(row.price),
      location: row.address || "",
      organizer: {
        id: `org${row.id}`,
        name: row.organizer_name || "Organizador desconocido",
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          row.organizer_name || "Organizador"
        )}`,
        contact: ""
      },
      images,
      purchaseLink: `https://example.com/event/${row.id}`,
      status: row.status === "publicado" ? "approved" : row.status,
      attendees: row.attendees,
      rating: parseFloat(row.rating),
      reviews: [],
    };

    res.json(event);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error al obtener evento: " + err.message });
  }
}

async function listEventsAdmin(req, res) {
  try {


    const [rows] = await pool.query(`
      SELECT 
        e.id AS id,
        e.titulo AS title,
        e.descripcion_corta AS description,
        c.nombre AS category,
        DATE_FORMAT(e.inicio, '%Y-%m-%d') AS date,
        DATE_FORMAT(e.inicio, '%H:%i') AS time,
        IFNULL(e.precio, 0) AS price,
        l.nombre AS location_name,
        l.direccion AS address,
        l.ciudad AS city,
        COALESCE(
          (SELECT f.url 
           FROM fotos_evento f 
           WHERE f.evento_id = e.id AND f.destacada = 1 
           ORDER BY f.orden ASC 
           LIMIT 1),
          (SELECT f2.url 
           FROM fotos_evento f2 
           WHERE f2.evento_id = e.id 
           ORDER BY f2.orden ASC 
           LIMIT 1),
          ''
        ) AS image_url,
        e.inscritos AS attendees,
        COALESCE(e.capacidad, l.capacidad) AS capacity,
        COALESCE(ROUND(AVG(v.calificacion),1), 0) AS rating,
        e.estado AS status,
        u.username AS organizer_name
      FROM eventos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      LEFT JOIN lugar l ON e.sede_id = l.id
      LEFT JOIN valoraciones v ON e.id = v.evento_id
      LEFT JOIN users u ON e.organizador_nombre = u.id
      GROUP BY e.id
      ORDER BY e.inicio ASC
      LIMIT 10;
    `);

    // Transformar los datos al formato esperado por el front
    const events = rows.map((row) => ({
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      category: row.category,
      tags: [row.category?.toLowerCase() || 'evento'],
      date: row.date,
      time: row.time,
      duration: 180, // Si no tienes duración, puedes calcular o dejar fija
      capacity: row.capacity,
      price: parseFloat(row.price),
      location: `${row.address || ''}, ${row.city || ''}`,       
      organizer: {
        id: `org${row.id}`,
        name: row.organizer_name || 'Organizador desconocido',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          row.organizer_name || 'Organizador'
        )}`,
      },
      images: row.image_url ? [row.image_url] : [],
      purchaseLink: `https://example.com/event/${row.id}`,
      status: row.status,
      attendees: row.attendees,
      rating: parseFloat(row.rating),
      reviews: [],
    }));

    res.json(events);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: 'Error al obtener eventos: ' + err.message });
  }
}

async function getDashboardStats(req, res) {
  try {
    // Total de eventos
    const [[totalEvents]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM eventos
    `);

    // Eventos pendientes
    const [[pendingEvents]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM eventos
      WHERE estado = 'pendiente'
    `);

    // Organizadores activos (distintos)
    const [[activeOrganizers]] = await pool.query(`
      SELECT COUNT(DISTINCT organizador_nombre) AS total
      FROM eventos
      WHERE organizador_nombre IS NOT NULL AND organizador_nombre <> ''
    `);

    // Total participantes
    const [[totalParticipants]] = await pool.query(`
      SELECT SUM(inscritos) AS total
      FROM eventos
    `);

    // Crecimiento mensual (comparación mes actual vs mes anterior)
    const [[monthlyGrowth]] = await pool.query(`
      SELECT
        (
          (
            (SELECT COUNT(*) FROM eventos 
             WHERE MONTH(creado_en) = MONTH(CURRENT_DATE())
             AND YEAR(creado_en) = YEAR(CURRENT_DATE()))
            -
            (SELECT COUNT(*) FROM eventos 
             WHERE MONTH(creado_en) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
             AND YEAR(creado_en) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH))
          ) 
          /
          NULLIF(
            (SELECT COUNT(*) FROM eventos 
             WHERE MONTH(creado_en) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
             AND YEAR(creado_en) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)),
            0
          )
        ) * 100 AS growth
    `);

    const response = {
      totalEvents: totalEvents.total || 0,
      pendingEvents: pendingEvents.total || 0,
      activeOrganizers: activeOrganizers.total || 0,
      totalParticipants: totalParticipants.total || 0,
      monthlyGrowth: parseFloat(monthlyGrowth.growth || 0).toFixed(1) 
    };

    res.json(response);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener estadísticas: " + err.message });
  }
}

async function publishEvent(req, res) {
  try {
    const { idEvent } = req.params;

    const [result] = await pool.query(
      `UPDATE eventos 
       SET estado = 'publicado', reject_reason = NULL
       WHERE id = ?`,
      [idEvent]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Evento no encontrado." });
    }

    res.json({ message: "Evento publicado correctamente." });
  } catch (err) {
    res.status(500).json({ message: "Error al publicar evento: " + err.message });
  }
}

async function rejectEvent(req, res) {
  try {
    const { idEvent } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Debe proporcionar una razón de rechazo." });
    }

    const [result] = await pool.query(
      `UPDATE eventos 
       SET estado = 'rechazado', reject_reason = ?
       WHERE id = ?`,
      [reason, idEvent]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Evento no encontrado." });
    }

    res.json({ message: "Evento rechazado correctamente." });
  } catch (err) {
    res.status(500).json({ message: "Error al rechazar evento: " + err.message });
  }
}


module.exports = { listHomeEvents,listExplorerEvents,createEvent,listEventsByUser,getEventById,listEventsAdmin,getDashboardStats,publishEvent,rejectEvent };
