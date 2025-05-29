import RoomModel from "../models/RoomModel.js";
import BookingModel from "../models/BookingModel.js";
import UserModel from "../models/UserModel.js";

export async function createRoom(req, res) {
    try {
        const { bookingId } = req.body;
        const userId = req.user._id;

        // Find the booking
        const booking = await BookingModel.findById(bookingId)
            .populate('mentor')
            .populate('learner');

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Check if user is either mentor or learner
        if (booking.mentor._id.toString() !== userId && booking.learner._id.toString() !== userId) {
            return res.status(403).json({
                message: "Not authorized to create room for this booking"
            });
        }

        // Check if booking is confirmed
        if (booking.status !== "confirmed") {
            return res.status(400).json({
                message: "Booking must be confirmed to create a room"
            });
        }

        // Check if room already exists
        const existingRoom = await RoomModel.findOne({ bookingId });
        if (existingRoom) {
            return res.status(400).json({
                message: "Room already exists for this booking",
                room: existingRoom
            });
        }

        // Create room
        const room = await RoomModel.create({
            bookingId,
            mentor: booking.mentor._id,
            learner: booking.learner._id,
            sessionLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`
        });

        return res.status(201).json({
            message: "Room created successfully",
            room
        });

    } catch (err) {
        console.error("Create room error:", err);
        return res.status(500).json({
            message: "Error creating room",
            error: err.message
        });
    }
}

export async function getRoom(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const room = await RoomModel.findById(id)
            .populate('mentor', 'username email')
            .populate('learner', 'username email');

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Check if user is either mentor or learner
        if (room.mentor._id.toString() !== userId && room.learner._id.toString() !== userId) {
            return res.status(403).json({
                message: "Not authorized to access this room"
            });
        }

        // Get booking details
        const booking = await BookingModel.findById(room.bookingId);
        
        // Check if it's time for the session
        const sessionTime = new Date(booking.date + " " + booking.slot.split("-")[0]);
        const currentTime = new Date();

        if (currentTime < sessionTime) {
            return res.status(400).json({
                message: "Session hasn't started yet",
                startTime: sessionTime
            });
        }

        return res.status(200).json({
            message: "Room fetched successfully",
            room,
            booking
        });

    } catch (err) {
        console.error("Get room error:", err);
        return res.status(500).json({
            message: "Error fetching room",
            error: err.message
        });
    }
}

export async function endRoom(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const room = await RoomModel.findById(id);

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Check if user is either mentor or learner
        if (room.mentor.toString() !== userId && room.learner.toString() !== userId) {
            return res.status(403).json({
                message: "Not authorized to end this room"
            });
        }

        // Update room status
        room.status = "ended";
        room.endedAt = new Date();
        await room.save();

        // Update booking status
        await BookingModel.findByIdAndUpdate(room.bookingId, {
            status: "completed"
        });

        return res.status(200).json({
            message: "Room ended successfully",
            room
        });

    } catch (err) {
        console.error("End room error:", err);
        return res.status(500).json({
            message: "Error ending room",
            error: err.message
        });
    }
} 