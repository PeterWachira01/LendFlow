import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        error: "Invalid authorization format.",
      });
    }

    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        error: "Authentication token missing.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "JWT_SECRET is not configured.",
      );

      return res.status(500).json({
        error: "Server authentication configuration error.",
      });
    }

    const decoded = jwt.verify(
      token,
      secret,
    ) as JwtPayload;

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      error: "Invalid or expired authentication token.",
    });
  }
};

export default authMiddleware;