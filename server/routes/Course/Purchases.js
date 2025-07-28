import express from 'express';
import { PurchaseCourse, GetPurchasedCourses ,GetPurchasedCourseById} from '../../controllers/Course/PurchaseController.js';

const router = express.Router();

router.post('/', PurchaseCourse);
router.get('/my-courses', GetPurchasedCourses);
router.get('/:id', GetPurchasedCourseById);

export default router;