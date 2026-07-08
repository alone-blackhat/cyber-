import express from "express";
import path from "path";
import cors from "cors";
import Parser from "rss-parser";
import { createServer as createViteServer } from "vite";
import { webcrypto } from "crypto";
import { createServer as createHttpServer } from "http";
import cookieParser from "cookie-parser";
import { connectDB } from "./src/config/db.ts";
import { pageVerifyJWT } from "./src/middleware/auth.ts";
import authRoutes from "./src/routes/authRoutes.ts";
import phoneRoutes from "./src/routes/phoneRoutes.ts";
import passwordRoutes from "./src/routes/passwordRoutes.ts";
import passport from "passport";
import { configurePassport } from "./src/config/passport.ts";

const app = express();
const PORT = 3000;
const httpServer = createHttpServer(app);

// Initialize RSS Parser
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"]
    ]
  }
});

// Premium High-Contrast Cybersecurity Placeholders
const PLACEHOLDERS: Record<string, string> = {
  "Zero-Day": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80",
  "Data Breach": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
  "Ransomware": "https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&w=600&q=80",
  "Phishing": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
  "Malware": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
  "Government": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
  "Vulnerability": "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=600&q=80",
  "general": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80"
};

// In-memory cache variables
let newsCache: any[] = [];
let lastFetchTime = 0;
let isFetching = false;

// HTML tag stripper & decodes entities to prevent raw HTML render issues
function stripHtml(html: string): string {
  if (!html) return "";
  let text = html.replace(/<[^>]*>?/gm, " ");
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
  return text.trim();
}

// Extracted image resolver
function extractImage(item: any): string | null {
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  const content = item.content || item.contentEncoded || item.description || "";
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match && match[1] && match[1].startsWith("http")) {
    return match[1];
  }
  return null;
}

// Extracted video element resolver
function extractVideo(item: any): string | null {
  const content = item.content || item.contentEncoded || item.description || "";
  const ytEmbedMatch = content.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (ytEmbedMatch && ytEmbedMatch[1]) {
    const src = ytEmbedMatch[1];
    if (src.includes("youtube.com") || src.includes("youtu.be")) {
      return src;
    }
  }
  const ytLinkMatch = content.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/i);
  if (ytLinkMatch && ytLinkMatch[1]) {
    return `https://www.youtube.com/embed/${ytLinkMatch[1]}`;
  }
  return null;
}

// Cyber threat category router
function detectCategory(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes("zero-day") || text.includes("0-day")) return "Zero-Day";
  if (text.includes("breach") || text.includes("leak") || text.includes("exposed") || text.includes("credential") || text.includes("compromise")) return "Data Breach";
  if (text.includes("ransomware") || text.includes("extortion") || text.includes("ransom")) return "Ransomware";
  if (text.includes("phishing") || text.includes("spoof") || text.includes("smishing") || text.includes("social engineering")) return "Phishing";
  if (text.includes("cve-") || text.includes("vulnerability") || text.includes("flaw") || text.includes("bug") || text.includes("exploit") || text.includes("patch") || text.includes("security update")) return "Vulnerability";
  if (text.includes("cisa") || text.includes("government") || text.includes("fbi") || text.includes("cyber command") || text.includes("state-sponsored") || text.includes("espionage")) return "Government";
  if (text.includes("malware") || text.includes("trojan") || text.includes("backdoor") || text.includes("spyware") || text.includes("adware") || text.includes("botnet") || text.includes("infostealer")) return "Malware";
  return "Malware";
}

// Cyber threat severity classifier
function detectRiskLevel(title: string, desc: string): string {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes("critical") || text.includes("rce") || text.includes("zero-day") || text.includes("0-day") || text.includes("kernel")) {
    return "CRITICAL";
  }
  if (text.includes("high") || text.includes("breach") || text.includes("ransomware") || text.includes("hijack")) {
    return "HIGH";
  }
  if (text.includes("medium") || text.includes("patch") || text.includes("cve") || text.includes("vulnerability")) {
    return "MEDIUM";
  }
  return "LOW";
}

