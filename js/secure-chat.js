// ==========================================
// CYBERSHIELD SECURE SUPPORT CHAT CLIENT-SIDE ENGINE
// ==========================================

// --- UTILITIES FOR ARRAYBUFFER <-> BASE64 ---
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// --- STANDARD WEB CRYPTO END-TO-END RECIPIENT UTILITIES ---
const SecureCrypto = {
  // Generate 2048-bit RSA-OAEP Key Pair for user's identity
  async generateKeyPair() {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );
  },

  // Export key to JWK
  async exportKeyJwk(key) {
    return await window.crypto.subtle.exportKey("jwk", key);
  },

  // Import key from JWK
  async importKeyJwk(jwk, usages) {
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      usages
    );
  },

  // Generate AES-GCM 256-bit symmetric session key
  async generateAesKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  },

  // Export AES key
  async exportAesKeyRaw(key) {
    return await window.crypto.subtle.exportKey("raw", key);
  },

  // Import AES key from raw ArrayBuffer
  async importAesKeyRaw(rawBuffer) {
    return await window.crypto.subtle.importKey(
      "raw",
      rawBuffer,
      {
        name: "AES-GCM"
      },
      true,
      ["encrypt", "decrypt"]
    );
  },

  // Encrypt AES key using Recipient's RSA public key
  async encryptAesKey(aesKey, rsaPublicKey) {
    const rawAes = await this.exportAesKeyRaw(aesKey);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      rsaPublicKey,
      rawAes
    );
    return arrayBufferToBase64(encrypted);
  },

  // Decrypt AES key using User's RSA private key
  async decryptAesKey(encryptedAesKeyBase64, rsaPrivateKey) {
    const encryptedBuffer = base64ToArrayBuffer(encryptedAesKeyBase64);
    const decryptedRaw = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      rsaPrivateKey,
      encryptedBuffer
    );
    return await this.importAesKeyRaw(decryptedRaw);
  },

  // Encrypt JSON payload using AES-GCM session key
  async encryptPayload(text, aesKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encoded = encoder.encode(text);
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      aesKey,
      encoded
    );
    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv)
    };
  },

  // Decrypt JSON payload using AES-GCM session key
  async decryptPayload(ciphertextBase64, ivBase64, aesKey) {
    try {
      const ciphertext = base64ToArrayBuffer(ciphertextBase64);
      const iv = base64ToArrayBuffer(ivBase64);
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        aesKey,
        ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error("AES-GCM Cryptographic Decryption Failed:", e);
      return JSON.stringify({ text: "[Decryption Failed: Private Key mismatch or package corruption]" });
    }
  }
};

// --- CLIENT STATE CONTROLLER ---
let userKeyPair = null;
let userPublicKeyJwk = null;
let supportPublicKey = null;

let conversations = [];
let activeTicketId = null;
let currentMessages = [];
let keyCache = {}; // Cache of decrypted AES-GCM session keys per ticketId

let searchFilter = "";
let showCiphertextMode = false;
let replyToMessageId = null;
let selectedAttachment = null;
let isTyping = false;
let pollingInterval = null;

