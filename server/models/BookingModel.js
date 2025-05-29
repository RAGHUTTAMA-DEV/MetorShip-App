import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    learner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mentor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    slot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["requested", "confirmed", "rejected", "completed"],
        default: "requested"
    },
    sessionLink: {
        type: String,
        default: ""
    },
    whiteBoardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Whiteboard"
    },
    chatRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChatRoom"
    },
    feedbackGiven: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Booking", bookingSchema);