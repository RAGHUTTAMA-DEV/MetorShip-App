import multer from "multer";
import FileModel from "../../models/Course/FileModel.js";
export async function UploadFile(req,res){
    try{
        const {title,fileType,path,uploadedBy}=req.body;
       const sectionId=req.params.sectionId;
       const courseId=req.params.courseId;
        const file=await FileModel.create({
             sectionId,title,courseId,fileType,path,uploadedBy 
        })
        if(!file){
            res.status(500).json({
                success:false,
                message:"Error while uploading file"
            })
        }
        res.status(200).json({
            success:true,
            message:"File uploaded successfully",
            data:file
        }) 


    }catch(err){
        console.log(err)
        res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

export async function GetFile(req,res){

    try{
        const sectionId=req.params.sectionId;
        const courseId=req.params.courseId;
        const file=await FileModel.find({sectionId,courseId});
        if(!file){
            res.status(500).json({
                success:false,
                message:"Error while getting file"
            })
        }
        res.status(200).json({
            success:true,
            message:"File fetched successfully",
            data:file
        })

    }catch(err){
        console.log(err)
        res.status(500).json({
            success:false,
            message:err.message
        }   
        )
    }
    
}