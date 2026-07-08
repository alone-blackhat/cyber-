/**
 * CyberShield Awareness - Cyber News API Client
 * Connects directly to the custom Express backend server.
 * Handles client-side 30-minute caching and XSS safety escaping.
 */

export const NEWS_CONFIG = {
  feedUrl: "/api/cyber-news",
  placeholders: {
    "Zero-Day": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=600&q=80",
    "Data Breach": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80",
    "Ransomware": "https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&w=600&q=80",
    "Phishing": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    "Malware": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
    "Government": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
    "Vulnerability": "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=600&q=80",
    "general": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80"
  }
};

/**
 * Escapes characters to prevent cross-site scripting (XSS)
 */
export function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Main Async Fetcher calling backend Node.js RSS feed endpoint
 */
export async function fetchCyberNews() {
  const CACHE_KEY = "cyber_news_cache_collection";
  const CACHE_TIME_KEY = "cyber_news_cache_time";
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

  // 1. Try serving from client-side localStorage cache first to keep UI instant
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedData && cachedTime) {
      const age = Date.now() - parseInt(cachedTime, 10);
      if (age < CACHE_DURATION) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[CyberShield Client] Loaded news cache (${Math.round(age/1000/60)}m old)`);
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn("[CyberShield Client] Failed reading localStorage cache:", e);
  }

  // 2. Fetch fresh pre-compiled RSS data from custom Node.js Express server
  console.log("[CyberShield Client] Fetching fresh threat intelligence feed from Express server...");
  const response = await fetch("/api/cyber-news");
  if (!response.ok) {
    throw new Error(`Cyber News Server Error: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid response payload from Cyber News endpoint");
  }

  // 3. Save to client-side localStorage for subsequent instant loads
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch (e) {
    console.warn("[CyberShield Client] Failed saving to localStorage cache:", e);
  }

  return data;
}
