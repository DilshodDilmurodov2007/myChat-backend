import { Server } from "socket.io";
import http from "http";
import express from "express";
import "dotenv/config"
import { socketAuthMiddleware } from "../middleware/socket.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

const userSocketMap = {} // { userId: socketId }

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.fullName}`);

    const userId = socket.user._id;
    userSocketMap[userId] = socket.id;
    
    // Notify all clients about the updated online users list with io.emit()
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
   
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user.fullName}`);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { server, io, app };