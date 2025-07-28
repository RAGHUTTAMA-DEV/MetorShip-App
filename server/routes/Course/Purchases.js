import express from 'express';
import { PurchaseCourse, GetPurchasedCourses ,GetPurchasedCourseById} from '../../controllers/Course/PurchaseController.js';
import middleware from '../../middleware/middleware.js';

const router = express.Router();
router.use(middleware);
router.post('/', PurchaseCourse);
router.get('/my-purchases', GetPurchasedCourses);
router.get('/:id', GetPurchasedCourseById);

export default router;