// --- INITIALIZE CYBERSHIELD SECURE CHAT CLIENT ---
async function initSecureChat() {
  console.log("Secure Chat Engine booting up...");
  try {
    // 1. Check/Generate User RSA Keypair
    const storedPrivateJwk = localStorage.getItem("cs_e2e_private_jwk");
    const storedPublicJwk = localStorage.getItem("cs_e2e_public_jwk");

    if (storedPrivateJwk && storedPublicJwk) {
      console.log("Loading existing E2E Identity RSA Keypair...");
      const privateKey = await SecureCrypto.importKeyJwk(JSON.parse(storedPrivateJwk), ["decrypt"]);
      const publicKey = await SecureCrypto.importKeyJwk(JSON.parse(storedPublicJwk), ["encrypt"]);
      userKeyPair = { privateKey, publicKey };
      userPublicKeyJwk = JSON.parse(storedPublicJwk);
    } else {
      console.log("Generating fresh Secure Identity RSA Keypair...");
      const keyPair = await SecureCrypto.generateKeyPair();
      const privateJwk = await SecureCrypto.exportKeyJwk(keyPair.privateKey);
      const publicJwk = await SecureCrypto.exportKeyJwk(keyPair.publicKey);
      
      localStorage.setItem("cs_e2e_private_jwk", JSON.stringify(privateJwk));
      localStorage.setItem("cs_e2e_public_jwk", JSON.stringify(publicJwk));
      
      userKeyPair = keyPair;
      userPublicKeyJwk = publicJwk;
    }

    // 2. Fetch Support's Public RSA Key from Server
    const response = await fetch("/api/chat/support-key");
    if (!response.ok) throw new Error("Could not retrieve Support cryptographic key.");
    const data = await response.json();
    supportPublicKey = await SecureCrypto.importKeyJwk(data.publicKeySupport, ["encrypt"]);

    // 3. Load conversation list
    await fetchConversations();

    // 4. Mount event listener for global viewport changes (polling loop start/stop)
    const chatObserver = new MutationObserver(() => {
      const chatView = document.getElementById("support-chat-view");
      if (chatView && chatView.style.display !== "none") {
        if (!pollingInterval) {
          pollingInterval = setInterval(async () => {
            if (document.hidden) return;
            await fetchConversations(false);
            if (activeTicketId) {
              await fetchMessages(activeTicketId, false);
            }
          }, 3500);
        }
      } else {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
      }
    });
    chatObserver.observe(document.body, { attributes: true, subtree: true });

  } catch (error) {
    console.error("Encryption handshake failed:", error);
    if (window.showToast) {
      window.showToast("HANDSHAKE FAILED", "Could not negotiate cryptographic secure tunnel. Retrying...");
    }
  }
}

// --- VIEW CONTROLLER SWAP ---
window.switchSupportMode = function(mode) {
  const resourcesView = document.getElementById("support-resources-view");
  const chatView = document.getElementById("support-chat-view");
  const tabResources = document.getElementById("support-mode-resources");
  const tabChat = document.getElementById("support-mode-chat");

  if (!resourcesView || !chatView) return;

  if (mode === "chat") {
    resourcesView.style.display = "none";
    chatView.style.display = "flex";
    tabResources.classList.remove("active-tab");
    tabResources.style.background = "rgba(255,255,255,0.05)";
    tabResources.style.color = "#ffffff";
    tabResources.style.border = "1px solid rgba(255,255,255,0.1)";

    tabChat.classList.add("active-tab");
    tabChat.style.background = "var(--neon-cyan)";
    tabChat.style.color = "#000a14";
    tabChat.style.border = "none";

    // Trigger refresh
    fetchConversations(true);
  } else {
    chatView.style.display = "none";
    resourcesView.style.display = "grid"; // tool-layout is display: grid / flex depending on layout
    tabChat.classList.remove("active-tab");
    tabChat.style.background = "rgba(255,255,255,0.05)";
    tabChat.style.color = "#ffffff";
    tabChat.style.border = "1px solid rgba(255,255,255,0.1)";

    tabResources.classList.add("active-tab");
    tabResources.style.background = "var(--neon-cyan)";
    tabResources.style.color = "#000a14";
    tabResources.style.border = "none";
  }
};

