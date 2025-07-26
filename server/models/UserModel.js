import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin", "mentor"],
        default: "user"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    avatarUrl: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    skills: {
        type: Array,
        default: []
    },
    bio: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    availability: {
        day: {
            type: String,
            default: ""
        },
        slots: {
            type: Array,
            default: []
        }
    },
    experience: {
        type: String,
        default: ""
    },
    reviews:{
        type: Array,
        default: [],
        ref: "Review"
    }
});

export default mongoose.model("User", userSchema);