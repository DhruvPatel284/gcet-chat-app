import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  console.log("Signup request received:", { fullName, email });

  try {
    if (!fullName || !email || !password) {
      console.log("Validation failed: All fields are required");
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      console.log("Validation failed: Password must be at least 6 characters");
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    console.log("User lookup result:", user ? "User found" : "User not found");

    if (user) {
      console.log("Validation failed: Email already exists");
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully");

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      console.log("New user created:", newUser);
      generateToken(newUser._id, res);
      await newUser.save();
      console.log("User saved successfully");

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      console.log("Validation failed: Invalid user data");
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Error in signup controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received:", { email });

  try {
    const user = await User.findOne({ email });
    console.log("User lookup result:", user ? "User found" : "User not found");

    if (!user) {
      console.log("Validation failed: Invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    console.log("Password comparison result:", isPasswordCorrect ? "Password correct" : "Password incorrect");

    if (!isPasswordCorrect) {
      console.log("Validation failed: Invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);
    console.log("Token generated and sent in response");

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  console.log("Logout request received");
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    console.log("JWT cookie cleared");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  const { profilePic } = req.body;
  const userId = req.user._id;
  console.log("Update profile request received:", { userId, profilePic });

  try {
    if (!profilePic) {
      console.log("Validation failed: Profile pic is required");
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    console.log("Profile picture uploaded to Cloudinary:", uploadResponse.secure_url);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    console.log("User profile updated successfully:", updatedUser);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  console.log("Check auth request received");
  try {
    console.log("User authenticated:", req.user);
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in checkAuth controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




// Store OTPs temporarily (in production, consider using Redis or similar)
const otpStore = {};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(406).json({ error: "User not found" });
    }
    
    // Generate OTP (6 digit number)
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with expiry (10 minutes)
    otpStore[email] = {
      otp,
      expiry: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
    
    // Send email with OTP
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password for the chat application.</p>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(otpStore[email])
    // Check if OTP exists and is valid
    if (!otpStore[email] || otpStore[email].otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    
    // Check if OTP is expired
    if (Date.now() > otpStore[email].expiry) {
      delete otpStore[email]; // Clean up expired OTP
      return res.status(400).json({ error: "OTP expired" });
    }
    
    // OTP is valid, generate a temporary token for resetting password
    const resetToken = crypto.randomBytes(32).toString('hex');
    otpStore[email].resetToken = resetToken;
    
    return res.status(200).json({ message: "OTP verified", resetToken });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    
    // Verify reset token
    if (!otpStore[email] || otpStore[email].resetToken !== resetToken) {
      return res.status(400).json({ error: "Invalid reset token" });
    }
    
    // Find user and update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password
    user.password = hashedPassword;
    await user.save();
    
    // Clear OTP data
    delete otpStore[email];
    
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};