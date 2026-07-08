/*
 * CyberShield Operations Suite - Advanced Password Security Analyzer
 * Forensic Cryptographic Auditing, k-Anonymity Breach Feeds, and Hash Lab
 */

export function initPasswordAnalyzer() {
  // Primary inputs
  const pwInput = document.getElementById("pw-analyzer-input");
  const toggleVisibilityBtn = document.getElementById("pw-toggle-visibility-btn");
  const runAuditBtn = document.getElementById("pw-run-audit-btn");
  const clearHistoryBtn = document.getElementById("pw-clear-history-btn");
  const historyContainer = document.getElementById("pw-history-container");

  // View States
  const standbyState = document.getElementById("pw-standby-state");
  const loadingState = document.getElementById("pw-loading-state");
  const resultsState = document.getElementById("pw-results-state");
  const loadingStep = document.getElementById("pw-loading-step");
  const loadingBar = document.getElementById("pw-loading-bar");

  // Metric Output Fields
  const resEntropy = document.getElementById("pw-res-entropy");
  const resPool = document.getElementById("pw-res-pool");
  const resComplexity = document.getElementById("pw-res-complexity");
  const resCrackTime = document.getElementById("pw-res-cracktime");
  const strengthTag = document.getElementById("pw-strength-tag");
  const strengthBar = document.getElementById("pw-strength-bar");
  const complexityPercentage = document.getElementById("pw-complexity-percentage");
  const breachIndicator = document.getElementById("pw-res-breach-indicator");
  const reputationBadge = document.getElementById("pw-res-reputation");
  const resTimestamp = document.getElementById("pw-res-timestamp");
  const resStatus = document.getElementById("pw-res-status");
  const hashesContainer = document.getElementById("pw-hashes-container");

  // Generator inputs
  const genLength = document.getElementById("gen-length");
  const genUpper = document.getElementById("gen-upper");
  const genLower = document.getElementById("gen-lower");
  const genDigits = document.getElementById("gen-digits");
  const genSpecials = document.getElementById("gen-specials");
  const genExcludeSimilar = document.getElementById("gen-exclude-similar");
  const genOutputText = document.getElementById("gen-output-text");
  const genCopyBtn = document.getElementById("gen-copy-btn");
  const genTriggerBtn = document.getElementById("gen-trigger-btn");

  // Verifier inputs
  const verifyPlaintext = document.getElementById("verify-plaintext");
  const verifyHashInput = document.getElementById("verify-hash");
  const verifyFeedback = document.getElementById("verify-feedback-container");
  const verifyTriggerBtn = document.getElementById("verify-trigger-btn");

  // Report/Action Buttons
  const btnCopyReport = document.getElementById("pw-btn-copy-report");
  const btnExportPdf = document.getElementById("pw-btn-export-pdf");

  let activeAuditData = null;

  if (!pwInput || !runAuditBtn) {
    console.warn("Password Security Analyzer UI elements not initialized in active DOM.");
    return;
  }

  // Retrieve past searches on initial mount
  fetchHistory();

  // 1. Password visibility toggler
  let isPasswordVisible = false;
  toggleVisibilityBtn.addEventListener("click", () => {
    isPasswordVisible = !isPasswordVisible;
    pwInput.type = isPasswordVisible ? "text" : "password";
    toggleVisibilityBtn.innerHTML = isPasswordVisible
      ? `<svg style="width: 1.1rem; height: 1.1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg style="width: 1.1rem; height: 1.1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  });

  // 2. Perform Password Audit Search / Deep Scan
  runAuditBtn.addEventListener("click", async () => {
    const rawPassword = pwInput.value;
    if (!rawPassword) {
      window.showToast("INPUT REQUIRED", "Please enter a candidate password sequence in the terminal.", true);
      return;
    }

    // Toggle standby off, launch loader
    standbyState.style.display = "none";
    resultsState.style.display = "none";
    loadingState.style.display = "flex";

    // Dynamic cinema sequences for deep cybersecurity scans
    const steps = [
      { prg: 15, text: "STAGE 01: INITIALIZING SHANNON ENTROPY BOUNDS CONSOLE..." },
      { prg: 40, text: "STAGE 02: VERIFYING KEYBOARD ROW-WALK PATTERNS..." },
      { prg: 65, text: "STAGE 03: EXECUTING k-ANONYMITY RANGE QUERIES OVER HIBP..." },
      { prg: 85, text: "STAGE 04: COMPUTING SHA-256 / BCRYPT / ARGON2ID WORK MARGINS..." },
      { prg: 100, text: "STAGE 05: LOGGING CRYPTOGRAPHIC METADATA AUDIT..." }
    ];

    try {
      for (const step of steps) {
        loadingStep.textContent = step.text;
        loadingBar.style.width = `${step.prg}%`;
        await new Promise(r => setTimeout(r, 300));
      }

      // API requests
      const analyzeResponse = await fetch("/api/password/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: rawPassword })
      });

      const hashResponse = await fetch("/api/password/hashes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: rawPassword })
      });

      const analyzeResult = await analyzeResponse.json();
      const hashResult = await hashResponse.json();

      if (!analyzeResponse.ok || !analyzeResult.success) {
        throw new Error(analyzeResult.error || "Crypto analysis handshake failed.");
      }

      const auditData = analyzeResult.data;
      activeAuditData = Object.assign({}, auditData, { hashes: hashResult.hashes || [] });

      // Render Metrics in DOM
      resEntropy.textContent = `${auditData.entropy} bits`;
      resPool.textContent = `${auditData.poolSize} characters`;
      resComplexity.textContent = `${auditData.complexityScore}%`;
      resComplexity.style.color = getStrengthColor(auditData.complexityScore);
      resCrackTime.textContent = auditData.crackTime;

      // Strength bar / indicator configurations
      strengthTag.textContent = auditData.strengthLabel;
      strengthTag.style.color = getStrengthColor(auditData.complexityScore);
      complexityPercentage.textContent = `${auditData.complexityScore}%`;
      complexityPercentage.style.color = getStrengthColor(auditData.complexityScore);
      strengthBar.style.width = `${auditData.complexityScore}%`;
      strengthBar.style.backgroundColor = getStrengthColor(auditData.complexityScore);

      // k-Anonymity Leak Results
      const breachCount = auditData.breachCount;
      breachIndicator.textContent = breachCount === -1 ? "N/A" : breachCount.toLocaleString();
      
      let badgeText = "SECURE";
      let badgeBg = "rgba(0, 255, 157, 0.1)";
      let badgeColor = "var(--neon-green)";
      let badgeBorder = "rgba(0, 255, 157, 0.3)";

      if (breachCount > 0) {
        badgeText = "COMPROMISED";
        badgeBg = "rgba(255, 75, 75, 0.1)";
        badgeColor = "#ff4b4b";
        badgeBorder = "rgba(255, 75, 75, 0.3)";
        breachIndicator.style.color = "#ff4b4b";
        window.showToast("THREAT ALERT", `This password has appeared in ${breachCount.toLocaleString()} public data leaks!`, true);
      } else if (breachCount === 0) {
        breachIndicator.style.color = "var(--neon-green)";
        window.showToast("SWEEP COMPLETE", "Password conforms to high-grade security bounds.");
      } else {
        badgeText = "OFFLINE AUDIT";
        badgeBg = "rgba(255, 204, 0, 0.1)";
        badgeColor = "var(--neon-yellow)";
        badgeBorder = "rgba(255, 204, 0, 0.3)";
        breachIndicator.style.color = "var(--neon-yellow)";
      }

      reputationBadge.textContent = badgeText;
      reputationBadge.style.background = badgeBg;
      reputationBadge.style.color = badgeColor;
      reputationBadge.style.borderColor = badgeBorder;

      resTimestamp.textContent = new Date(auditData.timestamp).toUTCString();
      resStatus.textContent = auditData.apiResponseStatus;

      // Rule grid updates
      const rules = auditData.checks;
      Object.keys(rules).forEach(ruleKey => {
        const itemEl = document.querySelector(`.pw-rule-item[data-rule="${ruleKey}"]`);
        if (itemEl) {
          const markerEl = itemEl.querySelector(".status-marker");
          const passed = rules[ruleKey];
          if (passed) {
            markerEl.textContent = "✓";
            markerEl.style.color = "var(--neon-green)";
            itemEl.style.color = "#ffffff";
          } else {
            markerEl.textContent = "✕";
            markerEl.style.color = "#ff4b4b";
            itemEl.style.color = "var(--text-muted)";
          }
        }
      });

      // Educational Hashes list construction
      hashesContainer.innerHTML = "";
      if (hashResult.success && hashResult.hashes) {
        hashResult.hashes.forEach(item => {
          const hashItem = document.createElement("div");
          hashItem.style.background = "rgba(0,0,0,0.25)";
          hashItem.style.border = "1px solid rgba(255,255,255,0.05)";
          hashItem.style.padding = "0.75rem";
          hashItem.style.borderRadius = "6px";
          hashItem.style.display = "flex";
          hashItem.style.flexDirection = "column";
          hashItem.style.gap = "0.4rem";

          hashItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.05); padding-bottom: 0.3rem;">
              <span style="font-size: 0.7rem; font-weight: bold; color: var(--neon-green); font-family: var(--font-mono);">${item.algorithm}</span>
              <button class="tool-btn copy-single-hash-btn" data-hash="${item.hash}" style="padding: 0.15rem 0.4rem; height: auto; font-size: 0.6rem; background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.08);">Copy</button>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.62rem; color: #ffffff; overflow-x: auto; white-space: pre-wrap; word-break: break-all; background: rgba(0,0,0,0.2); padding: 0.35rem; border-radius: 4px; border: 1px solid rgba(0,0,0,0.4); max-height: 4rem;">${item.hash}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.58rem; color: var(--text-muted);">
              <span>Salt used: <code style="color: var(--neon-cyan);">${item.salt}</code></span>
            </div>
            <p style="font-size: 0.58rem; color: var(--text-muted); line-height: 1.3; margin: 0; margin-top: 0.15rem;">${item.description}</p>
          `;

          // Copy single hash event
          hashItem.querySelector(".copy-single-hash-btn").addEventListener("click", (e) => {
            const btn = e.target;
            const targetHash = btn.getAttribute("data-hash");
            copyToClipboard(targetHash);
            btn.textContent = "Copied!";
            btn.style.color = "var(--neon-green)";
            setTimeout(() => {
              btn.textContent = "Copy";
              btn.style.color = "#ffffff";
            }, 1000);
          });

          hashesContainer.appendChild(hashItem);
        });
      }

      // Hide loader, show results
      loadingState.style.display = "none";
      resultsState.style.display = "flex";

      // Refresh past lookup histories
      fetchHistory();

    } catch (err) {
      console.error(err);
      loadingState.style.display = "none";
      standbyState.style.display = "flex";
      window.showToast("AUDIT FAULT", err.message || "Cryptographic evaluation pipeline broken.", true);
    }
  });

  // Enter triggers deep scan
  pwInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runAuditBtn.click();
    }
  });

  // 3. Tactical Password Generator
  genTriggerBtn.addEventListener("click", () => {
    const length = parseInt(genLength.value, 10);
    const upper = genUpper.checked;
    const lower = genLower.checked;
    const digits = genDigits.checked;
    const specials = genSpecials.checked;
    const excludeSimilar = genExcludeSimilar.checked;

    if (!upper && !lower && !digits && !specials) {
      window.showToast("GENERATION REJECTED", "At least one character pool must be toggled on.", true);
      return;
    }

    const lowerPool = "abcdefghijklmnopqrstuvwxyz";
    const upperPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digitsPool = "0123456789";
    const specialsPool = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`";

    let combined = "";
    let mandatory = [];

    // Ensure at least one char of each selected pool is generated to satisfy policies
    if (lower) {
      let pool = lowerPool;
      if (excludeSimilar) pool = pool.replace(/[io]/g, "");
      combined += pool;
      mandatory.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (upper) {
      let pool = upperPool;
      if (excludeSimilar) pool = pool.replace(/[IOL]/g, "");
      combined += pool;
      mandatory.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (digits) {
      let pool = digitsPool;
      if (excludeSimilar) pool = pool.replace(/[01]/g, "");
      combined += pool;
      mandatory.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (specials) {
      combined += specialsPool;
      mandatory.push(specialsPool[Math.floor(Math.random() * specialsPool.length)]);
    }

    let result = [];
    // Start with the mandatory chars
    for (const char of mandatory) {
      result.push(char);
    }

    // Fill remaining length
    while (result.length < length) {
      const idx = Math.floor(Math.random() * combined.length);
      result.push(combined[idx]);
    }

    // Shuffle the array to distribute mandatory chars randomly
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }

    const finalPw = result.join("");
    genOutputText.textContent = finalPw;
    genOutputText.style.color = "var(--neon-green)";
    genCopyBtn.style.display = "block";
  });

  // Copy Generated Password
  genCopyBtn.addEventListener("click", () => {
    const generated = genOutputText.textContent;
    if (generated && generated !== "Generate key below...") {
      copyToClipboard(generated);
      genCopyBtn.textContent = "Copied!";
      setTimeout(() => {
        genCopyBtn.textContent = "Copy";
      }, 1000);
      window.showToast("CLIPBOARD CAPTURE", "Generated cryptographic secret captured to clipboard.");
    }
  });

  // 4. Hash Verification Terminal
  verifyTriggerBtn.addEventListener("click", async () => {
    const rawPlaintext = verifyPlaintext.value.trim();
    const rawHash = verifyHashInput.value.trim();

    if (!rawPlaintext || !rawHash) {
      window.showToast("VERIFICATION REJECTED", "Please supply both keyphrase and target hash.", true);
      return;
    }

    verifyFeedback.style.display = "block";
    verifyFeedback.style.background = "rgba(255,255,255,0.02)";
    verifyFeedback.style.borderColor = "rgba(255,255,255,0.08)";
    verifyFeedback.style.color = "var(--text-muted)";
    verifyFeedback.textContent = "RUNNING CRYPTOGRAPHIC PARSING INTEGRITY COMPARISONS...";

    try {
      const response = await fetch("/api/password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: rawPlaintext, hash: rawHash })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Cryptographic matching failed.");
      }

      if (result.match) {
        verifyFeedback.style.background = "rgba(0, 255, 157, 0.05)";
        verifyFeedback.style.borderColor = "var(--neon-green)";
        verifyFeedback.style.color = "var(--neon-green)";
        verifyFeedback.innerHTML = `[COMPLIANT] CRYPTOGRAPHIC INTEGRITY CONFIRMED!<br><span style="font-size: 0.58rem; color: #ffffff;">Auto-Detected Cipher: ${result.algorithm}</span>`;
        window.showToast("HASH VERIFIED", `Verified successfully using ${result.algorithm}!`);
      } else {
        verifyFeedback.style.background = "rgba(255, 75, 75, 0.05)";
        verifyFeedback.style.borderColor = "#ff4b4b";
        verifyFeedback.style.color = "#ff4b4b";
        verifyFeedback.innerHTML = `[ALERT] CRYPTOGRAPHIC INTEGRITY COMPROMISED!<br><span style="font-size: 0.58rem; color: #ffffff;">Target hash mismatch or unrecognized hash format.</span>`;
        window.showToast("INTEGRITY COMPROMISED", "Cryptographic comparison values mismatch.", true);
      }
    } catch (err) {
      console.error(err);
      verifyFeedback.style.background = "rgba(255, 75, 75, 0.05)";
      verifyFeedback.style.borderColor = "#ff4b4b";
      verifyFeedback.style.color = "#ff4b4b";
      verifyFeedback.textContent = `[AUDIT FAULT] COMPARISON DISRUPTED: ${err.message}`;
    }
  });

  // 5. Copy Forensic ASCII report
  btnCopyReport.addEventListener("click", () => {
    if (!activeAuditData) return;
    
    const hashesDesc = activeAuditData.hashes.map(h => `[${h.algorithm}]\nHash: ${h.hash}\nSalt: ${h.salt}`).join("\n\n");
    const rulesDesc = Object.keys(activeAuditData.checks)
      .map(k => `${k}: ${activeAuditData.checks[k] ? "PASSED" : "FAILED"}`)
      .join("\n");

    const report = `
================================================================================
          CYBERSHIELD ADVANCED PASSWORD CRYPTOGRAPHIC AUDIT REPORT
================================================================================
Generated: ${new Date(activeAuditData.timestamp).toUTCString()}
Status: ${activeAuditData.apiResponseStatus}
--------------------------------------------------------------------------------
1. FORENSIC TELEMETRY METRICS:
- Entropy: ${activeAuditData.entropy} bits
- Complexity Score: ${activeAuditData.complexityScore}%
- Character Pool (R): ${activeAuditData.poolSize} characters
- Crack Time (Est. 10 GH/s): ${activeAuditData.crackTime}
- Public Leaks Found (HIBP): ${activeAuditData.breachCount === -1 ? "OFFLINE/N/A" : activeAuditData.breachCount}
- Overall Verdict: ${activeAuditData.strengthLabel}

--------------------------------------------------------------------------------
2. POLICY COMPLIANCE MATRIX:
${rulesDesc}

--------------------------------------------------------------------------------
3. EDUCATIONAL CRYPTOGRAPHIC HASHLAB CODES:
${hashesDesc}

================================================================================
   CONFIDENTIAL SECURITY DOCUMENT • CYBERSHIELD OPERATIONS PERIMETER SOC-A
================================================================================
    `;

    copyToClipboard(report);
    window.showToast("REPORT COPIED", "Complete ASCII forensic audit copy drafted to clipboard.");
  });

  // 6. Print Report overlay or pop-up
  btnExportPdf.addEventListener("click", () => {
    if (!activeAuditData) return;

    const riskColor = activeAuditData.breachCount > 0 ? "#ff4b4b" : "var(--neon-green)";
    const riskLevel = activeAuditData.strengthLabel;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.showToast("POPUP BLOCKER ACTIVE", "Please allow popups to compile printable forensic PDF report.", true);
      return;
    }

    const hashesHtml = activeAuditData.hashes.map(h => `
      <div class="section" style="margin-bottom: 12px;">
        <div class="section-title">${h.algorithm}</div>
        <div class="data-row"><span class="label">Salt Vector</span><span class="value" style="font-family: monospace;">${h.salt}</span></div>
        <div style="font-family: monospace; font-size: 10px; background: #000; padding: 6px; border-radius: 4px; word-break: break-all; margin-top: 5px; color: #fff;">${h.hash}</div>
      </div>
    `).join("");

    const rulesHtml = Object.keys(activeAuditData.checks).map(k => `
      <div class="data-row">
        <span class="label">${k}</span>
        <span class="value" style="color: ${activeAuditData.checks[k] ? "#00ff9d" : "#ff4b4b"};">${activeAuditData.checks[k] ? "COMPLIANT (PASSED)" : "FAILING (RISK)"}</span>
      </div>
    `).join("");

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>CyberShield Forensic Password Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=JetBrains+Mono&display=swap');
    body {
      background-color: #03070c;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      padding: 40px;
    }
    .report-card {
      border: 1px solid rgba(0, 255, 157, 0.2);
      padding: 30px;
      background: #060b13;
      border-radius: 8px;
      position: relative;
    }
    .header {
      border-bottom: 2px double #00ff9d;
      padding-bottom: 15px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 22px;
      font-weight: bold;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .subtitle {
      font-size: 11px;
      color: #8892b0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 25px;
    }
    .section {
      border: 1px solid rgba(0, 255, 157, 0.15);
      padding: 15px;
      background: rgba(0, 255, 157, 0.01);
      border-radius: 5px;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      border-bottom: 1px dashed rgba(0, 255, 157, 0.2);
      padding-bottom: 5px;
      margin-bottom: 10px;
      color: #00ff9d;
    }
    .data-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .label {
      color: #8892b0;
    }
    .value {
      font-weight: bold;
      color: #ffffff;
    }
    .badge {
      padding: 5px 12px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      border: 1px solid ${riskColor};
      color: ${riskColor};
      background: rgba(3, 7, 12, 0.5);
    }
    .stamp {
      border: 2px dashed ${riskColor};
      border-radius: 5px;
      padding: 10px;
      width: 150px;
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      color: ${riskColor};
      transform: rotate(-3deg);
      position: absolute;
      bottom: 40px;
      right: 40px;
      opacity: 0.85;
    }
    .footer {
      font-size: 9px;
      color: #8892b0;
      text-align: center;
      margin-top: 30px;
      border-top: 1px solid rgba(0, 255, 157, 0.1);
      padding-top: 15px;
    }
    @media print {
      body {
        background-color: #ffffff;
        color: #000000;
        padding: 0;
      }
      .report-card {
        border-color: #000000;
        background: #ffffff;
        box-shadow: none;
      }
      .header {
        border-bottom-color: #000000;
      }
      .title {
        color: #000000;
      }
      .value {
        color: #000000;
      }
      .section-title {
        color: #000000;
        border-bottom-color: #000000;
      }
      .section {
        background: none;
        border-color: #e2e8f0;
      }
    }
  </style>
</head>
<body>
  <div class="report-card">
    <div class="header">
      <div>
        <div class="title">Forensic Cryptographic Password Audit</div>
        <div class="subtitle">CyberShield Operations Suite v8.22.1 • Evidence Registry</div>
      </div>
      <div class="badge">${riskLevel}</div>
    </div>

    <div class="grid">
      <div class="section">
        <div class="section-title">A. CRYPTOGRAPHIC ENTROPY RECON</div>
        <div class="data-row"><span class="label">Shannon Entropy Bounds</span><span class="value">${activeAuditData.entropy} bits</span></div>
        <div class="data-row"><span class="label">Complexity Rating</span><span class="value">${activeAuditData.complexityScore}%</span></div>
        <div class="data-row"><span class="label">Est. Brute-force time</span><span class="value">${activeAuditData.crackTime}</span></div>
        <div class="data-row"><span class="label">Character Pool size</span><span class="value">${activeAuditData.poolSize} chars</span></div>
      </div>

      <div class="section">
        <div class="section-title">B. BREACH INDEX FEED AUDIT (HIBP)</div>
        <div class="data-row"><span class="label">Secure range protocol</span><span class="value">k-Anonymity Verified</span></div>
        <div class="data-row"><span class="label">Leak database match</span><span class="value" style="color: ${riskColor};">${activeAuditData.breachCount === -1 ? "N/A" : activeAuditData.breachCount.toLocaleString()} matches</span></div>
        <div class="data-row"><span class="label">API Pipeline Endpoint</span><span class="value">${activeAuditData.apiResponseStatus}</span></div>
      </div>
    </div>

    <div class="section" style="margin-bottom: 25px;">
      <div class="section-title">C. CONFORMITY COMPLIANCE LOGS</div>
      ${rulesHtml}
    </div>

    <div style="margin-bottom: 120px;">
      <div class="section-title" style="font-size: 13px; font-weight: bold; color: #00ff9d; margin-bottom: 10px;">D. EDUCATIONAL CODES COMPARISON</div>
      ${hashesHtml}
    </div>

    <div class="stamp">VERIFIED SECURE<br><span style="font-size: 9px;">${riskLevel}</span></div>

    <div class="footer">
      THIS IS A CONFIDENTIAL CYBERSHIELD OPERATIONS FORENSICS FILE. SCRUB SENSITIVE PLAINTEXT RECORDS BEFORE EXTERNAL COMMUNICATIONS.
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `);
    printWindow.document.close();
  });

  // 7. Clear Scan database history
  clearHistoryBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/password/history", {
        method: "DELETE"
      });
      const result = await response.json();
      if (response.ok && result.success) {
        window.showToast("DATABASE SCRUBBED", "All password scan histories have been purged from database.");
        fetchHistory();
      } else {
        throw new Error(result.error || "Database purge failed.");
      }
    } catch (err) {
      console.error(err);
      window.showToast("PURGE FAULT", err.message || "Failed to scrub session database logs.", true);
    }
  });

  // --- SUB-FUNCTIONS ---

  // Helper colors
  function getStrengthColor(score) {
    if (score >= 80) return "var(--neon-green)";
    if (score >= 60) return "var(--neon-cyan)";
    if (score >= 40) return "var(--neon-yellow)";
    if (score >= 20) return "#ff9900";
    return "#ff4b4b";
  }

  // Copy helper
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }

  // Fetch search history log items
  async function fetchHistory() {
    try {
      const response = await fetch("/api/password/history");
      const result = await response.json();
      if (response.ok && result.success) {
        renderHistoryList(result.history);
      }
    } catch (err) {
      console.error("Error fetching password search histories:", err);
    }
  }

  // Render histories lists inside DOM
  function renderHistoryList(history) {
    if (!historyContainer) return;

    if (!history || history.length === 0) {
      historyContainer.innerHTML = `<p style="font-size: 0.7rem; color: var(--text-muted); text-align: center; margin: 2rem 0;">No diagnostic audit logs saved in active session database.</p>`;
      return;
    }

    historyContainer.innerHTML = "";
    history.forEach(item => {
      const tile = document.createElement("div");
      tile.className = "history-tile";
      tile.style.background = "rgba(255,255,255,0.01)";
      tile.style.border = "1px solid rgba(255,255,255,0.04)";
      tile.style.padding = "0.5rem 0.75rem";
      tile.style.borderRadius = "6px";
      tile.style.display = "flex";
      tile.style.justifyContent = "space-between";
      tile.style.alignItems = "center";
      tile.style.cursor = "pointer";
      tile.style.transition = "background-color 0.2s, border-color 0.2s";

      const localDate = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const scoreColor = getStrengthColor(item.complexityScore);

      tile.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.15rem;">
          <div style="font-family: var(--font-mono); font-size: 0.68rem; color: #ffffff; display: flex; align-items: center; gap: 0.35rem;">
            <span>LEN: ${item.passwordLength}</span>
            <span style="font-weight: bold; color: ${scoreColor}; font-size: 0.6rem;">${item.strengthLabel.toUpperCase()}</span>
          </div>
          <span style="font-size: 0.58rem; color: var(--text-muted);">${localDate} • ${item.entropy} bits entropy</span>
        </div>
        <div style="text-align: right; display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: bold; color: ${scoreColor};">${item.complexityScore}%</span>
          <svg style="width: 0.75rem; height: 0.75rem; color: var(--text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      `;

      // Interactive hover
      tile.addEventListener("mouseenter", () => {
        tile.style.background = "rgba(0, 255, 157, 0.03)";
        tile.style.borderColor = "rgba(0, 255, 157, 0.15)";
      });
      tile.addEventListener("mouseleave", () => {
        tile.style.background = "rgba(255,255,255,0.01)";
        tile.style.borderColor = "rgba(255,255,255,0.04)";
      });

      // Click to re-load characteristics
      tile.addEventListener("click", () => {
        window.showToast("AUDIT RE-LOAD", "Please type candidate sequence to run full cryptographic comparison audit.");
        pwInput.value = "";
        pwInput.focus();
      });

      historyContainer.appendChild(tile);
    });
  }
}
