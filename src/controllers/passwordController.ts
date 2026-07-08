import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PasswordAnalysis } from "../models/PasswordAnalyzer.ts";
import { AuthenticatedRequest } from "../middleware/auth.ts";

// Simple Dictionary of Weak/Common Words for password policy check
const DICTIONARY = [
  "password", "123456", "12345678", "qwerty", "admin", "welcome", "letmein", 
  "cybershield", "cyber", "shield", "security", "passphrase", "hacker", "password123"
];

// Helper to check keyboard pattern (horizontal lines)
function checkKeyboardPatterns(password: string): boolean {
  const patterns = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];
  const lower = password.toLowerCase();
  for (const pat of patterns) {
    for (let i = 0; i <= pat.length - 4; i++) {
      const sub = pat.substring(i, i + 4);
      if (lower.includes(sub)) return true;
    }
  }
  return false;
}

// Helper to check sequential strings
function checkSequentials(password: string): boolean {
  const lower = password.toLowerCase();
  for (let i = 0; i < lower.length - 3; i++) {
    const code1 = lower.charCodeAt(i);
    const code2 = lower.charCodeAt(i + 1);
    const code3 = lower.charCodeAt(i + 2);
    const code4 = lower.charCodeAt(i + 3);
    
    // Ascending sequence (e.g. abcd or 1234)
    if (code2 === code1 + 1 && code3 === code2 + 1 && code4 === code3 + 1) {
      // Limit sequence detection to alphanumeric
      if (
        ((code1 >= 97 && code1 <= 122) || (code1 >= 48 && code1 <= 57)) &&
        ((code4 >= 97 && code4 <= 122) || (code4 >= 48 && code4 <= 57))
      ) {
        return true;
      }
    }
    // Descending sequence (e.g. dcba or 4321)
    if (code2 === code1 - 1 && code3 === code2 - 1 && code4 === code3 - 1) {
      if (
        ((code4 >= 97 && code4 <= 122) || (code4 >= 48 && code4 <= 57)) &&
        ((code1 >= 97 && code1 <= 122) || (code1 >= 48 && code1 <= 57))
      ) {
        return true;
      }
    }
  }
  return false;
}

// Helper to calculate Entropy and Pool size
function calculateEntropy(password: string) {
  let pool = 0;
  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;
  let hasSpecial = false;

  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    if (/[a-z]/.test(char)) hasLower = true;
    else if (/[A-Z]/.test(char)) hasUpper = true;
    else if (/[0-9]/.test(char)) hasDigit = true;
    else hasSpecial = true;
  }

  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasDigit) pool += 10;
  if (hasSpecial) pool += 33; // Standard special characters count

  if (pool === 0) return { entropy: 0, poolSize: 0 };

  const entropy = password.length * Math.log2(pool);
  return { entropy: parseFloat(entropy.toFixed(2)), poolSize: pool };
}

// Convert seconds to a human-readable estimated crack time
function getCrackTime(entropy: number): string {
  if (entropy <= 0) return "Instant";
  
  // Combos = 2^entropy
  // A modern multi-GPU cracking rig can test ~10^10 hashes per second (10 GH/s) offline
  const hashesPerSec = 1e10; 
  const totalCombos = Math.pow(2, entropy);
  const avgSecondsToCrack = (0.5 * totalCombos) / hashesPerSec;

  if (avgSecondsToCrack < 0.001) return "Instant (under 1 millisecond)";
  if (avgSecondsToCrack < 1) return "Under 1 second";
  if (avgSecondsToCrack < 60) return `${Math.round(avgSecondsToCrack)} seconds`;
  if (avgSecondsToCrack < 3600) return `${Math.round(avgSecondsToCrack / 60)} minutes`;
  if (avgSecondsToCrack < 86400) return `${Math.round(avgSecondsToCrack / 3600)} hours`;
  if (avgSecondsToCrack < 2.592e6) return `${Math.round(avgSecondsToCrack / 86400)} days`;
  if (avgSecondsToCrack < 3.1536e7) return `${Math.round(avgSecondsToCrack / 2.592e6)} months`;
  
  const years = avgSecondsToCrack / 3.1536e7;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)} millennia`;
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`;
  return "Trillions of years (Centuries of the Universe)";
}

// Argon2 custom high-fidelity hashing simulation
// Authentic format: $argon2id$v=19$m=65536,t=3,p=4$salt$hash
function simulateArgon2(password: string, saltHex?: string): { hash: string, salt: string } {
  const salt = saltHex || crypto.randomBytes(16).toString("hex");
  // Calculate a cryptographic HMAC-SHA256 representation as our simulated Argon2 output key
  const hmac = crypto.createHmac("sha256", salt).update(password).digest("base64").replace(/=/g, "");
  const base64Salt = Buffer.from(salt).toString("base64").replace(/=/g, "");
  return {
    hash: `$argon2id$v=19$m=65536,t=3,p=4$${base64Salt}$${hmac}`,
    salt: salt
  };
}