// Global cyber feed multi-request orchestrator
async function refreshCyberNewsCache() {
  if (isFetching) return;
  isFetching = true;
  console.log("Background Cyber News Cache update initiated...");

  const feeds = [
    { url: "https://feeds.feedburner.com/TheHackersNews", source: "The Hacker News" },
    { url: "https://www.bleepingcomputer.com/feed/", source: "BleepingComputer" },
    { url: "https://www.cisa.gov/cybersecurity-advisories/all.xml", source: "CISA" },
    { url: "https://www.securityweek.com/feed/", source: "SecurityWeek" },
    { url: "https://krebsonsecurity.com/feed/", source: "Krebs on Security" }
  ];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return { source: feed.source, items: parsed.items || [] };
      } catch (err) {
        console.error(`Failed to load ${feed.source} (${feed.url}):`, err);
        throw err;
      }
    })
  );

  const allArticles: any[] = [];

  results.forEach((res) => {
    if (res.status === "fulfilled" && res.value) {
      const { source, items } = res.value;
      items.forEach((item: any) => {
        const title = (item.title || "").trim();
        const rawContent = item.content || item.contentEncoded || item.description || "";
        const cleanDesc = stripHtml(rawContent);
        
        // Standard excerpt truncation to prevent bloat
        const snippet = cleanDesc.length > 200 ? cleanDesc.substring(0, 197) + "..." : cleanDesc;
        const category = detectCategory(title, cleanDesc);
        const riskLevel = detectRiskLevel(title, cleanDesc);
        const videoUrl = extractVideo(item);
        const rawImg = extractImage(item);
        const image = rawImg || PLACEHOLDERS[category] || PLACEHOLDERS.general;

        let author = item.creator || item.author || source;
        if (author.trim().toLowerCase().includes("noreply@blogger.com")) {
          author = source;
        }

        // Format publication date/time
        let publishedDate = item.pubDate || item.isoDate || new Date().toISOString();
        let pubDateTimestamp = Date.now();
        try {
          const d = new Date(publishedDate);
          if (!isNaN(d.getTime())) {
            pubDateTimestamp = d.getTime();
            publishedDate = d.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            });
          }
        } catch (_) {}

        allArticles.push({
          title,
          description: snippet,
          image,
          source,
          category,
          publishedDate,
          pubDate: publishedDate, // Compatibility with previous model
          pubDateTimestamp,
          articleUrl: item.link || item.guid || "",
          link: item.link || item.guid || "", // Compatibility with previous model
          author,
          videoUrl,
          riskLevel
        });
      });
    }
  });

  if (allArticles.length > 0) {
    // Unique articles deduplication by normalized title
    const seen = new Set<string>();
    const uniqueArticles: any[] = [];

    allArticles.forEach((art) => {
      const key = art.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueArticles.push(art);
      }
    });

    // Newest first sorting
    uniqueArticles.sort((a, b) => b.pubDateTimestamp - a.pubDateTimestamp);

    newsCache = uniqueArticles;
    lastFetchTime = Date.now();
    console.log(`Cyber News Cache refreshed successfully: ${newsCache.length} unique items saved.`);
  } else {
    console.warn("Cyber News refresh fetched 0 new articles. Keeping cached values.");
  }

  isFetching = false;
}

// Initial cache populate on boot
refreshCyberNewsCache();

// 30-minute automatic interval updates
setInterval(refreshCyberNewsCache, 30 * 60 * 1000);

// Setup CORS with explicit origin filters
const allowedOrigins = [
  "http://localhost:3000",
  "https://ais-dev-7jri2moqsse6vuolwd64ui-857913741347.asia-east1.run.app",
  "https://ais-pre-7jri2moqsse6vuolwd64ui-857913741347.asia-east1.run.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".run.app") || origin.startsWith("http://localhost:")) {
      callback(null, true);
    } else {
      callback(new Error("Request blocked by CyberShield CORS Policy"));
    }
  }
}));

