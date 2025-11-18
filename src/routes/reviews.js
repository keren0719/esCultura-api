const express = require("express");
const router = express.Router();
const reviewsController = require("../controllers/reviewsController");

router.post("/createReview/:eventId", reviewsController.createReview);
router.get("/getReviewsByEvent/:eventId", reviewsController.getReviewsByEvent);
router.get("/getReviewById/:reviewId", reviewsController.getReviewById);
router.put("/updateReview/:reviewId", reviewsController.updateReview);
router.delete("/deleteReview/:reviewId", reviewsController.deleteReview);

module.exports = router;