export const passwordController = {
  // 1. Live evaluation endpoint
  analyzePassword: async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { password } = req.body;
      const username = req.user?.username || "unknown_operator";

      if (typeof password !== "string") {
        return res.status(400).json({ success: false, error: "Invalid password input." });
      }

      if (password.length === 0) {
        return res.status(400).json({ success: false, error: "Password cannot be empty." });
      }

      // Check Rules
      const checks = {
        minLength: password.length >= 8,
        maxLength: password.length <= 128,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasDigit: /[0-9]/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password),
        noRepeats: !/(.)\1\1/.test(password), // Fails if 3 repeated characters e.g. aaa
        noSequentials: !checkSequentials(password),
        noKeyboardPatterns: !checkKeyboardPatterns(password),
        noDictionaryMatch: !DICTIONARY.some(word => password.toLowerCase().includes(word))
      };

      const totalChecks = Object.keys(checks).length;
      const checksPassed = Object.values(checks).filter(Boolean).length;
      const checksFailed = totalChecks - checksPassed;

      // Calculate Entropy
      const { entropy, poolSize } = calculateEntropy(password);
      const crackTimeLabel = getCrackTime(entropy);

      // Determine strength out of 100 based on length, pool size, entropy, and rules
      let complexityScore = Math.min(100, Math.round((entropy / 80) * 60 + (checksPassed / totalChecks) * 40));
      
      // Penalize heavily for short length
      if (password.length < 6) complexityScore = Math.max(5, complexityScore - 60);
      else if (password.length < 8) complexityScore = Math.max(10, complexityScore - 40);

      let strengthLabel = "Very Weak";
      if (complexityScore >= 80 && checks.minLength) strengthLabel = "Very Strong";
      else if (complexityScore >= 60 && checks.minLength) strengthLabel = "Strong";
      else if (complexityScore >= 40) strengthLabel = "Medium";
      else if (complexityScore >= 20) strengthLabel = "Weak";

      // HIBP k-Anonymity breach check
      let breachCount = 0;
      let apiResponseStatus = "LOCAL_RECON_ONLY";

      try {
        const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
        const prefix = sha1.substring(0, 5);
        const suffix = sha1.substring(5);

        // Fetching HIBP range API (Secure k-anonymity protocol, never sends password)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for robustness

        const hibpRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (hibpRes.ok) {
          const text = await hibpRes.text();
          const lines = text.split("\n");
          const matchLine = lines.find(line => line.startsWith(suffix));
          if (matchLine) {
            breachCount = parseInt(matchLine.split(":")[1].trim(), 10);
          }
          apiResponseStatus = "HIBP_DATABASE_SECURE_SYNC";
        } else {
          apiResponseStatus = "HIBP_SERVICE_OFFLINE";
        }
      } catch (err) {
        console.warn("HIBP check skipped or timed out:", err);
        apiResponseStatus = "HIBP_SERVICE_OFFLINE_FALLBACK";
      }

      // MongoDB secure logging
      let dbSaved = false;
      try {
        await PasswordAnalysis.create({
          username,
          passwordLength: password.length,
          entropy,
          strengthLabel,
          complexityScore,
          breachCount,
          checksPassed,
          checksFailed,
          lookupStatus: "success"
        });
        dbSaved = true;
      } catch (dbErr: any) {
        console.error("Failed to save password analysis audit:", dbErr.message);
      }

      return res.json({
        success: true,
        data: {
          passwordLength: password.length,
          entropy,
          poolSize,
          strengthLabel,
          complexityScore,
          crackTime: crackTimeLabel,
          breachCount,
          checks,
          checksPassed,
          checksFailed,
          apiResponseStatus,
          timestamp: new Date().toISOString(),
          dbSaved
        }
      });
    } catch (error: any) {
      console.error("Password analysis error:", error.message);
      return res.status(500).json({ success: false, error: "Internal cryptographic analysis error." });
    }
  },

  // 2. Generate Educational Hashes (SHA-256, SHA-512, bcrypt, Simulated Argon2)
  generateHashes: async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { password } = req.body;
      if (!password || typeof password !== "string") {
        return res.status(400).json({ success: false, error: "Invalid password sequence provided." });
      }

      // SHA-256
      const sha256 = crypto.createHash("sha256").update(password).digest("hex");
      
      // SHA-512
      const sha512 = crypto.createHash("sha512").update(password).digest("hex");

      // Bcrypt
      const bcryptSalt = bcrypt.genSaltSync(10);
      const bcryptHash = bcrypt.hashSync(password, bcryptSalt);

      // Argon2 (Simulated with HMAC base64 matching actual Argon2 format structure)
      const argon2Sim = simulateArgon2(password);

      return res.json({
        success: true,
        hashes: [
          {
            algorithm: "SHA-256",
            hash: sha256,
            salt: "N/A (Deterministic)",
            description: "A cryptographic 256-bit one-way hash. Extremely fast, but highly vulnerable to precomputed rainbow-table and GPU-accelerated dictionary attacks."
          },
          {
            algorithm: "SHA-512",
            hash: sha512,
            salt: "N/A (Deterministic)",
            description: "A standard 512-bit hash. Highly secure for general document or ledger signatures, but still easily brute-forced if used for passwords without salting/stretching."
          },
          {
            algorithm: "bcrypt",
            hash: bcryptHash,
            salt: bcryptSalt,
            description: "A salted, key-stretching hash algorithm incorporating a configurable work factor cost (cost: 10). Adaptive and specifically designed to defend against GPU brute force."
          },
          {
            algorithm: "Argon2id",
            hash: argon2Sim.hash,
            salt: argon2Sim.salt,
            description: "Argon2 is the winner of the Password Hashing Competition. Incorporates parameterized memory requirements (m=65536) and time loops (t=3) to block specialized ASIC cracking rigs."
          }
        ]
      });
    } catch (err: any) {
      console.error("Hash generation error:", err.message);
      return res.status(500).json({ success: false, error: "Failed to generate educational hash comparison chart." });
    }
  },

  // 3. Verification of Hashed Values
  verifyHash: async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { password, hash } = req.body;
      if (!password || !hash) {
        return res.status(400).json({ success: false, error: "Both password and target hash are required for comparison." });
      }

      const trimmedHash = hash.trim();
      let detectedAlgorithm = "Unknown";
      let match = false;

      if (trimmedHash.startsWith("$argon2")) {
        detectedAlgorithm = "Argon2id";
        // To verify our simulated Argon2, we extract the salt and run our simulated Argon2
        const parts = trimmedHash.split("$");
        if (parts.length >= 5) {
          const base64Salt = parts[4];
          const saltHex = Buffer.from(base64Salt, "base64").toString("utf-8");
          const recomputed = simulateArgon2(password, saltHex);
          match = (recomputed.hash === trimmedHash);
        }
      } else if (trimmedHash.startsWith("$2a$") || trimmedHash.startsWith("$2b$") || trimmedHash.startsWith("$2y$")) {
        detectedAlgorithm = "bcrypt";
        try {
          match = bcrypt.compareSync(password, trimmedHash);
        } catch {
          match = false;
        }
      } else if (trimmedHash.length === 128 && /^[0-9a-fA-F]+$/.test(trimmedHash)) {
        detectedAlgorithm = "SHA-512";
        const computed = crypto.createHash("sha512").update(password).digest("hex");
        match = (computed.toLowerCase() === trimmedHash.toLowerCase());
      } else if (trimmedHash.length === 64 && /^[0-9a-fA-F]+$/.test(trimmedHash)) {
        detectedAlgorithm = "SHA-256";
        const computed = crypto.createHash("sha256").update(password).digest("hex");
        match = (computed.toLowerCase() === trimmedHash.toLowerCase());
      }

      return res.json({
        success: true,
        match,
        algorithm: detectedAlgorithm
      });
    } catch (err: any) {
      console.error("Verification endpoint error:", err.message);
      return res.status(500).json({ success: false, error: "Cryptographic hash match failed." });
    }
  },

  // 4. Retrieve logged audit checks
  getHistory: async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const username = req.user?.username || "unknown_operator";
      const history = await PasswordAnalysis.find({ username })
        .sort({ timestamp: -1 })
        .limit(15);
      return res.json({ success: true, history });
    } catch (err: any) {
      console.error("Error fetching password analysis history:", err.message);
      return res.status(500).json({ success: false, error: "Could not fetch audit history logs." });
    }
  },

  // 5. Purge saved checks
  clearHistory: async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const username = req.user?.username || "unknown_operator";
      await PasswordAnalysis.deleteMany({ username });
      return res.json({ success: true, message: "History purges succeeded." });
    } catch (err: any) {
      console.error("Error clearing history:", err.message);
      return res.status(500).json({ success: false, error: "Failed to scrub audit history database." });
    }
  }
};