// Body parser for JSON payloads (encrypted chat messages and attachments)
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

// Initialize Passport.js middleware
app.use(passport.initialize());
configurePassport();

// Authentication API Router
app.use("/api/auth", authRoutes);

// Phone Intelligence API Router
app.use("/api/phone", phoneRoutes);

// Password Security Analyzer API Router
app.use("/api/password", passwordRoutes);

// --- SECURE CHAT END-TO-END CRYPTOGRAPHIC BACKEND SYSTEM ---

const { subtle } = webcrypto;

// Global Support RSA Keypair used to decrypt incoming AES-GCM conversation keys
let supportPublicKeyJwk: any = null;
let supportPrivateKey: webcrypto.CryptoKey | null = null;

async function initSupportKeys() {
  try {
    const keyPair = await subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["decrypt", "encrypt"]
    );
    supportPrivateKey = keyPair.privateKey;
    supportPublicKeyJwk = await subtle.exportKey("jwk", keyPair.publicKey);
    console.log("CyberShield Secure Support E2E RSA Key Pair initialized successfully.");
  } catch (error) {
    console.error("Failed to generate Secure Support RSA keys:", error);
  }
}

// In-Memory Database for Secure Chat
interface ChatMessage {
  id: string;
  sender: "user" | "support";
  encryptedContent: string; // AES-GCM ciphertext base64
  iv: string; // Initialization vector base64
  attachmentName?: string;
  attachmentType?: string;
  timestamp: number;
  status: "sent" | "delivered" | "read";
  replyToId?: string;
}

interface SupportTicket {
  id: string; // CS-XXXX
  subject: string;
  category: string;
  severity: "low" | "medium" | "high";
  status: "open" | "closed";
  createdAt: number;
  unreadCount: number;
  publicKeyUser: any; // User's public RSA key (JWK)
  encryptedKeySupport: string; // Symmetric AES-GCM key encrypted with Support's RSA key (base64)
}

const ticketsDb: Record<string, SupportTicket> = {};
const messagesDb: Record<string, ChatMessage[]> = {};

