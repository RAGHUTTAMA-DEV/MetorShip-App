import express from "express";
import { CreateCourse,DeleteCourse, GetAllCourses,GetCourseById,UpdateCourse } from "../../controllers/Course/CourseController.js";    
const router=express.Router();

router.post('/',CreateCourse);

router.get('/',GetAllCourses);
router.get('/:id',GetCourseById);
router.put('/:id',UpdateCourse);
router.delete('/:id',DeleteCourse);

export default router;