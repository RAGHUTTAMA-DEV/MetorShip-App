

import mongoose from "mongoose";


const commentSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    courseId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        required:true,
    },
    content:{
        type:String,
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
    sectionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Section",
        required:true,
    },
    parentCommentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment",
    },
    replies:[{
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        content:{
            type:String,
            required:true,
        },
        createdAt:{
            type:Date,
            default:Date.now,
        },
        },
    ],

})

export default mongoose.model('Comment', commentSchema);