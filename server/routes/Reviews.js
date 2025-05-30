import express from 'express';
import { createReview,getReview } from '../controllers/ReviewController';
const router = express.Router();

router.post("/reviews",createReview);
router.get("/mentors/:id",getReview);

export default router;