// src/server.js
const express = require('express');
const { testConnection } = require('./db');
const usersRouter = require('./routes/users');
require('dotenv').config();

const app = express();
app.use(express.json());

// Rutas
app.use('/api/users', usersRouter);

// Health check
app.get('/', (req, res) => res.send('API funcionando'));

// Start
const PORT = process.env.PORT || 3000;
testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo iniciar el servidor por error en BD:', err.message);
    process.exit(1);
  });
