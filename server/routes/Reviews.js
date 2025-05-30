import express from 'express';
import { createReview, getReview } from '../controllers/ReviewController.js';
import middleware from '../middleware/middleware.js';

const router = express.Router();

router.use(middleware);

router.post("/reviews", createReview);
router.get("/mentors/:id", getReview);

export default router;