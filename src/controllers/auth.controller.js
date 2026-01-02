import { sendWelcomeEmail } from "../emails/emailHandlers.js"
import cloudinary from "../lib/cloudinary.js"
import { generateToken } from "../lib/utils.js"
import User from "../models/User.js"
import bcrypt from 'bcryptjs'

export const signup = async (req, res) => {
    const {fullName, email, password} = req.body
    try {
        if(!fullName || !email || !password) {
            return res.status(400).json({message:"All fields are required"})
        }
         if(password.length < 6) {
            return res.status(400).json({message:"Password must be at least 6 characters"})
        }
        // check if email is valid: regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({message: "Invalid email format"})
        }

    const user = await User.findOne({email:email,})
    if (user) return res.status(400).json({message: "Email already exists"})
    
    // passport hashing
    // 123456 => #535Tge5#@$%^
    const salt = await bcrypt.genSalt(10) // the length of the string
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword
    })
    if (newUser) {
        // Persist user first, then issue auth cookie
        const savedUser = await newUser.save()
        generateToken(savedUser.id, res)

        res.status(201).json({
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic, 
        })
        
        // send a welcome email to user
        try {
            await sendWelcomeEmail(savedUser.email, savedUser.fullName, process.env.CLIENT_URL)
        } catch (error) {
            console.error(error);
        }

    } else {
        res.status(400).json({message:"Invalid user data"})
    }

    } catch (error) {
        console.log(error)
        res.status(500).json({message: "Internal server error"})
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body
    if (!email || !password) return res.status(400).json({message:"Email and Password are required."})
    try {
        const user = await User.findOne({email})
        if (!user) return res.status(400).json({message: "Invalid Credentials"})
        // never tell the client which one is incorrect: password or email
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if(!isPasswordCorrect) return res.status(400).json({message: "Invalid Credentials"})

        generateToken(user.id, res)

        res.status(200).json({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic, 
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal Server Error"})
    }
}

export const logout = async (_, res) => {
   res.cookie("jwt", "", {maxAge:0}) 
   res.status(200).json({message: "Logout successfully!"})
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body

    if (!profilePic) {
      return res.status(400).json({ message: 'Profile pic is required' })
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // 🧠 Decode base64 and check size
    const base64Data = profilePic.split(',')[1]
    if (!base64Data) {
      return res.status(400).json({ message: 'Invalid image format' })
    }

    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({
        message: 'Image too large. Maximum size is 5MB.'
      })
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic, {
      folder: 'profile_pictures',
      resource_type: 'image',
      transformation: [
        { width: 512, height: 512, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    })

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: uploadResponse.secure_url },
      { new: true, select: '-password' }
    )

    res.status(200).json(updatedUser)
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

