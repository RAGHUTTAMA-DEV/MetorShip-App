import mongoose from "mongoose";

const FileSchema =new mongoose.Schema({
    sectionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Section',
        required:true,
    },
    title:{
        type:String,
        required:true,
        trim:true,
    },
    courseId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Course',
        required:true,
    },
    fileType:{
        type:String,
        enum:['video','note'],
        required:true,
    },
    path:String,
    uploadedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    updatedAt:{
        type:Date,
        default:Date.now,
    },
    fileSize:{
        type:Number,
    },
    fileExtension:{
        type:String,
    },
    fileUrl:{
        type:String,
    },
    

})

export default mongoose.model('File',FileSchema);