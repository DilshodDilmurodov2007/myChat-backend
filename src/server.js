import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import cors from 'cors'

import dotenv from 'dotenv/config'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'

import { connectDB } from './lib/db.js'
import { app, server } from './lib/socket.js'


const __dirname = path.resolve()

const PORT = process.env.PORT || 5000; 
const allowedOrigins = [
  'http://localhost:5173', // for local dev
  'https://my-chat-backend-y7d4.vercel.app' // your deployed frontend
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin like mobile apps or curl
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // if you use cookies or auth headers
}));
app.use(express.json({limit: "20mb"})) // req.body
app.use(cookieParser())

app.use("/api/auth", authRoutes)    
app.use("/api/messages", messageRoutes)    

// make ready for deployment
if (process.env.NODE_ENV === "production") {
    app.use(
        express.static(
            path.join(__dirname, "../frontend/dist")
        )
    )
    app.get("", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"))
    })
} 

server.listen(PORT, () => {
    console.log("Server running on port "+ PORT)
    connectDB()
})


