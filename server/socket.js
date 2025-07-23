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
            origin: "*",
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

    // Map userId to socket.id for direct signaling
    const userSocketMap = {};

    io.on("connection", (socket) => {
        console.log("User connected:", socket.user.username);
        userSocketMap[socket.user._id] = socket.id;

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

                booking.status = "confirmed";
                await booking.save();

                const room = await RoomModel.create({
                    bookingId: booking._id,
                    mentor: booking.mentor,
                    learner: booking.learner,
                    sessionLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`
                });
                booking.sessionLink = room.sessionLink;
                await booking.save();

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
                const room = await RoomModel.findById(roomId)
                    .populate('mentor', '_id')
                    .populate('learner', '_id');
                    
                if (!room) {
                    throw new Error("Room not found");
                }

                const isMentor = room.mentor._id.toString() === socket.user._id;
                const isLearner = room.learner._id.toString() === socket.user._id;

                if (!isMentor && !isLearner) {
                    throw new Error("Unauthorized to join this room. You must be either the mentor or learner of this session.");
                }
                socket.join(roomId);
                console.log(`User ${socket.user.username} joined room ${roomId} as ${isMentor ? 'mentor' : 'learner'}`);
                let chatRoom;
                if (room.chatRoomId) {
                    chatRoom = await ChatRoomModel.findById(room.chatRoomId);
                }

                if (!chatRoom) {
                    chatRoom = await ChatRoomModel.create({
                        roomId,
                        participants: [room.mentor._id, room.learner._id],
                        messages: []
                    });
                    
                    room.chatRoomId = chatRoom._id;
                    await room.save();
                }

                socket.to(roomId).emit("room:userJoined", {
                    username: socket.user.username,
                    userId: socket.user._id,
                    role: isMentor ? 'mentor' : 'learner'
                });
                const populatedChatRoom = await ChatRoomModel.findById(chatRoom._id)
                    .populate('messages.sender', 'username');
                
                if (populatedChatRoom) {
                    socket.emit("chat:history", populatedChatRoom.messages);
                }
                if (room.whiteboardId) {
                    const whiteboard = await WhiteboardModel.findById(room.whiteboardId)
                        .populate("strokes.userId", "username")
                        .populate("undoStack.userId", "username")
                        .populate("redoStack.userId", "username");
                    
                    if (whiteboard) {
                        socket.emit("whiteboard:history", {
                            strokes: whiteboard.strokes || [],
                            undoStack: whiteboard.undoStack || [],
                            redoStack: whiteboard.redoStack || []
                        });
                    }
                }
            } catch (err) {
                console.error("Room join error:", err);
                socket.emit("error", err.message || "Error joining room");
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
                const chatRoom = await ChatRoomModel.findByIdAndUpdate(
                    room.chatRoomId,
                    { $push: { messages: message } },
                    { new: true }
                ).populate('messages.sender', 'username');

                if (chatRoom) {
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
                let whiteboard=await WhiteboardModel.findById(room.whiteboardId);
                 
                if(!whiteboard){
                    whiteboard=await WhiteboardModel.create({
                        roomId,
                        strokes:[],
                        undoStack: [],
                        redoStack: []
                    });
                    room.whiteboardId=whiteboard._id;
                    await room.save();
                }
                whiteboard.strokes.push({
                    ...stroke,
                    userId:socket.user._id,
                    timestamp:new Date()
                });
                whiteboard.redoStack = [];
                await whiteboard.save();
                
                io.to(roomId).emit("whiteboard:stroke",{
                    stroke:{
                        ...stroke,
                        userId:socket.user._id,
                        timestamp:new Date()
                    }
                });

                console.log("Whiteboard stroke sent to room",roomId);
            }catch(err){
                console.error("Whiteboard stroke error:", err);
                socket.emit("error", err.message || "Error sending stroke");
            }
        });

        socket.on("whiteboard:clear",async (roomId)=>{
            try{
                const room=await RoomModel.findById(roomId);
                if(!room){
                    throw new Error("Room not found");
                }
                if(room.mentor.toString()!==socket.user._id && room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to clear whiteboard");
                }
                let whiteboard=await WhiteboardModel.findById(room.whiteboardId);
                
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                whiteboard.strokes=[];
                await whiteboard.save();
                socket.to(roomId).emit("whiteboard:cleared");
                console.log("Whiteboard cleared in room",roomId);
                
            }catch(err){
                console.error("Whiteboard clear error:", err);
                socket.emit("error", err.message || "Error clearing whiteboard");
            }
        });

        socket.on("whiteboard:undo",async (roomId)=>{
            try{
                const room=await RoomModel.findById(roomId);
                if(!room){
                    throw new Error("Room not found");
                }
                if(room.mentor.toString()!==socket.user._id && room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to undo whiteboard");
                }
                let whiteboard=await WhiteboardModel.findById(room.whiteboardId);
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                if(whiteboard.strokes.length===0){
                    throw new Error("Whiteboard is empty");
                }
                const lastStroke = whiteboard.strokes.pop();
                whiteboard.undoStack.push(lastStroke);
                await whiteboard.save();
                io.to(roomId).emit("whiteboard:undo", {
                    stroke: lastStroke
                });
                console.log("Whiteboard undone in room",roomId);
                
            }catch(err){
                console.error("Whiteboard undo error:", err);
                socket.emit("error", err.message || "Error undoing whiteboard");
            }
        });

        socket.on("whiteboard:redo",async (roomId)=>{
            try{
                const room=await RoomModel.findById(roomId);
                if(!room){
                    throw new Error("Room not found");
                }
                if(room.mentor.toString()!==socket.user._id && room.learner.toString()!==socket.user._id){
                    throw new Error("Unauthorized to redo whiteboard");
                }
                let whiteboard=await WhiteboardModel.findById(room.whiteboardId);
                if(!whiteboard){
                    throw new Error("Whiteboard not found");
                }
                if(whiteboard.undoStack.length===0){
                    throw new Error("Nothing to redo");
                }
                const strokeToRedo = whiteboard.undoStack.pop();
                whiteboard.strokes.push(strokeToRedo);
                await whiteboard.save();

                io.to(roomId).emit("whiteboard:redo", {
                    stroke: strokeToRedo
                });
                
            }catch(err){
                console.error("Whiteboard redo error:", err);
                socket.emit("error", err.message || "Error redoing whiteboard");
            }
        });

        socket.on('whiteboard:lock', async (data) => {
            try {
                const { roomId, locked } = data;
                const room = await RoomModel.findById(roomId);
                if (!room || !room.whiteboardId) {
                    throw new Error("Whiteboard not found");
                }
        
                const whiteboard = await WhiteboardModel.findById(room.whiteboardId);
                whiteboard.isLocked = locked;
                whiteboard.lockedBy = locked ? socket.user._id : null;
                await whiteboard.save();
        
                socket.to(roomId).emit('whiteboard:lockState', {
                    locked,
                    lockedBy: locked ? socket.user.username : null
                });
            } catch (err) {
                console.error("Whiteboard lock error:", err);
                socket.emit("error", "Error updating whiteboard lock state");
            }
        });

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

        socket.on('whiteboard:state', async (roomId) => {
            try {
                const room = await RoomModel.findById(roomId);
                if (!room || !room.whiteboardId) {
                    throw new Error("Whiteboard not found");
                }
        
                const whiteboard = await WhiteboardModel.findById(room.whiteboardId)
                    .populate('strokes.userId', 'username');
                
                socket.emit('whiteboard:state', {
                    strokes: whiteboard.strokes,
                    lastModified: whiteboard.updatedAt
                });
            } catch (err) {
                console.error("Whiteboard state error:", err);
                socket.emit("error", "Error fetching whiteboard state");
            }
        });

        socket.on("whiteboard:getHistory", async (roomId) => {
            try {
                const room = await RoomModel.findById(roomId);
                if(!room || !room.whiteboardId){
                    throw new Error("Whiteboard not found");
                }
                const whiteboard = await WhiteboardModel.findById(room.whiteboardId)
                    .populate("strokes.userId", "username")
                    .populate("undoStack.userId", "username")
                    .populate("redoStack.userId", "username");
                const historyData = {
                    strokes: whiteboard.strokes || [],
                    undoStack: whiteboard.undoStack || [],
                    redoStack: whiteboard.redoStack || []
                };

                // Emit to all users in the room
                io.to(roomId).emit("whiteboard:history", historyData);
            } catch(err) {
                console.error("Whiteboard get history error:", err);
                socket.emit("error", err.message || "Error fetching whiteboard history");
            }
        });

        socket.on("chat:markRead", async (data) => {
            try {
                const { roomId, messageIds } = data;
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

        socket.on("room:leave", (roomId) => {
            socket.leave(roomId);
            socket.to(roomId).emit("room:userLeft", {
                username: socket.user.username,
                userId: socket.user._id
            });
        });

        socket.on("call-user",({userToCall,signalData, from, roomId})=>{
            console.log('call-user received:', {userToCall, from, roomId, senderSocket: socket.id});
            const targetSocketId = userSocketMap[userToCall];
            if (targetSocketId) {
                io.to(targetSocketId).emit("call-made",{
                    signal:signalData,
                    from,
                    name:socket.user.username
                });
            } else {
                console.log('Target user socket not found for call-user:', userToCall);
            }
        });
        socket.on("answer-call",({signal,to,roomId})=>{
            console.log('answer-call received:', {to, roomId, senderSocket: socket.id});
            const targetSocketId = userSocketMap[to];
            if (targetSocketId) {
                io.to(targetSocketId).emit("call-accepted",{
                    signal,
                    to:socket.user._id  
                });
            } else {
                console.log('Target user socket not found for answer-call:', to);
            }
        });
        



        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.user.username);
            delete userSocketMap[socket.user._id];
        });
    });

    return io;
}

export { io }; 