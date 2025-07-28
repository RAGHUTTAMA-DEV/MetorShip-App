import express from "express"
import { UploadFile,GetFile } from "../../controllers/Course/FileController.js";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router=express.Router();
import multer from "multer";

const filePath = path.join(__dirname, '../../files'); 

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, filePath)
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({storage:storage})

router.post('/:courseId/sections/:sectionId',upload.single('file'), UploadFile)

router.get('/:courseId/sections/:sectionId/:fileId', GetFile)

export default router;