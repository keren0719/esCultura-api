const express = require('express');
const router = express.Router();

const categoriesController = require('../controllers/categoriesController');

// Crear categoría
router.post('/createCategory', categoriesController.createCategory);

// Listar todas
router.get('/getAllCategories', categoriesController.getAllCategories);

// Obtener una
router.get('/getCategory/:id', categoriesController.getCategoryById);

// Actualizar
router.put('/updateCategory/:id', categoriesController.updateCategory);

// Eliminar
router.delete('/deleteCategory/:id', categoriesController.deleteCategory);

module.exports = router;