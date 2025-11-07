// src/server.js
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db');
const usersRouter = require('./routes/users');
const rolesRouter = require('./routes/roles');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);

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
