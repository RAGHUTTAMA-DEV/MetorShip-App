import express from "express";
import { CreateCourse,DeleteCourse, GetAllCourses,GetCourseById,UpdateCourse ,GetCourseSections,GetMyCourse} from "../../controllers/Course/CourseController.js";    
const router=express.Router();

router.post('/',CreateCourse);

router.get('/',GetAllCourses);
router.get('/:id',GetCourseById);
router.put('/:id',UpdateCourse);
router.delete('/:id',DeleteCourse);
router.get('/sections/:courseId',GetCourseSections);
router.get('/my-courses',GetMyCourse);
export default router;