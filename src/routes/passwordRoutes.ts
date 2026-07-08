import { Router } from "express";
import { passwordController } from "../controllers/passwordController.ts";
import { apiVerifyJWT } from "../middleware/auth.ts";

const router = Router();

// Secure all password analysis endpoints with JWT authorization
router.post("/analyze", apiVerifyJWT, passwordController.analyzePassword);
router.post("/hashes", apiVerifyJWT, passwordController.generateHashes);
router.post("/verify", apiVerifyJWT, passwordController.verifyHash);
router.get("/history", apiVerifyJWT, passwordController.getHistory);
router.delete("/history", apiVerifyJWT, passwordController.clearHistory);

export default router;
