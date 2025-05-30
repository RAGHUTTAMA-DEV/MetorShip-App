import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import { connectDB } from "./config.js";
import authRoutes from "./routes/Auth.js"
import bookingRoutes from "./routes/Booking.js"
import roomRoutes from "./routes/Room.js"
import { setupSocket } from "./socket.js";
import reviewsRoutes from "./routes/Reviews.js"

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);  

setupSocket(server);

// API root route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Mentorship App API",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            bookings: "/api/booking",
            rooms: "/api/rooms",
            reviews: "/api/reviews"
        }
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/reviews", reviewsRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    try {
        connectDB();
        console.log(`Server is running on port ${PORT}`);
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
});