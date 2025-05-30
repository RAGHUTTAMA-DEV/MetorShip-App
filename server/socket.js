import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatRoomModel from "./models/ChatRoomModel.js";
import RoomModel from "./models/RoomModel.js";

let io;

export function setupSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

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

        // Join user's notification room
        socket.join(socket.user._id.toString());

        socket.on("accept",async (bookingId)=>{
            try{
                const booking = await BookingModel.findById(bookingId);
                booking.status = "accepted";
                const learner= await UserModel.findById(booking.learner);
                await booking.save();
                io.to(learner.socketId).emit("booking:accepted",booking);
            }catch(err){
                console.log(err);
                socket.emit("error",err.message);
            }
        })

        // Join room
        socket.on("room:join", async (roomId) => {
            try {
                const room = await RoomModel.findById(roomId);
                if (!room) {
                    throw new Error("Room not found");
                }

                // Check if user is authorized to join this room
                if (room.mentor.toString() !== socket.user._id && room.learner.toString() !== socket.user._id) {
                    throw new Error("Unauthorized to join this room");
                }

                // Join socket room
                socket.join(roomId);
                console.log(`User ${socket.user.username} joined room ${roomId}`);

                // Create or get chat room
                let chatRoom;
                if (room.chatRoomId) {
                    chatRoom = await ChatRoomModel.findById(room.chatRoomId);
                }

                if (!chatRoom) {
                    chatRoom = await ChatRoomModel.create({
                        roomId,
                        participants: [room.mentor, room.learner],
                        messages: []
                    });
                    
                    // Update room with chat room ID
                    room.chatRoomId = chatRoom._id;
                    await room.save();
                }

                socket.to(roomId).emit("room:userJoined", {
                    username: socket.user.username,
                    userId: socket.user._id
                });

                // Get chat history
                const populatedChatRoom = await ChatRoomModel.findById(chatRoom._id)
                    .populate('messages.sender', 'username');
                
                if (populatedChatRoom) {
                    socket.emit("chat:history", populatedChatRoom.messages);
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
                
                // Find the room and its chat room
                const room = await RoomModel.findById(roomId);
                if (!room || !room.chatRoomId) {
                    throw new Error("Room or chat room not found");
                }

                // Create new message
                const message = {
                    sender: socket.user._id,
                    content,
                    type,
                    timestamp: new Date()
                };

                // Update chat room
                const chatRoom = await ChatRoomModel.findByIdAndUpdate(
                    room.chatRoomId,
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

        socket.on("chat:markRead", async (data) => {
            try {
                const { roomId, messageIds } = data;
                
                // Find the room and its chat room
                const room = await RoomModel.findById(roomId);
                if (!room || !room.chatRoomId) {
                    throw new Error("Room or chat room not found");
                }

                await ChatRoomModel.updateMany(
                    { 
                        _id: room.chatRoomId,
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

export { io }; 