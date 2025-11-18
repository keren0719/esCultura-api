const express = require('express');
const router = express.Router();
const { upload } = require("../config/multer");
const eventsController = require('../controllers/eventsController');

router.get('/listHomeEvents', eventsController.listHomeEvents);
router.get('/listExplorerEvents', eventsController.listExplorerEvents);
router.get('/listEventsAdmin', eventsController.listEventsAdmin);
router.get('/getDashboardStats', eventsController.getDashboardStats);
router.post('/createEvent',upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 10 }
  ]), eventsController.createEvent);
router.get('/listEventsByUser/:idUser', eventsController.listEventsByUser);
router.get('/getEventById/:idEvent', eventsController.getEventById);
router.post('/publishEvent/:idEvent', eventsController.publishEvent);
router.post('/rejectEvent/:idEvent', eventsController.rejectEvent);

module.exports = router;
