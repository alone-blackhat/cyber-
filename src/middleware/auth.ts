import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cybershield_super_secure_vault_passphrase_2026";

export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
    email: string;
    role: string;
  };
}

// Extract JWT from request cookies or Authorization headers
function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// --- MIDDLEWARE FOR SECURE API ROUTING ---
export function apiVerifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): any {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
      status: 401,
      error: "Session token is missing. Please authenticate to access this endpoint."
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err: any) {
    console.warn("API JWT validation rejected:", err.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
      status: 401,
      error: err.name === "TokenExpiredError" ? "Session token expired." : "Session token is invalid."
    });
  }
}

// --- MIDDLEWARE FOR SECURE PAGE ROUTING (HTML REDIRECTS) ---
export function pageVerifyJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): any {
  const token = extractToken(req);

  if (!token) {
    console.log("No token found for page request. Redirecting to login page.");
    return res.redirect("/");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err: any) {
    console.log("Invalid token for page request. Clearing cookie and redirecting to login:", err.message);
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    return res.redirect("/");
  }
}
