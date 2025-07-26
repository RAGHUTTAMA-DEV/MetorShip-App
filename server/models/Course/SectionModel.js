import mongoose from 'mongoose';


const sectionSchema =new mongoose.Schema({

    courseId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Course',
        required:true,
    },
    title:{
        type:String,
        required:true,
        trim:true,
    },
    order:{
        type:Number,
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
    videoUrl:{
        type:String,
        required:true,
    },
    noteUrl:{
        type:String,
    }
    
})


export default mongoose.model('Section', sectionSchema);