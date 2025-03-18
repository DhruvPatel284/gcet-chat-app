// controllers/adminController.js
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/emailService.js";

// Create a new user
export const createUser = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    // Default password
    const defaultPassword = "gcet123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    
    // Create new user
    const newUser = new User({
      email,
      fullName,
      password: hashedPassword,
      isAdmin: false, // Regular user by default
    });
    
    await newUser.save();
    
    // Send email with credentials
    await sendEmail({
      to: email,
      subject: "Your Faculty Chat App Credentials",
      html: `
        <h1>Welcome to Faculty Chat App!</h1>
        <p>Hello ${fullName},</p>
        <p>Your account has been created. Here are your login credentials:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${defaultPassword}</p>
        <p>Please change your password after the first login.</p>
      `
    });
    
    res.status(200).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.log("Error in createUser controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("User ID to delete: ", userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot delete your own admin account" });
    }
    
    // Prevent deletion of other admins
    if (user.isAdmin && user._id.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot delete other admin accounts" });
    }
    
    await User.findByIdAndDelete(userId);
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleteUser controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users except the current admin
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 }); // Sort by creation date
    
    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllUsers controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


// controllers/adminController.js
// Add this new function to your existing controller

// Toggle admin status
export const toggleAdminStatus = async (req, res) => {
    try {
      const userId = req.params.id;
      const { isAdmin } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Prevent changing own admin status
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: "You cannot change your own admin status" });
      }
      
      // Update the user's admin status
      user.isAdmin = isAdmin;
      await user.save();
      
      res.status(200).json({ 
        message: `User ${isAdmin ? "promoted to admin" : "demoted from admin"} successfully`,
        user
      });
    } catch (error) {
      console.log("Error in toggleAdminStatus controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };