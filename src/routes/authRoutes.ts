import { Router } from "express";
import { body } from "express-validator";
import { authController } from "../controllers/authController.ts";
import { apiVerifyJWT } from "../middleware/auth.ts";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "cybershield_super_secure_vault_passphrase_2026";

function handleOAuthSuccess(req: any, res: any, user: any) {
  const token = jwt.sign(
    { username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authorization Confirmed</title>
        <style>
          body {
            background-color: #0d1117;
            color: #58a6ff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .loader {
            border: 3px solid #1f2937;
            border-top: 3px solid #58a6ff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div>
          <div class="loader"></div>
          <h2>AUTHORIZATION CONFIRMED</h2>
          <p>Transferring cryptographic key to parent terminal...</p>
        </div>
        <script>
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({ type: "OAUTH_AUTH_SUCCESS" }, "*");
              window.close();
            } else {
              window.location.href = "/dashboard.html";
            }
          }, 1000);
        </script>
      </body>
    </html>
  `);
}

// --- 1. USER REGISTRATION WITH STRONG VALIDATION ---
router.post(
  "/register",
  [
    body("username")
      .trim()
      .notEmpty().withMessage("Username field cannot be empty.")
      .isLength({ min: 3, max: 20 }).withMessage("Username must be between 3 and 20 characters long.")
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage("Username can only contain alphanumeric characters, underscores, and dashes."),
    
    body("email")
      .trim()
      .notEmpty().withMessage("Email field cannot be empty.")
      .isEmail().withMessage("Please enter a valid RFC-compliant email address (e.g. name@cybershield.com).")
      .normalizeEmail(),
    
    body("password")
      .notEmpty().withMessage("Security keyphrase cannot be empty.")
      .isLength({ min: 8 }).withMessage("Security keyphrase must be at least 8 characters in length.")
      .matches(/[A-Z]/).withMessage("Security keyphrase must contain at least one uppercase letter (A-Z).")
      .matches(/[a-z]/).withMessage("Security keyphrase must contain at least one lowercase letter (a-z).")
      .matches(/[0-9]/).withMessage("Security keyphrase must contain at least one numerical digit (0-9).")
      .matches(/[@$!%*?&]/).withMessage("Security keyphrase must contain at least one special character (e.g., @$!%*?&).")
  ],
  authController.register
);

// --- 2. USER LOGIN ---
router.post("/login", authController.login);

// --- 3. RETRIEVE CURRENT USER SESSION ---
router.get("/me", apiVerifyJWT, authController.me);

// --- 4. SECURE LOGOUT ---
router.post("/logout", authController.logout);

// --- 5. GOOGLE OAUTH URL GENERATOR ---
router.get("/google/url", (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    return res.status(500).json({ error: "Google OAuth is not configured on this server node." });
  }
  const host = req.get("X-Forwarded-Host") || req.get("host") || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
  const dynamicAppUrl = `${protocol}://${host}`;
  const appUrl = process.env.APP_URL || dynamicAppUrl;
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "profile email",
    access_type: "offline",
    prompt: "consent"
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.json({ url });
});

// --- 6. GOOGLE OAUTH CALLBACK ---
router.get("/google/callback", (req, res, next) => {
  const host = req.get("X-Forwarded-Host") || req.get("host") || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
  const dynamicAppUrl = `${protocol}://${host}`;
  const appUrl = process.env.APP_URL || dynamicAppUrl;
  const dynamicCallbackURL = `${appUrl}/api/auth/google/callback`;

  passport.authenticate("google", { session: false, callbackURL: dynamicCallbackURL } as any, (err: any, user: any, info: any) => {
    if (err || !user) {
      console.error("Google Auth failure:", err, info);
      return res.redirect("/?error=" + encodeURIComponent(err?.message || "Google authentication failed"));
    }
    handleOAuthSuccess(req, res, user);
  })(req, res, next);
});

// --- 7. GITHUB OAUTH URL GENERATOR ---
router.get("/github/url", (req, res) => {
  const githubClientId = process.env.GITHUB_CLIENT_ID;
  if (!githubClientId) {
    return res.status(500).json({ error: "GitHub OAuth is not configured on this server node." });
  }
  const host = req.get("X-Forwarded-Host") || req.get("host") || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
  const dynamicAppUrl = `${protocol}://${host}`;
  const appUrl = process.env.APP_URL || dynamicAppUrl;
  const redirectUri = `${appUrl}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: githubClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user:email"
  });
  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return res.json({ url });
});

// --- 8. GITHUB OAUTH CALLBACK ---
router.get("/github/callback", (req, res, next) => {
  const host = req.get("X-Forwarded-Host") || req.get("host") || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
  const dynamicAppUrl = `${protocol}://${host}`;
  const appUrl = process.env.APP_URL || dynamicAppUrl;
  const dynamicCallbackURL = `${appUrl}/api/auth/github/callback`;

  passport.authenticate("github", { session: false, callbackURL: dynamicCallbackURL } as any, (err: any, user: any, info: any) => {
    if (err || !user) {
      console.error("GitHub Auth failure:", err, info);
      return res.redirect("/?error=" + encodeURIComponent(err?.message || "GitHub authentication failed"));
    }
    handleOAuthSuccess(req, res, user);
  })(req, res, next);
});

export default router;
