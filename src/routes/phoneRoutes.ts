import { Router } from "express";
import { phoneController } from "../controllers/phoneController.ts";
import { apiVerifyJWT } from "../middleware/auth.ts";

const router = Router();

// Protect all phone intelligence endpoints with JWT verification
router.post("/lookup", apiVerifyJWT, phoneController.performLookup);
router.get("/history", apiVerifyJWT, phoneController.getHistory);
router.delete("/history", apiVerifyJWT, phoneController.clearHistory);

export default router;
