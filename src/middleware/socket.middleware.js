import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/User.js";
import cookie from "cookie";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return next(new Error("Authentication error: JWT secret not configured"));
    }

    // 1) Prefer token passed explicitly via handshake auth (most reliable)
    let token = socket.handshake.auth?.token;

    // 2) Fallback to cookie if no auth token provided
    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie;
      if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader);
        token = cookies.jwt;
      }
    }

    if (!token) {
      console.log("Socket authentication failed: No token provided");
      return next(new Error("Authentication error: Token not provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      console.log("Socket authentication failed: User not found");
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user;
    socket.userId = user._id.toString();
    next();
  } catch (error) {
    console.log("Socket authentication failed:", error?.message);
    return next(new Error("Authentication error: Invalid token"));
  }
};
