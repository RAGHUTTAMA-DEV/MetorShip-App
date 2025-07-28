import express from "express"
import { UploadFile,GetFile } from "../../controllers/Course/FileController.js";
const router=express.Router();
import multer from "multer";


const storage =multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"./server/files")
    }
    ,filename: function(req,file,cb){
        cb(null,Date.now() +'-' + file.originalname)
    }
})

const upload = multer({storage:storage})

router.post('/:courseId/sections/:sectionId',upload.single('file'), UploadFile)

router.get('/:courseId/sections/:sectionId/:fileId', GetFile)

export default router;