// middleware/adminMiddleware.js
import User from "../models/user.model.js";

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }
    
    next();
  } catch (error) {
    console.log("Error in admin middleware: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default adminMiddleware;