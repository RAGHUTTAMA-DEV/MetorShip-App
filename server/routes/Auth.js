import express from "express";
import { Register, Login, Profile, Update,GetMentors } from "../controllers/AuthControllers.js";   
import middleware from "../middleware/middleware.js";

const router = express.Router();

router.post("/login", Login);
router.post("/signup", Register);
router.get("/profile/:id",middleware, Profile);
router.put("/update/:id",middleware, Update);
router.get("/mentors",middleware, GetMentors);

export default router;