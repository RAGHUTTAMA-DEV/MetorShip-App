import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatRoomModel from "./models/ChatRoomModel.js";
import RoomModel from "./models/RoomModel.js";
import BookingModel from "./models/BookingModel.js";
import UserModel from "./models/UserModel.js";
import WhiteboardModel from "./models/WhiteboardModel.js";
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

        socket.on("accept", async (bookingId) => {
            try {
                const booking = await BookingModel.findById(bookingId);
                if (!booking) {
                    throw new Error("Booking not found");
                }
                
                const learner = await UserModel.findById(booking.learner);
                if (!learner) {
                    throw new Error("Learner not found");
                }

                // Update booking status
                booking.status = "confirmed";
                await booking.save();

                // Create room for the session
                const room = await RoomModel.create({
                    bookingId: booking._id,
                    mentor: booking.mentor,
                    learner: booking.learner,
                    sessionLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`
                });

                // Update booking with session link
                booking.sessionLink = room.sessionLink;
                await booking.save();

                // Notify learner
                io.to(learner._id.toString()).emit("booking:statusUpdate", {
                    bookingId: booking._id,
                    status: "confirmed",
                    sessionLink: room.sessionLink,
                    mentor: {
                        id: booking.mentor,
                        username: socket.user.username
                    }
                });
                alert("Booking accepted");
            } catch (err) {
                console.error("Socket accept error:", err);
                socket.emit("error", err.message);
            }
        });

        socket.on("reject", async (bookingId) => {
            try {
                const booking = await BookingModel.findById(bookingId);
                if (!booking) {
                    throw new Error("Booking not found");
                }
                
                const learner = await UserModel.findById(booking.learner);
                if (!learner) {
                    throw new Error("Learner not found");
                }

                // Update booking status
                booking.status = "rejected";
                await booking.save();

                io.to(learner._id.toString()).emit("booking:statusUpdate", {
                    bookingId: booking._id,
                    status: "rejected",
                    mentor: {
                        id: booking.mentor,
                        username: socket.user.username
                    }
                });
                alert("Booking rejected");
            } catch (err) {
                console.error("Socket reject error:", err);
                socket.emit("error", err.message);
            }
        });

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

        socket.on("chat:message", async (data) => {
            try {
                const { roomId, content, type = 'text' } = data;
                
                const room = await RoomModel.findById(roomId);
                if (!room || !room.chatRoomId) {
                    throw new Error("Room or chat room not found");
                }

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

        socket.on('whiteboard:stroke',async (data)=>{
            try{
                const {roomId,stroke}=data;
                const room=await RoomModel.findById(roomId);
                if(!room){
                    throw new Error("Room not found");
                }
                if(room.mentor.toString()!==socket.user._id && room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to send stroke");
                }
                let whiteboard=await WhiteboardModel.findOne(room.whiteboardId);
                 
                if(!whiteboard){
                    whiteboard=await WhiteboardModel.create({
                        roomId,
                        strokes:[]
                    });
                    room.whiteboardId=whiteboard._id;
                    await room.save();
                }

                whiteboard.strokes.push({
                    ...stroke,userId:socket.user._id,timestamp:new Date()
                })
                await whiteboard.save();
                socket.to(roomId).emit("whiteboard:stroke",{
                    stroke:{
                        ...stroke,
                        userId:socket.user._id,
                        timestamp:new Date()
                    }
                })
                console.log("Whiteboard stroke sent to room",roomId);
            }catch(err){
                console.error("Whiteboard stroke error:", err);
                socket.emit("error", "Error sending stroke");
            }
        })

        socket.on("whiteboard:clear",async (roomId)=>{
            try{
                const room=await RoomModel.findById(roomId);
                if(!room){
                    throw new Error("Room not found");
                }
                if(room.mentor.toString()!==socket.user._id && room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to clear whiteboard");
                }
                let whiteboard=await WhiteboardModel.findOne(room.whiteboardId);
                
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                whiteboard.strokes=[];
                await whiteboard.save();
                socket.to(roomId).emit("whiteboard:clear");
                console.log("Whiteboard cleared in room",roomId);
                
            }catch(err){
                console.error("Whiteboard clear error:", err);
                socket.emit("error", "Error clearing whiteboard");
            }
        })

        socket.on("whiteboard:undo",async (roomId)=>{

            try{
                const room=await RoomModel.findById(roomId);
                if(!room){
                    throw new Error("Room not found");
                }
                if(room.mentor.toString()!==socket.user._id && room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to undo whiteboard");
                }
                let whiteboard=await WhiteboardModel.findOne(room.whiteboardId);
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                if(whiteboard.strokes.length===0){
                    throw new Error("Whiteboard is empty");
                }
                const lastStroke=whiteboard.strokes.pop();
                await whiteboard.save();
                socket.to(roomId).emit("whiteboard:undo",{
                    stroke:lastStroke
                });
                console.log("Whiteboard undone in room",roomId);
                
            }catch(err){
                console.error("Whiteboard undo error:", err);
                socket.emit("error", "Error undoing whiteboard");
            }
        })

        socket.on("whiteboard:redo",async (roomId)=>{
            try{
                const room=await RoomModel.findById(roomId);
                if(!room){
                    throw new Error("Room not found");
                }
                if(room.mentor.toString()!==socket.user._id && room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to redo whiteboard");
                }
                let whiteboard=await WhiteboardModel.findOne(room.whiteboardId);
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                if(whiteboard.strokes.length===0){
                    throw new Error("Whiteboard is empty");
                }
                const nextStroke=whiteboard.strokes[whiteboard.strokes.length-1];
                whiteboard.strokes.push(nextStroke);
                await whiteboard.save();
                socket.to(roomId).emit("whiteboard:redo",{
                    stroke:nextStroke
                });
                
            }catch(err){
                console.error("Whiteboard redo error:", err);
                socket.emit("error", "Error redoing whiteboard");
            }
        })

        socket.on("whiteboard:lock",async (roomId,userId)=>{
            try{
                const room=await RoomModel.findOne({_id:roomId}).populate("learner");
                if(room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to lock whitebocard");
                }
                let whiteboard=await WhiteboardModel.findOne(room.whiteboardId);
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                whiteboard.isLocked=true;
                whiteboard.lockedBy=userId;
                await whiteboard.save();
                socket.to(roomId).emit("whiteboard:lock",userId);
                console.log("Whiteboard locked by ${userId}");
            }catch(err){
                console.error("Whiteboard lock error:", err);   
            }
        })

        socket.on("whiteboard:unlock",async (roomId,userId)=>{
            try{
                const room=await RoomModel.findOne({_id:roomId}).populate("learner");
                if(room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to unlock whitebocard");
                }
                let whiteboard=await WhiteboardModel.findOne(room.whiteboardId);
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                whiteboard.isLocked=false;
                whiteboard.lockedBy=null;
                await whiteboard.save();
                socket.to(roomId).emit("whiteboard:unlock",userId);
                console.log("Whiteboard unlocked by ${userId}");
            }catch(err){
                console.error("Whiteboard unlock error:", err);
                socket.emit("whiteboard:unlockError",err.message);
            }
        })
        


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