// --- DATA ACCESS LAYERS ---
async function fetchConversations(forceRender = true) {
  try {
    const response = await fetch("/api/chat/tickets");
    if (!response.ok) return;
    conversations = await response.json();
    
    // Sync unread count to global tab indicator
    let totalUnread = 0;
    conversations.forEach(c => totalUnread += c.unreadCount);
    
    const badge = document.getElementById("chat-global-badge");
    if (badge) {
      if (totalUnread > 0) {
        badge.innerText = totalUnread;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }

    const qaBadge = document.getElementById("quick-actions-support-badge");
    if (qaBadge) {
      if (totalUnread > 0) {
        qaBadge.innerText = totalUnread;
        qaBadge.style.display = "inline-flex";
      } else {
        qaBadge.style.display = "none";
      }
    }

    const popupBadge = document.getElementById("popup-support-badge");
    if (popupBadge) {
      if (totalUnread > 0) {
        popupBadge.innerText = totalUnread;
        popupBadge.style.display = "inline-flex";
      } else {
        popupBadge.style.display = "none";
      }
    }

    if (forceRender) {
      renderConversations();
    }
  } catch (error) {
    console.error("Could not fetch support channels:", error);
  }
}

async function fetchMessages(ticketId, forceRender = true) {
  try {
    const response = await fetch(`/api/chat/messages/${ticketId}`);
    if (!response.ok) return;
    const encryptedMsgs = await response.json();
    
    // Decrypt messages with AES symmetric key for this conversation
    const aesKey = await getTicketAesKey(ticketId);
    
    const decryptedMessages = await Promise.all(
      encryptedMsgs.map(async (msg) => {
        let text = "[Encrypted Content]";
        let attachment = null;

        if (aesKey) {
          const decryptedPayloadString = await SecureCrypto.decryptPayload(msg.encryptedContent, msg.iv, aesKey);
          try {
            const payload = JSON.parse(decryptedPayloadString);
            text = payload.text || "";
            attachment = payload.attachment || null;
          } catch (e) {
            text = decryptedPayloadString; // Fallback if plain text
          }
        }

        return {
          ...msg,
          text,
          attachment
        };
      })
    );

    // Detect new replies and trigger desktop-like dashboard notification
    if (currentMessages.length > 0 && decryptedMessages.length > currentMessages.length) {
      const lastOldMsg = currentMessages[currentMessages.length - 1];
      const newMsgs = decryptedMessages.slice(currentMessages.length);
      newMsgs.forEach(m => {
        if (m.sender === "support" && m.timestamp > lastOldMsg.timestamp) {
          if (window.showToast) {
            window.showToast("NEW ENCRYPTED REPLY", `Secure message arrived on channel: ${ticketId}`);
          }
          playNotificationSound();
        }
      });
    }

    currentMessages = decryptedMessages;
    
    if (forceRender) {
      renderMessages();
    }
  } catch (error) {
    console.error("Could not fetch messages:", error);
  }
}

// Get or Decrypt AES Key from Cache
async function getTicketAesKey(ticketId) {
  if (keyCache[ticketId]) return keyCache[ticketId];

  const ticket = conversations.find(c => c.id === ticketId);
  if (!ticket) return null;

  try {
    // Save in local storage coordinates for durability or local sandbox decryption
    const localSymmetricKeyRaw = localStorage.getItem(`cs_symmetric_raw_${ticketId}`);
    if (localSymmetricKeyRaw) {
      const rawBuffer = base64ToArrayBuffer(localSymmetricKeyRaw);
      const aesKey = await SecureCrypto.importAesKeyRaw(rawBuffer);
      keyCache[ticketId] = aesKey;
      return aesKey;
    }

    // Decrypt from the encrypted key returned by the server
    const rsaPrivateKey = userKeyPair.privateKey;
    // For safety, let's look up our locally stored ticket key mappings
    const localEncryptedKey = localStorage.getItem(`cs_encrypted_key_user_${ticketId}`);
    
    let decryptedAesKey = null;
    if (localEncryptedKey) {
      decryptedAesKey = await SecureCrypto.decryptAesKey(localEncryptedKey, rsaPrivateKey);
    } else {
      // If server provides it encrypted with user's public key (we can support user local backup decryption)
      // Since ticketsDb stores publicKeyUser, we saved User's AES Key in localStorage upon creation.
      return null;
    }

    keyCache[ticketId] = decryptedAesKey;
    return decryptedAesKey;
  } catch (error) {
    console.error("Cryptographic decryption of channel AES key failed:", error);
    return null;
  }
}

// --- CHAT RENDERING LIFECYCLE ---
function renderConversations() {
  const container = document.getElementById("conversations-list-container");
  if (!container) return;

  const filtered = conversations.filter(c => 
    c.subject.toLowerCase().includes(searchFilter.toLowerCase()) || 
    c.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.75rem; text-align: center; padding: 2rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.5rem; opacity: 0.5;"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
        No encrypted channels found.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isActive = c.id === activeTicketId;
    const severityColor = c.severity === "high" ? "#ff4081" : c.severity === "medium" ? "#ffb300" : "var(--neon-cyan)";
    
    return `
      <div class="conv-item ${isActive ? 'active' : ''}" 
           style="padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid ${isActive ? 'rgba(0, 242, 255, 0.25)' : 'rgba(255,255,255,0.03)'}; background: ${isActive ? 'rgba(0, 242, 255, 0.05)' : 'rgba(255,255,255,0.02)'}; cursor: pointer; transition: all 0.2s; position: relative;" 
           onclick="setActiveChannel('${c.id}')">
        
        ${c.unreadCount > 0 ? `
          <div style="position: absolute; right: 0.75rem; top: 0.75rem; background: #ff4081; color: white; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700;">
            ${c.unreadCount}
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
          <span style="font-family: var(--font-mono); font-size: 0.65rem; color: ${severityColor}; border: 1px solid ${severityColor}40; padding: 0.05rem 0.3rem; border-radius: 4px; font-weight: 600; text-transform: uppercase;">
            ${c.id} - ${c.severity}
          </span>
          <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">
            ${c.status.toUpperCase()}
          </span>
        </div>
        
        <h4 style="font-size: 0.8rem; font-weight: 600; color: #ffffff; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; font-family: var(--font-sans);">
          ${c.subject}
        </h4>
        
        <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${c.category}
        </p>
      </div>
    `;
  }).join('');
}

function renderMessages() {
  const container = document.getElementById("chat-messages-container");
  const header = document.getElementById("chat-window-header-details");
  if (!container || !header) return;

  const ticket = conversations.find(c => c.id === activeTicketId);
  if (!ticket) return;

  // Header update
  const severityColor = ticket.severity === "high" ? "#ff4081" : ticket.severity === "medium" ? "#ffb300" : "var(--neon-cyan)";
  header.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
      <div style="display: flex; flex-direction: column; gap: 0.15rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <h3 style="font-size: 0.95rem; font-weight: 700; color: #ffffff; margin: 0; font-family: var(--font-sans);">${ticket.subject}</h3>
          <span style="font-family: var(--font-mono); font-size: 0.6rem; color: ${severityColor}; border: 1px solid ${severityColor}30; padding: 0.05rem 0.25rem; border-radius: 4px;">
            ${ticket.id}
          </span>
          <span style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #10b981; font-size: 0.6rem; font-family: var(--font-mono); padding: 0.05rem 0.25rem; border-radius: 4px; display: flex; align-items: center; gap: 0.25rem;">
            <span class="status-dot" style="width: 5px; height: 5px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
            ${ticket.status.toUpperCase()}
          </span>
        </div>
        <span style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">
          Tunnel Category: ${ticket.category}
        </span>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        ${ticket.status === "open" ? `
          <button onclick="closeActiveTicket()" class="tool-btn" style="background: rgba(255, 64, 129, 0.1); border: 1px solid rgba(255, 64, 129, 0.2); color: #ff4081; font-size: 0.7rem; padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Close Channel
          </button>
        ` : `
          <span style="font-size: 0.7rem; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.05); padding: 0.4rem 0.75rem; border-radius: 6px; font-family: var(--font-mono);">
            SESSION CONCLUDED
          </span>
        `}
      </div>
    </div>
  `;

  if (currentMessages.length === 0) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-size: 0.75rem; gap: 0.5rem; text-align: center; padding: 2rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Establish communication. Sending key hashes...
      </div>
    `;
    return;
  }

  container.innerHTML = currentMessages.map(m => {
    const isMe = m.sender === "user";
    const statusText = m.status === "read" ? "Read" : m.status === "delivered" ? "Delivered" : "Sent";
    const statusIcon = m.status === "read" ? "✓✓" : m.status === "delivered" ? "✓" : "•";
    const statusColor = m.status === "read" ? "var(--neon-cyan)" : "var(--text-muted)";
    const dateStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let replySnippet = "";
    if (m.replyToId) {
      const parentMsg = currentMessages.find(pm => pm.id === m.replyToId);
      if (parentMsg) {
        replySnippet = `
          <div style="background: rgba(255,255,255,0.03); border-left: 2px solid var(--neon-cyan); padding: 0.3rem 0.5rem; margin-bottom: 0.4rem; border-radius: 4px; font-size: 0.68rem; color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            <strong style="color: var(--neon-cyan);">${parentMsg.sender === "user" ? "You" : "SecOps Desk"}:</strong>
            ${parentMsg.text || "Encrypted payload"}
          </div>
        `;
      }
    }

    let attachmentMarkup = "";
    if (m.attachment) {
      const isImg = m.attachment.type.startsWith("image/");
      const isPdf = m.attachment.type === "application/pdf";
      
      if (isImg) {
        attachmentMarkup = `
          <div style="margin-top: 0.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); max-width: 200px;">
            <img src="${m.attachment.data}" referrerPolicy="no-referrer" style="width: 100%; height: auto; display: block;" />
            <div style="background: rgba(0,0,0,0.4); padding: 0.3rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.6rem; font-family: var(--font-mono);">
              <span style="color: #ffffff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;">${m.attachment.name}</span>
              <a href="${m.attachment.data}" download="${m.attachment.name}" style="color: var(--neon-cyan); text-decoration: none; font-weight: 700;">DOWNLOAD</a>
            </div>
          </div>
        `;
      } else {
        attachmentMarkup = `
          <div style="margin-top: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.5rem 0.75rem; display: flex; align-items: center; gap: 0.5rem; max-width: 240px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
              <span style="font-size: 0.7rem; color: #ffffff; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.attachment.name}</span>
              <span style="font-size: 0.6rem; color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase;">${isPdf ? "PDF DOCUMENT" : "SECURE FILE"}</span>
            </div>
            <a href="${m.attachment.data}" download="${m.attachment.name}" style="background: rgba(0, 242, 255, 0.1); border: 1px solid rgba(0, 242, 255, 0.2); border-radius: 4px; padding: 0.25rem 0.4rem; color: var(--neon-cyan); text-decoration: none; font-size: 0.6rem; font-weight: bold; font-family: var(--font-mono); flex-shrink: 0;">GET</a>
          </div>
        `;
      }
    }

    return `
      <div class="msg-row" style="display: flex; justify-content: ${isMe ? 'flex-end' : 'flex-start'}; margin-bottom: 1rem; position: relative;" id="msg-item-${m.id}">
        <div class="msg-bubble" style="max-width: 70%; display: flex; flex-direction: column;">
          
          <!-- Timestamp & Status -->
          <div style="display: flex; justify-content: ${isMe ? 'flex-end' : 'flex-start'}; align-items: center; gap: 0.4rem; font-size: 0.6rem; color: var(--text-muted); font-family: var(--font-mono); margin-bottom: 0.2rem; padding: 0 0.25rem;">
            <span>${isMe ? 'OPERATOR NODE' : 'SECOPS DESK'}</span>
            <span>•</span>
            <span>${dateStr}</span>
          </div>

          <!-- The Glass Bubble itself -->
          <div class="glass-section message-body-bubble" style="padding: 0.75rem 1rem; border-radius: 12px; border-top-${isMe ? 'right' : 'left'}-radius: 2px; border: 1px solid ${isMe ? 'rgba(0, 242, 255, 0.15)' : 'rgba(255, 64, 129, 0.1)'}; background: ${isMe ? 'rgba(0, 242, 255, 0.04)' : 'rgba(255, 64, 129, 0.02)'}; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            
            ${replySnippet}

            <!-- Ciphertext Mode Toggle View -->
            ${showCiphertextMode ? `
              <div style="font-family: var(--font-mono); font-size: 0.6rem; color: var(--text-muted); line-height: 1.4; word-break: break-all;">
                <div style="color: #ff4081; font-weight: bold; margin-bottom: 0.3rem; display: flex; align-items: center; gap: 0.3rem;">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: #ff4081; display: inline-block; animation: pulse 1.5s infinite;"></span>
                  SECURE CYPHIERTEXT [AES-256-GCM]
                </div>
                <div>IV: <span style="color: #ffffff;">${m.iv}</span></div>
                <div style="margin-top: 0.2rem;">PAYLOAD: <span style="color: #ffffff;">${m.encryptedContent.substring(0, 80)}...</span></div>
                <div style="margin-top: 0.2rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.2rem; font-size: 0.55rem; color: var(--text-secondary);">
                  Server status: CIPHERTEXT ENCRYPTED ON CLIENT DEVICE. SERVER CANNOT DECRYPT.
                </div>
              </div>
            ` : `
              <p style="font-size: 0.8rem; line-height: 1.5; color: #ffffff; margin: 0; white-space: pre-wrap; font-family: var(--font-sans); word-break: break-word;">${m.text}</p>
              ${attachmentMarkup}
            `}
          </div>

          <!-- Micro controls beneath Bubble -->
          <div style="display: flex; justify-content: ${isMe ? 'flex-end' : 'flex-start'}; align-items: center; gap: 0.75rem; font-size: 0.65rem; font-family: var(--font-mono); color: var(--text-muted); margin-top: 0.25rem; padding: 0 0.25rem;">
            ${isMe ? `
              <span style="color: ${statusColor}; font-weight: bold;" title="${statusText}">${statusIcon} ${statusText}</span>
              <span>•</span>
            ` : ''}
            <button onclick="replyToMessage('${m.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; font-family: inherit; font-size: inherit;" onmouseover="this.style.color='var(--neon-cyan)'" onmouseout="this.style.color='var(--text-muted)'">Reply</button>
            <span>•</span>
            <button onclick="copyMessageText('${m.id}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; font-family: inherit; font-size: inherit;" onmouseover="this.style.color='var(--neon-cyan)'" onmouseout="this.style.color='var(--text-muted)'">Copy</button>
            
            ${isMe ? `
              <span>•</span>
              <button onclick="deleteOwnMessage('${m.id}')" style="background: none; border: none; color: #ff4081; cursor: pointer; padding: 0; font-family: inherit; font-size: inherit; font-weight: 500;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">Delete</button>
            ` : ''}
          </div>

        </div>
      </div>
    `;
  }).join('');

  // Auto Scroll
  container.scrollTop = container.scrollHeight;
}

// --- INTERACTIVE ACTIONS ---
window.setActiveChannel = async function(ticketId) {
  activeTicketId = ticketId;
  const inputContainer = document.getElementById("chat-input-toolbar-wrapper");
  if (inputContainer) {
    const ticket = conversations.find(c => c.id === ticketId);
    if (ticket && ticket.status === "closed") {
      inputContainer.style.display = "none";
    } else {
      inputContainer.style.display = "flex";
    }
  }

  // Clear reply ref
  cancelReply();
  
  // Render immediately
  renderConversations();
  await fetchMessages(ticketId, true);
};

window.toggleCiphertextMode = function() {
  showCiphertextMode = !showCiphertextMode;
  const toggleBtn = document.getElementById("ciphertext-toggle-button");
  if (toggleBtn) {
    if (showCiphertextMode) {
      toggleBtn.innerText = "🔒 Ciphertext Mode: ACTIVE";
      toggleBtn.style.color = "#ff4081";
      toggleBtn.style.border = "1px solid rgba(255, 64, 129, 0.3)";
      toggleBtn.style.background = "rgba(255, 64, 129, 0.05)";
    } else {
      toggleBtn.innerText = "👁️ Decrypted View: ACTIVE";
      toggleBtn.style.color = "var(--neon-cyan)";
      toggleBtn.style.border = "1px solid rgba(0, 242, 255, 0.3)";
      toggleBtn.style.background = "rgba(0, 242, 255, 0.05)";
    }
  }
  renderMessages();
};

window.replyToMessage = function(messageId) {
  replyToMessageId = messageId;
  const msg = currentMessages.find(m => m.id === messageId);
  const refBox = document.getElementById("reply-reference-preview-box");
  const refText = document.getElementById("reply-reference-text");
  
  if (msg && refBox && refText) {
    refText.innerText = msg.text.length > 60 ? msg.text.substring(0, 57) + "..." : msg.text;
    refBox.style.display = "flex";
  }
};

window.cancelReply = function() {
  replyToMessageId = null;
  const refBox = document.getElementById("reply-reference-preview-box");
  if (refBox) {
    refBox.style.display = "none";
  }
};

window.copyMessageText = function(messageId) {
  const msg = currentMessages.find(m => m.id === messageId);
  if (msg) {
    navigator.clipboard.writeText(msg.text);
    if (window.showToast) {
      window.showToast("COPIED", "Message contents copied securely to clipboard.");
    }
  }
};

window.deleteOwnMessage = async function(messageId) {
  if (!activeTicketId) return;
  if (!confirm("Are you sure you want to delete your message? This will purge it completely from the server storage.")) return;
  
  try {
    const response = await fetch(`/api/chat/messages/${activeTicketId}/${messageId}`, {
      method: "DELETE"
    });
    if (response.ok) {
      if (window.showToast) {
        window.showToast("PURGED", "Message deleted successfully.");
      }
      await fetchMessages(activeTicketId, true);
    }
  } catch (error) {
    console.error("Purging message failed:", error);
  }
};

window.closeActiveTicket = async function() {
  if (!activeTicketId) return;
  if (!confirm("Are you sure you want to close this secure channel? The communication session will be completed, and support analysts will read-only lock the conversation.")) return;

  try {
    const response = await fetch(`/api/chat/tickets/${activeTicketId}/close`, {
      method: "POST"
    });
    if (response.ok) {
      if (window.showToast) {
        window.showToast("CHANNEL CLOSED", "E2E secure session completed.");
      }
      await fetchConversations();
      await setActiveChannel(activeTicketId);
    }
  } catch (error) {
    console.error("Failed to conclude support session:", error);
  }
};

// --- SAFE ATTACHMENTS FILE HANDLING ---
window.triggerAttachmentUpload = function() {
  const fileInput = document.getElementById("chat-hidden-file-input");
  if (fileInput) fileInput.click();
};

window.handleFileSelection = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Safe file type verification
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/json"
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    alert("Security Alert: Only images (JPEG, PNG, GIF, WEBP), text files, JSON configs, and PDF documents are allowed in secure support tunnels.");
    event.target.value = "";
    return;
  }

  // Safe size verification (Limit to 4MB base64 for fast encryption in sandbox)
  if (file.size > 4 * 1024 * 1024) {
    alert("File Limit: Maximum file upload size is 4MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    selectedAttachment = {
      name: file.name,
      type: file.type,
      data: e.target.result // Base64 encoding URL
    };
    
    // Render attachment badge preview
    const previewBox = document.getElementById("attachment-preview-badge");
    const previewName = document.getElementById("attachment-preview-filename");
    if (previewBox && previewName) {
      previewName.innerText = `${file.name} (${Math.round(file.size / 1024)} KB)`;
      previewBox.style.display = "flex";
    }
  };
  reader.readAsDataURL(file);
};

window.removeAttachment = function() {
  selectedAttachment = null;
  const fileInput = document.getElementById("chat-hidden-file-input");
  if (fileInput) fileInput.value = "";

  const previewBox = document.getElementById("attachment-preview-badge");
  if (previewBox) {
    previewBox.style.display = "none";
  }
};

// --- EMOJI TRIGGER CONTROLS ---
window.toggleEmojiPopover = function() {
  const popover = document.getElementById("chat-emoji-popover-container");
  if (popover) {
    popover.style.display = popover.style.display === "none" ? "grid" : "none";
  }
};

window.insertEmoji = function(emoji) {
  const input = document.getElementById("chat-message-input-text");
  if (input) {
    input.value += emoji;
    input.focus();
  }
  toggleEmojiPopover();
};

// --- NEW ENCRYPTED TICKET MODAL ACTIONS ---
window.openNewTicketPanel = function() {
  const panel = document.getElementById("new-ticket-modal-overlay");
  if (panel) {
    panel.style.display = "flex";
  }
};

window.closeNewTicketPanel = function() {
  const panel = document.getElementById("new-ticket-modal-overlay");
  if (panel) {
    panel.style.display = "none";
  }
};

// Handle New Ticket Create Submission
window.submitCreateTicket = async function(event) {
  event.preventDefault();
  
  const subject = document.getElementById("new-ticket-subject").value.trim();
  const category = document.getElementById("new-ticket-category").value;
  const severity = document.getElementById("new-ticket-severity").value;
  const descText = document.getElementById("new-ticket-description").value.trim();

  if (!subject || !descText) {
    alert("Please complete the subject and description before building the cryptographic E2E tunnel.");
    return;
  }

  try {
    if (window.showToast) {
      window.showToast("CRYPTO COMMENCING", "Generating key mappings and encrypting payload...");
    }

    // 1. Generate 256-bit AES-GCM session key for this ticket
    const aesKey = await SecureCrypto.generateAesKey();
    const aesKeyRaw = await SecureCrypto.exportAesKeyRaw(aesKey);
    const aesKeyRawBase64 = arrayBufferToBase64(aesKeyRaw);

    // 2. Encrypt symmetric AES key using User's Public RSA Key (Stored locally for decryption)
    const encryptedKeyUser = await SecureCrypto.encryptAesKey(aesKey, userKeyPair.publicKey);
    
    // 3. Encrypt symmetric AES key using Support's Public RSA Key
    const encryptedKeySupport = await SecureCrypto.encryptAesKey(aesKey, supportPublicKey);

    // 4. Encrypt the initial description body using our AES key
    const payloadJsonString = JSON.stringify({ text: descText });
    const encryptedPayload = await SecureCrypto.encryptPayload(payloadJsonString, aesKey);

    // 5. Submit to server
    const response = await fetch("/api/chat/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        category,
        severity,
        publicKeyUser: userPublicKeyJwk,
        encryptedKeySupport,
        initialEncryptedMessage: encryptedPayload.ciphertext,
        initialIv: encryptedPayload.iv
      })
    });

    if (!response.ok) throw new Error("Server rejected secure ticket setup package.");
    const newTicket = await response.json();

    // 6. Save symmetric key & user key backup in LocalStorage for persistence across session reloads
    localStorage.setItem(`cs_symmetric_raw_${newTicket.id}`, aesKeyRawBase64);
    localStorage.setItem(`cs_encrypted_key_user_${newTicket.id}`, encryptedKeyUser);

    keyCache[newTicket.id] = aesKey;

    if (window.showToast) {
      window.showToast("TUNNEL ONLINE", `Secure Support Ticket ${newTicket.id} has been cryptographically commissioned.`);
    }

    // Close panel & refresh
    closeNewTicketPanel();
    document.getElementById("new-ticket-creation-form").reset();
    
    await fetchConversations();
    await setActiveChannel(newTicket.id);

  } catch (error) {
    console.error("Cryptographic ticket initialization failed:", error);
    alert("Failure during E2E tunnel assembly. Please verify server integrity.");
  }
};

// --- SEND ENCRYPTED MESSAGE ---
window.sendSecureMessage = async function() {
  if (!activeTicketId) return;

  const textInput = document.getElementById("chat-message-input-text");
  const text = textInput ? textInput.value.trim() : "";

  if (!text && !selectedAttachment) return;

  try {
    const aesKey = await getTicketAesKey(activeTicketId);
    if (!aesKey) throw new Error("Could not decrypt symmetric session key for active conversation.");

    // Build payload structure
    const payload = { text };
    if (selectedAttachment) {
      payload.attachment = selectedAttachment;
    }

    // Encrypt payload JSON with AES-GCM
    const encrypted = await SecureCrypto.encryptPayload(JSON.stringify(payload), aesKey);

    const body = {
      encryptedContent: encrypted.ciphertext,
      iv: encrypted.iv
    };

    if (replyToMessageId) {
      body.replyToId = replyToMessageId;
    }

    if (selectedAttachment) {
      body.attachmentName = selectedAttachment.name;
      body.attachmentType = selectedAttachment.type;
    }

    // Clear input fields immediately to prevent double submits
    if (textInput) textInput.value = "";
    removeAttachment();
    cancelReply();

    const response = await fetch(`/api/chat/messages/${activeTicketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error("Server rejected encrypted message payload.");

    await fetchMessages(activeTicketId, true);

  } catch (error) {
    console.error("Could not encrypt and send message:", error);
    alert("Cryptographic transmission failure. Key pair sync error.");
  }
};

// --- UTILITY SOUNDS AND FILTER CONTROLS ---
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext) {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioContext.currentTime); // High pitch notification chime
      gain.gain.setValueAtTime(0.05, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.35);
      
      osc.start();
      osc.stop(audioContext.currentTime + 0.35);
    }
  } catch (_) {}
}

window.handleMessageSearch = function(event) {
  searchFilter = event.target.value;
  renderConversations();
};

// Init triggers
document.addEventListener("DOMContentLoaded", () => {
  initSecureChat();
});
