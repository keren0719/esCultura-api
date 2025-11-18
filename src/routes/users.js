// src/routes/users.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.get('/getAllUsers', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/createUser', usersController.createUser);
router.post('/loginUser', usersController.loginUser);

module.exports = router;
