
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();



// Middleware to verify the JWT token
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify token
    //@ts-ignore
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(decoded);
    // Attach the decoded user data to the request object (optional)
    //@ts-ignore
    req.user =  decoded.id 
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(400).json({ message: "Invalid token." });
  }
};
