import UserModel from "../models/UserModel.js";
import jwt from "jsonwebtoken"
const JWT_SECRET=process.env.JWT_SECRET;

export async function Register(req,res){
    try{
        const {username,email,password,role}=req.body;
        
        const existingUser = await UserModel.findOne({
            username
        });
        
        if(existingUser){
            return res.status(400).json({
                message:"User already exists"
            });
        }

        const token = jwt.sign({username,email,role}, JWT_SECRET);

        const newUser = await UserModel.create({
            username,
            email,
            password,
            role,
            token
        });

        return res.status(200).json({
            message:"User created successfully",
            token,
            user: {
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });
    }catch(err){
        console.error("Registration error:", err);
        return res.status(500).json({
            message:"Internal server error"
        });
    }
}

export async function Login(req, res) {
    try { 
        const { email, password } = req.body;
        
        const user = await UserModel.findOne({
            email
        });

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // In a real application, you should compare hashed passwords here
        if (user.password !== password) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        const token = jwt.sign(
            { 
                _id: user._id,
                username: user.username, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET
        );

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function Profile(req, res) {
    try {
        const { id } = req.params;

        const user = await UserModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User profile fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                bio: user.bio,
                skills: user.skills,
                location: user.location,
                availability: user.availability,
                experience: user.experience,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error("Profile fetch error:", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function Update(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;

        const user = await UserModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const allowedUpdates = [
            'bio', 'skills', 'location', 'availability', 
            'experience', 'avatarUrl', 'isActive'
        ];
        
        const updates = {};
        Object.keys(data).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = data[key];
            }
        });

        const updatedUser = await UserModel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: "User updated successfully",
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                bio: updatedUser.bio,
                skills: updatedUser.skills,
                location: updatedUser.location,
                availability: updatedUser.availability,
                experience: updatedUser.experience,
                updatedAt: updatedUser.updatedAt
            }
        });
    } catch (err) {
        console.error("Update error:", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


export async function GetMentors(req,res){
    try{
        const mentors = await UserModel.find({role: "mentor", isActive: true});
        return res.status(200).json({
            message: "Mentors fetched successfully",
            mentors: mentors
        });
    }catch(err){
        console.error("GetMentors error:", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

