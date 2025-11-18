// // src/server.js
// const express = require('express');
// const cors = require('cors');
// const { testConnection } = require('./db');
// const usersRouter = require('./routes/users');
// const rolesRouter = require('./routes/roles');
// const eventsRouter = require('./routes/events');
// const categoriesRouter = require('./routes/categories');
// const placesRouter = require('./routes/places');
// const reviewsRouter = require('./routes/reviews');

// require('dotenv').config();

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// // Rutas
// app.use('/api/users', usersRouter);
// app.use('/api/roles', rolesRouter);
// app.use('/api/events', eventsRouter);
// app.use('/api/categories', categoriesRouter);
// app.use('/api/places', placesRouter);
// app.use('/api/reviews', reviewsRouter);

// // Health check
// app.get('/', (req, res) => res.send('API funcionando'));

// // Start
// const PORT = process.env.PORT || 3000;
// testConnection()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Servidor escuchando en http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error('No se pudo iniciar el servidor por error en BD:', err.message);
//     process.exit(1);
//   });


// api/server.js
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db');
const usersRouter = require('./routes/users');
const rolesRouter = require('./routes/roles');
const eventsRouter = require('./routes/events');
const categoriesRouter = require('./routes/categories');
const placesRouter = require('./routes/places');
const reviewsRouter = require('./routes/reviews');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/places', placesRouter);
app.use('/api/reviews', reviewsRouter);

// Health check
app.get('/', (req, res) => res.send('API funcionando'));

// Esperar conexión
let dbReady = false;
testConnection()
  .then(() => (dbReady = true))
  .catch((err) => console.error('Error conexión BD:', err));

module.exports = app;

