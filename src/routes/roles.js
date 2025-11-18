const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');

router.get('/getAllRoles', rolesController.getAllRoles);

module.exports = router;