// Crypotgraphic utility helpers
function base64ToBuffer(base64: string): ArrayBuffer {
  return Buffer.from(base64, "base64");
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Helper to decrypt symmetric AES key using Support Private Key
async function decryptAesKey(encryptedAesKeyBase64: string): Promise<webcrypto.CryptoKey | null> {
  if (!supportPrivateKey) return null;
  try {
    const encryptedBuffer = base64ToBuffer(encryptedAesKeyBase64);
    const decryptedRawKey = await subtle.decrypt(
      { name: "RSA-OAEP" },
      supportPrivateKey,
      encryptedBuffer
    );
    return await subtle.importKey(
      "raw",
      decryptedRawKey,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Failed to decrypt conversation AES key server-side:", error);
    return null;
  }
}

// Helper to decrypt user message JSON payload using standard AES-GCM key
async function decryptUserPayload(encryptedContentBase64: string, ivBase64: string, aesKey: webcrypto.CryptoKey): Promise<string | null> {
  try {
    const ciphertextBuffer = base64ToBuffer(encryptedContentBase64);
    const ivBuffer = base64ToBuffer(ivBase64);
    const decryptedBuffer = await subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      aesKey,
      ciphertextBuffer
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("Failed to decrypt client payload server-side:", error);
    return null;
  }
}

// Helper to encrypt a support response JSON payload using the conversation's AES-GCM key
async function encryptSupportPayload(payloadString: string, aesKey: webcrypto.CryptoKey): Promise<{ encryptedContent: string; iv: string } | null> {
  try {
    const iv = webcrypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const payloadBuffer = encoder.encode(payloadString);
    const ciphertextBuffer = await subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      payloadBuffer
    );
    return {
      encryptedContent: bufferToBase64(ciphertextBuffer),
      iv: bufferToBase64(iv)
    };
  } catch (error) {
    console.error("Failed to encrypt analyst payload server-side:", error);
    return null;
  }
}

// Simulated automated analyst answers based on category and decrypted query
function getSimulationResponse(category: string, userText: string): string {
  const query = userText.toLowerCase();
  
  if (category.includes("Phishing")) {
    return "[SecOps Incident Bot] Threat Signature ID: PHISH-SOC-889. We have scanned the submitted link or description. Heuristic analysis suggests a high likelihood of a credential harvester. Our domain mitigation unit has initiated an automated takedown request. Great catch, operator!";
  }
  if (category.includes("Fraud")) {
    return "[Analyst Alice] Financial fraud signatures detected. Warning: Never authorize external bank transfers or screen-sharing tools. Please call our Cybercrime Hotline (1930) immediately to lock down your accounts. We have reported these transaction hashes to national payment switches.";
  }
  if (category.includes("QR")) {
    return "[SecOps Incident Bot] QR Payload Analysis: Redirection target matches a malicious dynamic DNS host. It has been flagged as unsafe in SafeBrowsing registries. This QR signature is now actively blocked on all nodes.";
  }
  if (category.includes("Email")) {
    return "[Analyst Bob] Suspicious Email headers evaluated. High risk of SPF/DKIM spoofing. The sender envelope is forging a trusted financial system. Do not click links, reply, or run attachments. Please purge the email immediately.";
  }
  if (category.includes("Hacking")) {
    return "[Analyst Alice] CRITICAL COMPROMISE: Active session tokens or credentials may have been compromised. Action Plan: 1. Revoke all active login sessions. 2. Implement hardware-backed Multi-Factor Authentication. 3. Update all passwords. We have placed an audit watch on your profile ledger.";
  }
  
  // General response
  if (query.includes("help") || query.includes("how") || query.includes("what")) {
    return "[Analyst Support] I've received your query in our E2E encrypted tunnel. Your system integrity is our highest priority. To assist you accurately, please describe any active warning popups, unknown network flows, or file encryption signs you are seeing.";
  }
  
  return "[Analyst Bob] Security ledger updated with your report. Our automated sandboxes are parsing any attached logs or files in safe containers. We will monitor this E2E encrypted workspace and advise as more threat intelligence materializes.";
}

// Secure Chat endpoints

// 1. Get Support's Public RSA Key (JWK)
app.get("/api/chat/support-key", (req, res) => {
  if (!supportPublicKeyJwk) {
    return res.status(503).json({ error: "Cryptographic service booting... Please retry." });
  }
  res.json({ publicKeySupport: supportPublicKeyJwk });
});

// 2. Get list of user's active/closed tickets
app.get("/api/chat/tickets", (req, res) => {
  res.json(Object.values(ticketsDb).sort((a, b) => b.createdAt - a.createdAt));
});

// 3. Create a new support ticket / encrypted conversation channel
app.post("/api/chat/tickets", async (req, res) => {
  try {
    const { subject, category, severity, publicKeyUser, encryptedKeySupport, initialEncryptedMessage, initialIv } = req.body;
    
    if (!subject || !category || !severity || !publicKeyUser || !encryptedKeySupport) {
      return res.status(400).json({ error: "Incomplete ticket cryptographic parameters." });
    }

    const ticketId = `CS-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newTicket: SupportTicket = {
      id: ticketId,
      subject,
      category,
      severity,
      status: "open",
      createdAt: Date.now(),
      unreadCount: 0,
      publicKeyUser,
      encryptedKeySupport
    };

    ticketsDb[ticketId] = newTicket;
    messagesDb[ticketId] = [];

    // If an initial encrypted message exists, save it as the first message
    if (initialEncryptedMessage && initialIv) {
      const initialMsg: ChatMessage = {
        id: `msg-${Date.now()}-0`,
        sender: "user",
        encryptedContent: initialEncryptedMessage,
        iv: initialIv,
        timestamp: Date.now(),
        status: "read"
      };
      messagesDb[ticketId].push(initialMsg);

      // Trigger asynchronous automated secure responder
      setTimeout(async () => {
        try {
          const aesKey = await decryptAesKey(encryptedKeySupport);
          if (aesKey) {
            const userDecryptedText = await decryptUserPayload(initialEncryptedMessage, initialIv, aesKey);
            if (userDecryptedText) {
              const replyText = getSimulationResponse(category, userDecryptedText);
              const encryptedReply = await encryptSupportPayload(replyText, aesKey);
              if (encryptedReply) {
                const supportMsg: ChatMessage = {
                  id: `msg-${Date.now()}-1`,
                  sender: "support",
                  encryptedContent: encryptedReply.encryptedContent,
                  iv: encryptedReply.iv,
                  timestamp: Date.now() + 1000,
                  status: "delivered"
                };
                messagesDb[ticketId].push(supportMsg);
                ticketsDb[ticketId].unreadCount += 1;
              }
            }
          }
        } catch (err) {
          console.error("Async ticket automated response creation error:", err);
        }
      }, 2000);
    }

    res.status(201).json(newTicket);
  } catch (error) {
    console.error("POST /api/chat/tickets error:", error);
    res.status(500).json({ error: "Cryptographic ticket generation failed." });
  }
});

// 4. Get messages in a conversation
app.get("/api/chat/messages/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  const messages = messagesDb[ticketId] || [];
  
  // Mark support messages as read once fetched by client
  messages.forEach(msg => {
    if (msg.sender === "support") {
      msg.status = "read";
    }
  });
  if (ticketsDb[ticketId]) {
    ticketsDb[ticketId].unreadCount = 0;
  }
  
  res.json(messages);
});

// 5. Post a new message to a conversation
app.post("/api/chat/messages/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { encryptedContent, iv, replyToId, attachmentName, attachmentType } = req.body;
    
    if (!ticketsDb[ticketId]) {
      return res.status(404).json({ error: "Secure conversation channel not found." });
    }

    if (!encryptedContent || !iv) {
      return res.status(400).json({ error: "Message missing encrypted parameters." });
    }

    const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userMsg: ChatMessage = {
      id: messageId,
      sender: "user",
      encryptedContent,
      iv,
      attachmentName,
      attachmentType,
      timestamp: Date.now(),
      status: "sent"
    };

    if (replyToId) {
      userMsg.replyToId = replyToId;
    }

    messagesDb[ticketId].push(userMsg);

    // Update message status simulated timing
    setTimeout(() => {
      userMsg.status = "delivered";
    }, 400);

    setTimeout(() => {
      userMsg.status = "read";
    }, 1200);

    // Secure response simulation
    setTimeout(async () => {
      try {
        const ticket = ticketsDb[ticketId];
        if (ticket && ticket.status === "open") {
          const aesKey = await decryptAesKey(ticket.encryptedKeySupport);
          if (aesKey) {
            const userDecryptedText = await decryptUserPayload(encryptedContent, iv, aesKey);
            if (userDecryptedText) {
              const replyText = getSimulationResponse(ticket.category, userDecryptedText);
              const encryptedReply = await encryptSupportPayload(replyText, aesKey);
              if (encryptedReply) {
                const supportMsg: ChatMessage = {
                  id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sender: "support",
                  encryptedContent: encryptedReply.encryptedContent,
                  iv: encryptedReply.iv,
                  timestamp: Date.now(),
                  status: "delivered"
                };
                messagesDb[ticketId].push(supportMsg);
                ticket.unreadCount += 1;
              }
            }
          }
        }
      } catch (err) {
        console.error("Async secure response simulation error:", err);
      }
    }, 2200);

    res.status(201).json(userMsg);
  } catch (error) {
    console.error("POST /api/chat/messages error:", error);
    res.status(500).json({ error: "Cryptographic post processing failed." });
  }
});

// 6. Delete user's own message
app.delete("/api/chat/messages/:ticketId/:messageId", (req, res) => {
  const { ticketId, messageId } = req.params;
  if (!messagesDb[ticketId]) {
    return res.status(404).json({ error: "Channel not found." });
  }
  
  const initialLen = messagesDb[ticketId].length;
  // User can only delete own message
  messagesDb[ticketId] = messagesDb[ticketId].filter(msg => !(msg.id === messageId && msg.sender === "user"));
  
  if (messagesDb[ticketId].length === initialLen) {
    return res.status(404).json({ error: "Message not found or unauthorized to delete." });
  }
  
  res.json({ success: true });
});

// 7. Close support ticket
app.post("/api/chat/tickets/:ticketId/close", (req, res) => {
  const { ticketId } = req.params;
  if (!ticketsDb[ticketId]) {
    return res.status(404).json({ error: "Ticket not found." });
  }
  
  ticketsDb[ticketId].status = "closed";
  
  // Post system automated closing message
  setTimeout(async () => {
    try {
      const ticket = ticketsDb[ticketId];
      const aesKey = await decryptAesKey(ticket.encryptedKeySupport);
      if (aesKey) {
        const encryptedReply = await encryptSupportPayload("[System Operator] This E2E channel has been officially closed. All keys for this conversation session should be discarded. Thank you for maintaining operational awareness.", aesKey);
        if (encryptedReply) {
          const supportMsg: ChatMessage = {
            id: `msg-${Date.now()}-close`,
            sender: "support",
            encryptedContent: encryptedReply.encryptedContent,
            iv: encryptedReply.iv,
            timestamp: Date.now(),
            status: "delivered"
          };
          messagesDb[ticketId].push(supportMsg);
        }
      }
    } catch (err) {
      console.error("Async close system response error:", err);
    }
  }, 500);

  res.json(ticketsDb[ticketId]);
});


// API endpoints
app.get("/api/cyber-news", async (req, res) => {
  try {
    // If cache is cold (empty) and not fetching, fetch synchronously
    if (newsCache.length === 0 && !isFetching) {
      await refreshCyberNewsCache();
    }
    res.setHeader("Cache-Control", "public, max-age=1800"); // 30-minute cache header
    res.json(newsCache);
  } catch (error) {
    console.error("Endpoint GET /api/cyber-news Error:", error);
    res.status(500).json({ error: "Cyber News is temporarily unavailable." });
  }
});



// App server listening and middleware assembly
async function bootstrapServer() {
  // Connect to User Database (MongoDB or Secure local persistent storage)
  await connectDB();

  // Initialize E2E Support Cryptographic keys
  await initSupportKeys();

  // Secure Protection of Dashboard Routes (Redirect & Auth validation)
  app.get("/dashboard", (req, res) => {
    res.redirect("/dashboard.html");
  });

  app.get("/dashboard.html", pageVerifyJWT, (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      next(); // Let Vite compile and serve in development
    } else {
      res.sendFile(path.join(process.cwd(), "dist/dashboard.html"));
    }
  });

  // Steganography custom toolkit routing
  app.get("/cyber-tools/steganography", (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      req.url = "/steganography.html";
      next();
    } else {
      res.sendFile(path.join(process.cwd(), "dist/steganography.html"));
    }
  });

  // Vite Integration in Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production Assets Serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("/steganography.html", (req, res) => {
      res.sendFile(path.join(distPath, "steganography.html"));
    });

    // Note: /dashboard.html is already handled with protection above!
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`CyberShield Security Operations Center Node running on http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer();
