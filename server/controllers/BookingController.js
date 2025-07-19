import BookingModel from "../models/BookingModel.js";
import RoomModel from "../models/RoomModel.js";
import UserModel from "../models/UserModel.js";
import mongoose from "mongoose";
import { io } from "../socket.js";

export async function createBooking(req, res) {
    try {
        const { mentor, date, slot, sessionLink, whiteBoardId, chatRoomId } = req.body;
        
        if (!mentor || !date || !slot) {
            return res.status(400).json({
                message: "Missing required fields: mentor, date, and slot are required"
            });
        }
        if (!mongoose.Types.ObjectId.isValid(mentor)) {
            return res.status(400).json({
                message: "Invalid mentor ID format"
            });
        }
        const learner = req.user._id;
        if (!learner) {
            return res.status(401).json({
                message: "User not authenticated"
            });
        }

        const mentorExists = await UserModel.findOne({ _id: mentor, role: "mentor", isActive: true });
        if (!mentorExists) {
            return res.status(404).json({
                message: "Mentor not found or not active"
            });
        }

        const existingBooking = await BookingModel.findOne({
            mentor,
            date,
            slot,
            status: { $in: ["requested", "confirmed"] }
        });

        if (existingBooking) {
            return res.status(400).json({
                message: "This time slot is already booked"
            });
        }

        const bookingData = {
            learner,
            mentor,
            date,
            slot,
            status: "requested"
        };
        if (sessionLink) {
            bookingData.sessionLink = sessionLink;
        }
        if (whiteBoardId && mongoose.Types.ObjectId.isValid(whiteBoardId)) {
            bookingData.whiteBoardId = whiteBoardId;
        }
        if (chatRoomId && mongoose.Types.ObjectId.isValid(chatRoomId)) {
            bookingData.chatRoomId = chatRoomId;
        }

        const booking = await BookingModel.create(bookingData);

        return res.status(201).json({
            message: "Booking created successfully",
            booking
        });

    } catch (err) {
        console.error("Create booking error:", err);
        return res.status(500).json({
            message: "Error creating booking",
            error: err.message
        });
    }
}

export async function updateBookingStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userId;

        const booking = await BookingModel.findById(id)
            .populate('learner', 'username')
            .populate('mentor', 'username');

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Convert both IDs to strings for comparison
        const mentorId = booking.mentor._id.toString();
        const learnerId = booking.learner._id.toString();
        const userIdStr = userId.toString();

        console.log('Comparing IDs:', {
            mentorId,
            learnerId,
            userId: userIdStr
        });

        if (mentorId !== userIdStr && learnerId !== userIdStr) {
            return res.status(403).json({
                message: "Not authorized to update this booking"
            });
        }

        // Update status
        booking.status = status;
        await booking.save();
        if (status === "confirmed") {
            const room = await RoomModel.create({
                bookingId: booking._id,
                mentor: booking.mentor,
                learner: booking.learner,
                sessionLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`
            });

            booking.sessionLink = room.sessionLink;
            await booking.save();

            io.to(booking.learner._id.toString()).emit("booking:statusUpdate", {
                bookingId: booking._id,
                status: "confirmed",
                sessionLink: room.sessionLink,
                mentor: {
                    id: booking.mentor._id,
                    username: booking.mentor.username
                }
            });

            return res.status(200).json({
                message: "Booking confirmed and room created successfully",
                booking,
                room
            });
        }

        io.to(booking.learner._id.toString()).emit("booking:statusUpdate", {
            bookingId: booking._id,
            status: status,
            mentor: {
                id: booking.mentor._id,
                username: booking.mentor.username
            }
        });

        return res.status(200).json({
            message: "Booking status updated successfully",
            booking
        });

    } catch (err) {
        console.error("Update booking error:", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getBookings(req, res) {
    try {
        const userId = req.user._id;  
        const { 
            status, 
            role,
            startDate,
            endDate,
            searchTerm,
            sortBy = 'date',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        let query = {};
        if (role === 'mentor') {
            query.mentor = userId;
        } else if (role === 'learner') {
            query.learner = userId;
        } else {
            query.$or = [
                { mentor: userId },
                { learner: userId }
            ];
        }

        if (status) {
            const validStatuses = ['requested', 'confirmed', 'rejected', 'completed'];
            if (validStatuses.includes(status)) {
                query.status = status;
            } else {
                return res.status(400).json({
                    message: "Invalid status. Must be one of: requested, confirmed, rejected, completed"
                });
            }
        }
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }
        if (searchTerm) {
            const searchQuery = {
                $or: [
                    { 'mentor.username': { $regex: searchTerm, $options: 'i' } },
                    { 'learner.username': { $regex: searchTerm, $options: 'i' } }
                ]
            };
            query = { ...query, ...searchQuery };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Determine sort order
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const sortOptions = {
            [sortBy]: sortDirection
        };

        const totalCount = await BookingModel.countDocuments(query);

        const bookings = await BookingModel.find(query)
            .populate('mentor', 'username email role')
            .populate('learner', 'username email role')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));
        const roomIds = await Promise.all(
            bookings.map(async (booking) => {
                if (booking.status === 'confirmed') {
                    const room = await RoomModel.findOne({ bookingId: booking._id });
                    return room ? room._id : null;
                }
                return null;
            })
        );

        const formattedBookings = bookings.map((booking, index) => ({
            id: booking._id,
            mentor: {
                id: booking.mentor._id,
                username: booking.mentor.username,
                email: booking.mentor.email,
                role: booking.mentor.role
            },
            learner: {
                id: booking.learner._id,
                username: booking.learner.username,
                email: booking.learner.email,
                role: booking.learner.role
            },
            date: booking.date,
            slot: booking.slot,
            status: booking.status,
            sessionLink: booking.sessionLink,
            whiteBoardId: booking.whiteBoardId,
            chatRoomId: booking.chatRoomId,
            roomId: roomIds[index],
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt
        }));

        return res.status(200).json({
            message: "Bookings fetched successfully",
            count: formattedBookings.length,
            totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            currentPage: parseInt(page),
            bookings: formattedBookings
        });

    } catch (err) {
        console.error("Get bookings error:", err);
        return res.status(500).json({
            message: "Error fetching bookings",
            error: err.message
        });
    }
}

export async function getBookingById(req, res) {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const booking = await BookingModel.findById(id)
            .populate('mentor', 'username email')
            .populate('learner', 'username email');

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }
        if (booking.mentor._id.toString() !== userId && booking.learner._id.toString() !== userId) {
            return res.status(403).json({
                message: "Not authorized to view this booking"
            });
        }

        return res.status(200).json({
            message: "Booking fetched successfully",
            booking
        });

    } catch (err) {
        console.error("Get booking error:", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}