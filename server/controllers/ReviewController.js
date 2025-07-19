import ReviewModel from "../models/ReviewModel.js";
import UserModel from "../models/UserModel.js";

export async function createReview(req, res) {
    try {
        const { bookingId, review, rating, mentor } = req.body;
        const reviewedBy = req.user._id; // Get from authenticated user

        if (!bookingId || !review || !rating || !mentor) {
            return res.status(400).json({
                message: "Missing required fields: bookingId, review, rating, and mentor are required"
            });
        }

        const isMentor = await UserModel.findById(mentor);
        if (!isMentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        const isReviewed = await UserModel.findById(reviewedBy);
        if (!isReviewed) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingReview = await ReviewModel.findOne({
            mentor,
            reviewedBy
        });

        if (existingReview) {
            return res.status(400).json({
                message: "You have already reviewed this mentor"
            });
        }

        const newReview = await ReviewModel.create({
            bookingId,
            review,
            rating,
            mentor,
            reviewedBy
        });

        res.status(201).json({
            message: "Review created successfully",
            review: newReview
        });
    } catch (err) {
        console.error("Create review error:", err);
        res.status(500).json({
            message: "Error creating review",
            error: err.message
        });
    }
}

export async function getReview(req, res) {
    try {
        const { id } = req.params; // mentor id

        if (!id) {
            return res.status(400).json({
                message: "Mentor ID is required"
            });
        }

        const reviews = await ReviewModel.find({ mentor: id })
            .populate("bookingId")
            .populate("mentor", "username email")
            .populate("reviewedBy", "username email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Reviews fetched successfully",
            count: reviews.length,
            reviews
        });
    } catch (err) {
        console.error("Get reviews error:", err);
        res.status(500).json({
            message: "Error fetching reviews",
            error: err.message
        });
    }
}