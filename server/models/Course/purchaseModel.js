import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    courseId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Course',
        required:true,
    },
    paymentId:{
        type:String,
        required:true,
    },
    paymentStatus:{
        type:String,
        required:true,
    },
    purchaseDate:{
        type:Date,
        default:Date.now,
    },
    amount:{
        type:Number,
        required:true,
    },
    purchaseStatus:{
        type:String,
        required:true,
        enum:purchaseStatus,
    },
    
})

const purchaseStatus ={
    PENDING:'PENDING',
    COMPLETED:'COMPLETED',
    FAILED:'FAILED',
    CANCELLED:'CANCELLED',
}


export default mongoose.model('Purchase', purchaseSchema);