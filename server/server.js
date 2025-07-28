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
import courseRouter from "./routes/Course/Course.js"
import sectionrouter from "./routes/Course/Section.js"
import purchaserouter from "./routes/Course/Purchases.js"
import filerouter from "./routes/Course/Fileuploads.js"
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname);
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(path.join(__dirname, './files')));

const server = http.createServer(app);  

setupSocket(server);

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
app.use("/api/courses", courseRouter);
app.use('/api/sections',sectionrouter)
app.use('/api/purchase',purchaserouter)
app.use('/api/files',filerouter);
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