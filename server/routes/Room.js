import express from "express";
import { createRoom, getRoom, endRoom } from "../controllers/RoomController.js";
import middleware from "../middleware/middleware.js";

const router = express.Router();
router.use(middleware);

router.post("/create", createRoom);

router.get("/:id", getRoom);

router.post("/:id/end", endRoom);

export default router;