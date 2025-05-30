import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['text', 'image', 'file'],
            default: 'text'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        readBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("ChatRoom", chatRoomSchema); 