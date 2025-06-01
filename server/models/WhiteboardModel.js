import mongoose from "mongoose";

const whiteboardSchema = new mongoose.Schema({
    roomId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Room",
        required:true
    },
    strokes:[{
        id:String,points:[{
            x:Number,y:Number
        }],
        color:String,
        width:Number,
        tool:String,
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        timestamp:{
            type:Date,
            default:Date.now
        }
    }],
    isLocked:{
        type:Boolean,
        default:false
    },lockedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

export default mongoose.model("Whiteboard", whiteboardSchema); 