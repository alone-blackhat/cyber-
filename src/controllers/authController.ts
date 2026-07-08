import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { UserService } from "../models/User.ts";

const JWT_SECRET = process.env.JWT_SECRET || "cybershield_super_secure_vault_passphrase_2026";

export const authController = {
  // --- SECURE REGISTER ---
  async register(req: Request, res: Response): Promise<any> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failure",
        status: 400,
        error: errors.array().map(e => e.msg).join(", ")
      });
    }

    const { username, email, password } = req.body;

    try {
      // 1. Check duplicate email
      const existingEmail = await UserService.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Registration denied",
          status: 409,
          error: "An account with this email address is already registered."
        });
      }

      // 2. Check duplicate username
      const existingUsername = await UserService.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "Registration denied",
          status: 409,
          error: "An account with this username is already registered."
        });
      }

      // 3. Hash Password securely (never plain text)
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // 4. Create User
      const user = await UserService.createUser({
        username,
        email,
        password_hash,
        role: "user"
      });

      return res.status(201).json({
        success: true,
        message: "Operational identity created successfully.",
        status: 201,
        data: {
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    } catch (err: any) {
      console.error("Registration endpoint crash:", err);
      return res.status(500).json({
        success: false,
        message: "Server database write failure",
        status: 500,
        error: err.message || "Internal server error"
      });
    }
  },

  // --- SECURE LOGIN ---
  async login(req: Request, res: Response): Promise<any> {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing credentials",
        status: 400,
        error: "Please enter your Identity ID and password."
      });
    }

    try {
      // 1. Find user by username or email
      const user = await UserService.findByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "ACCESS DENIED",
          status: 401,
          error: "Incorrect username or password."
        });
      }

      // 2. Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "ACCESS DENIED",
          status: 401,
          error: "Incorrect username or password."
        });
      }

      // 3. Generate JWT Token
      const token = jwt.sign(
        { username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // 4. Update last login timestamp
      await UserService.updateLastLogin(user.email);

      // 5. Store JWT in a secure HttpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: "none", // Required for cross-origin iframe
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      return res.json({
        success: true,
        message: "Authorization confirmed.",
        status: 200,
        token,
        user: {
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (err: any) {
      console.error("Login endpoint crash:", err);
      return res.status(500).json({
        success: false,
        message: "Server signature verification failed",
        status: 500,
        error: err.message || "Internal server error"
      });
    }
  },

  // --- SECURE STATUS/ME CHECK ---
  async me(req: any, res: Response): Promise<any> {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        status: 401,
        error: "Session token is invalid or expired."
      });
    }

    return res.json({
      success: true,
      message: "Session is active",
      status: 200,
      user: {
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  },

  // --- SECURE LOGOUT ---
  async logout(req: Request, res: Response): Promise<any> {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax"
    });

    return res.json({
      success: true,
      message: "Console session destroyed successfully. Connection severed.",
      status: 200
    });
  }
};
