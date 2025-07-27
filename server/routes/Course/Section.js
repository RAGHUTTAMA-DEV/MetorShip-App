import express from 'express'
import { CreateSection,DeleteSection,UpdateSection,GetSection } from '../../controllers/Course/SectionController';
const router=express.Router();

router.post('/:id',CreateSection);
router.put('/:id',GetSection);
router.delete('/:id',DeleteSection);
router.get('/:id',UpdateSection)


export default router;