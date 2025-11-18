const express = require("express");
const router = express.Router();
const placesController = require("../controllers/placesController");

router.get("/getAllPlaces", placesController.getAllPlaces);
router.get("/getPlaceById/:id", placesController.getPlaceById);
router.post("/createPlace", placesController.createPlace);
router.put("/updatePlace/:id", placesController.updatePlace);
router.delete("/deletePlace/:id", placesController.deletePlace);

module.exports = router;
