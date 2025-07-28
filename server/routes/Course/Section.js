import express from 'express'
import { CreateSection,DeleteSection,UpdateSection,GetSection } from '../../controllers/Course/SectionController.js';
const router=express.Router();

router.post('/:id',CreateSection);
router.get('/:id',GetSection);
router.delete('/:id',DeleteSection);
router.get('/:id',UpdateSection)


export default router;