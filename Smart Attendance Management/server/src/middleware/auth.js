import jwt from "jsonwebtoken";
import { User } from "../models.js";

const unauthorized = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const forbidden = (message) => {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
};

export const protect = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      throw unauthorized("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();

    if (!user || !user.isActive) {
      throw unauthorized("User account is unavailable");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : unauthorized("Invalid or expired token"));
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(unauthorized("Authentication required"));
  }

  if (!roles.includes(req.user.role)) {
    return next(forbidden("You do not have access to this resource"));
  }

  next();
};
