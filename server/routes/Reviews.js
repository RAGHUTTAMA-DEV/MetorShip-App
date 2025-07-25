import express from 'express';
import { createReview, getReview,getMyReviews } from '../controllers/ReviewController.js';
import middleware from '../middleware/middleware.js';

const router = express.Router();

router.use(middleware);

router.post("/", createReview);
router.get("/mentors/:id", getReview);
router.get("/:myreviews", getMyReviews);

export default router;