import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

//const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "https://gcet-chat-app.onrender.com";
export const BASE_URL = import.meta.env.BACKEND_URL|| "http://localhost:5001";
export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      // Check if we're updating a profile picture or other user data
      const isProfilePicUpdate = !!data.profilePic && Object.keys(data).length === 1;
      
      // Log what's being updated (without showing sensitive data)
      console.log("Updating profile with fields:", Object.keys(data));
      
      const res = await axiosInstance.put(`/users/updateProfile`, data);
      set({ authUser: res.data });
      
      // Only show toast if it's not a profile pic update (since we already show uploading status)
      if (!isProfilePicUpdate) {
        toast.success("Profile updated successfully");
      }
      
      return res.data;
    } catch (error) {
      console.error("Error in update profile:", error);
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  
  // Password reset functionality
  forgotPassword: async (email) => {
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      toast.success("OTP sent to your email");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
      return false;
    }
  },
  
  verifyOTP: async (email, otp) => {
    try {
      await axiosInstance.post("/auth/verify-otp", { email, otp });
      toast.success("OTP verified successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
      return false;
    }
  },
  
  resetPassword: async (email, password, otp) => {
    try {
      await axiosInstance.post("/auth/reset-password", { email, password, otp });
      toast.success("Password reset successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      return false;
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));