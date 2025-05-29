import express from "express";
import { createBooking, updateBookingStatus, getBookings, getBookingById } from "../controllers/BookingController.js";
import middleware from "../middleware/middleware.js";

const router = express.Router();

router.use(middleware);
router.post("/create", createBooking);
router.put("/status/:id", updateBookingStatus);
router.get("/", getBookings);
router.get("/:id", getBookingById);

export default router;