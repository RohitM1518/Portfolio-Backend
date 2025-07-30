import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import APIError from '../utils/apiError.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new APIError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const admin = await Admin.findById(decodedToken?._id).select("-password");

    if (!admin) {
      throw new APIError(401, "Invalid Access Token");
    }

    req.admin = admin;
    next();
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid access token");
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.admin) {
    throw new APIError(401, "Authentication required");
  }
  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      throw new APIError(401, "Authentication required");
    }
    
    if (!roles.includes(req.admin.role)) {
      throw new APIError(403, "Insufficient permissions");
    }
    
    next();
  };
}; 