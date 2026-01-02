import Message from "../models/Message.js"
import User from "../models/User.js"
import cloudinary from '../lib/cloudinary.js'
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // 1. Get all users except the logged-in user
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password");

    // 2. For each user, fetch the last message with them
    const usersWithLastMessage = await Promise.all(
      filteredUsers.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: user._id },
            { senderId: user._id, receiverId: loggedInUserId }
          ]
        })
          .sort({ createdAt: -1 }) // newest message first
          .lean(); // plain JS object

        return {
          ...user.toObject(),
          lastMessage: lastMessage || null
        };
      })
    );

    res.status(200).json(usersWithLastMessage);

  } catch (error) {
    console.error("Error in getAllContacts controller:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async(req,res) => {
    try {
        const myId = req.user._id
        const {id:userToChatId} = req.params
        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId}
            ]
        })
        res.status(200).json(messages)
    } catch (error) {
        console.error(error)
        res.status(500).json({message: "Internal server error"})
    }
}

export const sendMessage = async(req,res) => {
     try {
        const { text, image } = req.body
        const { id: receiverId } = req.params
        const senderId = req.user._id
        
        // tackle all the problems related to the text and image
        if (!text && !image) {
            return res.status(400).json({ message: "Text or image is required." })
        }
        if (senderId.equals(receiverId)) return res.status(400).json({ message: "Cannot send messages to yourself" })
        
        const receiverExists = await User.exists({_id: receiverId})
        if (!receiverExists) return res.status(404).json({ message: "Receiver not found." })

        let imageUrl=null
        if (image) {
            // upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        })
        
        await newMessage.save()

        // todo: send message in real-time if user is online - socket.io
        const receiverSocketId = getReceiverSocketId(receiverId)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.status(201).json(newMessage)
    } catch (error) {
        console.error("Error in sendMessage controller: ", error.message)
        res.status(500).json({message: "Internal server error"})
    }
}

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id

    // find all messages where the logged-in user is either sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    }).sort({ createdAt: -1 }) // newest first

    // get unique chat partner IDs in order of last message
    const chatPartnerMap = {}
    for (let msg of messages) {
      const partnerId = msg.senderId.toString() === loggedInUserId.toString()
        ? msg.receiverId.toString()
        : msg.senderId.toString()

      // only add the first (newest) message for each partner
      if (!chatPartnerMap[partnerId]) {
        chatPartnerMap[partnerId] = msg
      }
    }

    const chatPartnerIds = Object.keys(chatPartnerMap)

    // fetch partner user data
    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password")

    // combine user info with lastMessage
    const result = chatPartners.map((user) => ({
      ...user.toObject(),
      lastMessage: chatPartnerMap[user._id.toString()] || null
    }))

    // optional: sort by last message time descending
    result.sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt))

    res.status(200).json(result)

  } catch (error) {
    console.error("Error in getChatPartnersWithLastMessage:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}