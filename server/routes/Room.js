import express from "express";
import { createRoom, getRoom, endRoom } from "../controllers/RoomController.js";
import middleware from "../middleware/middleware.js";

const router = express.Router();

// All routes are protected
router.use(middleware);

router.post("/create", createRoom);

router.get("/:id", getRoom);

// End room
router.post("/:id/end", endRoom);

export default router;