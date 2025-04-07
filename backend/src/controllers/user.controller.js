// controllers/user.controller.js
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const updateProfile = async (req, res) => {
    try {
      const userId = req.user._id;
      const { fullName, email, password, profilePic } = req.body;
      
      console.log("Update profile request received:", { userId, fullName, email, profilePic: profilePic ? "Image data received" : null });
  
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        console.log("User not found:", userId);
        return res.status(404).json({ message: "User not found" });
      }
  
      // Prepare the update object
      const updateData = {};
      
      // Update fields if provided
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      
      // If password is provided, hash it before saving
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      
      // If profilePic is provided, upload to Cloudinary
      if (profilePic) {
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        console.log("Profile picture uploaded to Cloudinary:", uploadResponse.secure_url);
        updateData.profilePic = uploadResponse.secure_url;
      }
  
      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select("-password");
      
      console.log("User profile updated successfully");
  
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error in update profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

export const getUserProfile = async (req, res) => {
    try {
      const userId = req.user._id;
      
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(user);
    } catch (error) {
      console.error("Error in getUserProfile controller:", error.message);
      res.status(500).json({ message: "Internal server error" });
    }
  };