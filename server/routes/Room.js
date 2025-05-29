import express from "express";
import { createRoom, getRoom, endRoom } from "../controllers/RoomController.js";
import middleware from "../middleware/middleware.js";

const router = express.Router();

// All routes are protected
router.use(middleware);

// Create room for a booking
router.post("/create", createRoom);

// Get room details
router.get("/:id", getRoom);

// End room
router.post("/:id/end", endRoom);

export default router;