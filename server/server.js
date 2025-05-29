import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { connectDB } from "./config";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);  

const io = new Server(server, {
    cors: {
        origin: "*",  // Allow all origins for testing
        methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"],
    allowUpgrades: false,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    path: '/socket.io/'
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send welcome message
    socket.emit("message", "Welcome to the server!");

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });

    socket.on("message", (data) => {
        console.log("Received message:", data);
        // Echo the message back to the client
        socket.emit("message", `Server received: ${data}`);
    });
});

app.get("/", (req, res) => {
    res.sendFile("index.html", { root: "./" });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    try{
        connectDB();
        console.log(`Server is running on port ${PORT}`);
    }catch(err){
        console.error("Error connecting to MongoDB:",err);
        process.exit(1);
    }
});