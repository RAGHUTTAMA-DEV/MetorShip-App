import mongoose from 'mongoose';


const courseSchema =new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true,
    },
    description:{
        type:String,
        required:true,
        trim:true,
    },
    price:{
        type:Number,
        required:true,
        min:0,
    },
    instructor:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    }],
    createdAt:{
        type:Date,
        default:Date.now,
    },
    updatedAt:{
        type:Date,
        default:Date.now,
    },
    isActive:{
        type:Boolean,
        default:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    tags:[{
        type:String,
        trim:true,
    }],
    totalEnrollments:{
        type:Number,
        default:0,
    },
    totalViews:{
        type:Number,
    },
    totalRatings:{
        type:Number,
        default:0,
    },
    averageRating:{
        type:Number,
        default:0,
    },
    totalReviews:{
        type:Number,
        default:0,
    },
    reviews:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
        },
        rating:{
            type:Number,
            required:true,
            min:1,
            max:5,
        },
        comment:{
            type:String,
            required:true,
        },
        createdAt:{
            type:Date,
            default:Date.now,
        },
    }],
    purchasedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
})


export default mongoose.model('Course', courseSchema);