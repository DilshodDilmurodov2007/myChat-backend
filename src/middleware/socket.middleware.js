import jwt from "jsonwebtoken";
import dotenv from "dotenv/config";
import User from "../models/User.js";


export const socketAuthMiddleware = async(socket, next) => {
    try {
        const token = socket.handshake.headers.cookie
            ?.split("; ")
            .find((row) => row.startsWith("jwt="))
            ?.split("=")[1];

        if (!token) {
            console.log("Socket authentication failed: No token provided");
            return next(new Error("Authentication error: Token not provided"));
        }

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            console.log("Socket authentication failed: Invalid token");
            return next(new Error("Authentication error: Invalid token"));
        }

        // find user by from db
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            console.log("Socket authentication failed: User not found");
            return next(new Error("Authentication error: User not found"));
        }

        socket.user = user;
        socket.userId = user._id.toString();
        
        next();
    } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error"));
    }
};
