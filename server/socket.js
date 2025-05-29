import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatRoomModel from "./models/ChatRoomModel.js";

export function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.user.username);

        // Join room
        socket.on("room:join", async (roomId) => {
            try {
                // Join socket room
                socket.join(roomId);
                console.log(`User ${socket.user.username} joined room ${roomId}`);

                // Notify others in the room
                socket.to(roomId).emit("room:userJoined", {
                    username: socket.user.username,
                    userId: socket.user._id
                });

                // Get chat history
                const chatRoom = await ChatRoomModel.findOne({ roomId })
                    .populate('messages.sender', 'username');
                
                if (chatRoom) {
                    socket.emit("chat:history", chatRoom.messages);
                }
            } catch (err) {
                console.error("Room join error:", err);
                socket.emit("error", "Error joining room");
            }
        });

        // Send message
        socket.on("chat:message", async (data) => {
            try {
                const { roomId, content, type = 'text' } = data;
                
                // Create new message
                const message = {
                    sender: socket.user._id,
                    content,
                    type,
                    timestamp: new Date()
                };

                // Update chat room
                const chatRoom = await ChatRoomModel.findOneAndUpdate(
                    { roomId },
                    { $push: { messages: message } },
                    { new: true }
                ).populate('messages.sender', 'username');

                if (chatRoom) {
                    // Broadcast message to room
                    io.to(roomId).emit("chat:newMessage", {
                        ...message,
                        sender: {
                            _id: socket.user._id,
                            username: socket.user.username
                        }
                    });
                }
            } catch (err) {
                console.error("Message send error:", err);
                socket.emit("error", "Error sending message");
            }
        });

        // Mark messages as read
        socket.on("chat:markRead", async (data) => {
            try {
                const { roomId, messageIds } = data;
                
                await ChatRoomModel.updateMany(
                    { 
                        roomId,
                        'messages._id': { $in: messageIds }
                    },
                    { 
                        $addToSet: { 
                            'messages.$[].readBy': socket.user._id 
                        }
                    }
                );

                socket.to(roomId).emit("chat:messagesRead", {
                    userId: socket.user._id,
                    messageIds
                });
            } catch (err) {
                console.error("Mark read error:", err);
                socket.emit("error", "Error marking messages as read");
            }
        });

        // Leave room
        socket.on("room:leave", (roomId) => {
            socket.leave(roomId);
            socket.to(roomId).emit("room:userLeft", {
                username: socket.user.username,
                userId: socket.user._id
            });
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.user.username);
        });
    });

    return io;
} 