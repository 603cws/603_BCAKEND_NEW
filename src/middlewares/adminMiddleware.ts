import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model";
import jwt from "jsonwebtoken"
import cookie from "cookie";

export const admin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    console.log("token value for det", token);
    if (!token) {
      return res.status(401).json({
        msg: "No token provided, unauthorized12345"
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.SECRETKEY as string);

    if (!decoded || (decoded as any).role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    return res.status(500).json({ msg: "Internal server errorwdkpawkaa" });
  }
};
