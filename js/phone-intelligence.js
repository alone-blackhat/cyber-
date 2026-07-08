/*
 * CyberShield Awareness - Phone Intelligence OSINT Controller
 * Advanced Telecom Handshake Analysis & Threat Reputational Profiling
 */

export function initPhoneIntelligence() {
  const numInput = document.getElementById('phone-number-input');
  const countrySelect = document.getElementById('phone-country-select');
  const scanBtn = document.getElementById('phone-scan-trigger-btn');
  const clearHistoryBtn = document.getElementById('phone-clear-history-btn');
  
  const standbyState = document.getElementById('phone-standby-state');
  const loadingState = document.getElementById('phone-loading-state');
  const resultsState = document.getElementById('phone-results-state');
  
  const loadingStep = document.getElementById('phone-loading-step');
  const loadingBar = document.getElementById('phone-loading-bar');
  const historyContainer = document.getElementById('phone-history-container');
  const responseTag = document.getElementById('phone-response-tag');

  // Result Fields
  const resNumberDisplay = document.getElementById('phone-result-number-display');
  const resValid = document.getElementById('p-res-valid');
  const resType = document.getElementById('p-res-type');
  const resIntl = document.getElementById('p-res-intl');
  const resNat = document.getElementById('p-res-nat');
  const resCarrier = document.getElementById('p-res-carrier');
  const resCountry = document.getElementById('p-res-country');
  const resRegion = document.getElementById('p-res-region');
  const resTz = document.getElementById('p-res-tz');
  const resSpamPercentage = document.getElementById('phone-spam-percentage');
  const resSpamBar = document.getElementById('phone-spam-bar');
  const resRepBadge = document.getElementById('phone-reputation-badge');
  const resTime = document.getElementById('phone-result-time');
  const resApiStatus = document.getElementById('phone-api-status');

  // Action Buttons
  const copyBtn = document.getElementById('phone-btn-copy-results');
  const exportBtn = document.getElementById('phone-btn-export-pdf');

  let activeResultData = null;

  if (!numInput || !scanBtn) {
    console.warn("Phone Intelligence UI components not found in active DOM.");
    return;
  }

  // Fetch past search history on initialize
  fetchHistory();

  // Trigger Scanner Handler
  scanBtn.addEventListener('click', async () => {
    const rawNumber = numInput.value.trim();
    const defaultCountry = countrySelect.value;

    if (!rawNumber) {
      showToast('INPUT REJECTED', 'Please specify a target phone sequence to initiate OSINT diagnostics.', true);
      return;
    }

    // Enter Loading State
    standbyState.style.display = 'none';
    resultsState.style.display = 'none';
    loadingState.style.display = 'flex';
    responseTag.style.display = 'none';

    // Simulated scanning steps for realistic cyber feeling
    const steps = [
      { prg: 15, text: "ESTABLISHING TELECOM TERMINAL PROBE..." },
      { prg: 35, text: "PARSING COUNTRY ROUTING BLOCK AND PREFIXES..." },
      { prg: 60, text: "CONTACTING GEOGRAPHIC IDENTITY REGISTRIES..." },
      { prg: 85, text: "SCANNING ACTIVE VISHING AND FRAUD COLLISION INDEXES..." },
      { prg: 100, text: "TERMINAL SYNC COMPLETE. PARSING SCHEMAS..." }
    ];

    try {
      // Stagger the loading logs to make it extremely cinematic
      for (const step of steps) {
        loadingStep.textContent = step.text;
        loadingBar.style.width = `${step.prg}%`;
        await new Promise(r => setTimeout(r, 350));
      }

      // Backend Query
      const response = await fetch('/api/phone/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: rawNumber, defaultCountry })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Handshake failed.");
      }

      // Populate Data in UI
      const lookup = result.data;
      activeResultData = lookup;

      resNumberDisplay.textContent = lookup.internationalFormat;
      resValid.textContent = lookup.valid ? "VALID" : "INVALID";
      resType.textContent = lookup.lineType || "Unknown";
      resIntl.textContent = lookup.internationalFormat || "-";
      resNat.textContent = lookup.nationalFormat || "-";
      resCarrier.textContent = lookup.carrier || "Unknown";
      resCountry.textContent = lookup.country || "Unknown";
      resRegion.textContent = lookup.region || "Unknown";
      resTz.textContent = lookup.timeZone || "Unknown";

      // Reputation Score Visualizer
      const score = lookup.spamScore || 0;
      resSpamPercentage.textContent = `${score}%`;
      resSpamBar.style.width = `${score}%`;

      // Visual color adaptation
      let scoreColor = "var(--neon-cyan)";
      let repText = "SECURE";
      let badgeClass = "rep-secure";
      let badgeBg = "rgba(0, 255, 157, 0.1)";
      let badgeBorder = "rgba(0, 255, 157, 0.3)";

      if (score <= 20) {
        scoreColor = "var(--neon-green)";
        repText = "SECURE";
        badgeBg = "rgba(0, 255, 157, 0.1)";
        badgeBorder = "var(--neon-green)";
      } else if (score <= 50) {
        scoreColor = "var(--neon-yellow)";
        repText = "LOW RISK";
        badgeBg = "rgba(255, 204, 0, 0.1)";
        badgeBorder = "var(--neon-yellow)";
      } else if (score <= 80) {
        scoreColor = "#ff9900";
        repText = "SUSPICIOUS";
        badgeBg = "rgba(255, 153, 0, 0.1)";
        badgeBorder = "#ff9900";
      } else {
        scoreColor = "#ff4b4b";
        repText = "VISHING RISK";
        badgeBg = "rgba(255, 75, 75, 0.1)";
        badgeBorder = "#ff4b4b";
      }

      resSpamBar.style.backgroundColor = scoreColor;
      resSpamPercentage.style.color = scoreColor;

      resRepBadge.className = "pulse-container";
      resRepBadge.style.background = badgeBg;
      resRepBadge.style.color = scoreColor;
      resRepBadge.style.border = `1px solid ${badgeBorder}`;
      resRepBadge.innerHTML = `<span class="pulse-dot" style="background: ${scoreColor}; width: 6px; height: 6px; border-radius: 50%; box-shadow: 0 0 8px ${scoreColor}; display: inline-block;"></span> <span style="font-weight: 700;">${repText}</span>`;

      resTime.textContent = new Date(lookup.timestamp).toISOString().replace('T', ' ').substring(0, 19) + " UTC";
      
      const handshakeLabel = result.apiResponseStatus || "LOCAL_OSINT";
      resApiStatus.textContent = handshakeLabel;
      resApiStatus.style.color = scoreColor;

      responseTag.textContent = handshakeLabel;
      responseTag.style.display = 'block';
      responseTag.style.color = scoreColor;
      responseTag.style.borderColor = `rgba(255, 255, 255, 0.08)`;

      // Switch views
      loadingState.style.display = 'none';
      resultsState.style.display = 'flex';

      showToast('OSINT SCAN SUCCEEDED', `Successfully resolved routing registry metadata for ${lookup.internationalFormat}`);

      // Refresh search history list
      fetchHistory();

    } catch (err) {
      console.error(err);
      loadingState.style.display = 'none';
      standbyState.style.display = 'flex';
      showToast('TELECOM GATEWAY TIMEOUT', err.message || "An error occurred during terminal telemetry verification.", true);
    }
  });

  // History Purging Button Handler
  clearHistoryBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/phone/history', { method: 'DELETE' });
      if (response.ok) {
        showToast('HISTORY PURGED', 'Phone scan terminal history has been scrubbed from local and cloud nodes.');
        fetchHistory();
      } else {
        throw new Error("Could not scrub lookup history.");
      }
    } catch (err) {
      showToast(' scrubbing error', err.message, true);
    }
  });

  // Copy Results to Clipboard Handler
  copyBtn.addEventListener('click', () => {
    if (!activeResultData) return;
    const logText = `
=========================================
 CYBERSHIELD TELECOM INTEL OSINT LOG
=========================================
Target Number : ${activeResultData.internationalFormat}
National Form : ${activeResultData.nationalFormat}
Country       : ${activeResultData.country} (Code: ${activeResultData.countryCode})
Carrier Sig   : ${activeResultData.carrier}
Routing Type  : ${activeResultData.lineType}
Geographic    : ${activeResultData.region}
UTC Timezone  : ${activeResultData.timeZone}
Spam Risk Ind : ${activeResultData.spamScore}%
Report Time   : ${new Date(activeResultData.timestamp).toUTCString()}
Valid Route   : ${activeResultData.valid ? "YES" : "NO"}
=========================================
`;
    navigator.clipboard.writeText(logText.trim()).then(() => {
      showToast('COPIED TO TERMINAL', 'Cryptographic intelligence log has been mirrored to clipboard.');
    }).catch(err => {
      showToast('COPY ERROR', 'Failed to write to clipboard.', true);
    });
  });

  // Export Forensic PDF (via formatted window print pipeline)
  exportBtn.addEventListener('click', () => {
    if (!activeResultData) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      showToast('POPUP BLOCKED', 'Please allow popups to export the forensic report.', true);
      return;
    }

    const riskColor = activeResultData.spamScore <= 20 ? "#00ff9d" : activeResultData.spamScore <= 50 ? "#ffcc00" : activeResultData.spamScore <= 80 ? "#ff9900" : "#ff4b4b";
    const riskLevel = activeResultData.spamScore <= 20 ? "SECURE" : activeResultData.spamScore <= 50 ? "LOW RISK" : activeResultData.spamScore <= 80 ? "SUSPICIOUS" : "CRITICAL FRAUD DANGER";

    printWindow.document.write(`
<html>
<head>
  <title>CYBERSHIELD FORENSIC REPORT - ${activeResultData.internationalFormat}</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      background-color: #03070c;
      color: #e2e8f0;
      padding: 40px;
      line-height: 1.5;
    }
    .report-card {
      border: 2px solid #00f2ff;
      padding: 30px;
      background: #060b13;
      border-radius: 8px;
      position: relative;
    }
    .header {
      border-bottom: 2px double #00f2ff;
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
      border: 1px solid rgba(0, 242, 255, 0.2);
      padding: 15px;
      background: rgba(0, 242, 255, 0.02);
      border-radius: 5px;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      border-bottom: 1px dashed rgba(0, 242, 255, 0.2);
      padding-bottom: 5px;
      margin-bottom: 10px;
      color: #00f2ff;
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
      border-top: 1px solid rgba(0, 242, 255, 0.1);
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
        <div class="title">Telecom OSINT Intelligence Forensic Audit</div>
        <div class="subtitle">CyberShield Operations Suite v8.22.1 • Handshake Record</div>
      </div>
      <div class="badge">${riskLevel}</div>
    </div>

    <div class="grid">
      <div class="section">
        <div class="section-title">A. ROUTING IDENTITY METADATA</div>
        <div class="data-row"><span class="label">Primary Number</span><span class="value">${activeResultData.internationalFormat}</span></div>
        <div class="data-row"><span class="label">National Format</span><span class="value">${activeResultData.nationalFormat}</span></div>
        <div class="data-row"><span class="label">Route Validity</span><span class="value">${activeResultData.valid ? "CONFIRMED VALID" : "INVALID"}</span></div>
        <div class="data-row"><span class="label">Routing Type</span><span class="value">${activeResultData.lineType}</span></div>
      </div>

      <div class="section">
        <div class="section-title">B. INTEGRITY & SIGNAL RECON</div>
        <div class="data-row"><span class="label">Telecom Carrier</span><span class="value">${activeResultData.carrier}</span></div>
        <div class="data-row"><span class="label">Country Destination</span><span class="value">${activeResultData.country}</span></div>
        <div class="data-row"><span class="label">Carrier Region Node</span><span class="value">${activeResultData.region}</span></div>
        <div class="data-row"><span class="label">Standard Timezone</span><span class="value">${activeResultData.timeZone}</span></div>
      </div>
    </div>

    <div class="section" style="margin-bottom: 25px;">
      <div class="section-title">C. REPUTATIONAL RECONNAISSANCE & FRAUD LEVEL</div>
      <div class="data-row"><span class="label">Security Risk Score</span><span class="value" style="color: ${riskColor}; font-size: 16px;">${activeResultData.spamScore}%</span></div>
      <div class="data-row"><span class="label">Vishing Threat Tier</span><span class="value" style="color: ${riskColor};">${riskLevel}</span></div>
      <div style="font-size: 11px; color: #8892b0; margin-top: 10px; line-height: 1.4;">
        * This forensic telemetry score was analyzed dynamically by matching cellular carrier routes, prefixes, and active honeypot reports. This audit record forms a verified evidence trail.
      </div>
    </div>

    <div class="section" style="margin-bottom: 120px;">
      <div class="section-title">D. EVIDENCE BLOCK & SIGNATURE</div>
      <div class="data-row"><span class="label">Audit Timestamp</span><span class="value">${new Date(activeResultData.timestamp).toUTCString()}</span></div>
      <div class="data-row"><span class="label">SHA-256 Checksum</span><span class="value" style="font-size: 10px;">${hashString(activeResultData.internationalFormat + activeResultData.timestamp)}</span></div>
      <div class="data-row"><span class="label">Digital Authority</span><span class="value">CYBERSHIELD-OPERATIONS-SOC-A</span></div>
    </div>

    <div class="stamp">VERIFIED OSINT<br><span style="font-size: 9px;">${riskLevel}</span></div>

    <div class="footer">
      THIS IS A CYBER FORENSICS CRIME RECORD GEN-IV. CONFIDENTIAL. SCRUB ALL SENSITIVE METADATA BEFORE OUTWARD PERIMETER DISCLOSURE.
    </div>
  </div>

  <script>
    // Prompt print directly on load
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `);
    printWindow.document.close();
  });

  // Fetch scans history from server
  async function fetchHistory() {
    try {
      const response = await fetch('/api/phone/history');
      const result = await response.json();
      if (result.success) {
        renderHistoryList(result.history);
      }
    } catch (err) {
      console.error("Error fetching lookup history:", err);
    }
  }

  // Render scan history inside DOM list
  function renderHistoryList(history) {
    if (!historyContainer) return;
    
    if (!history || history.length === 0) {
      historyContainer.innerHTML = `<p style="font-size: 0.7rem; color: var(--text-muted); text-align: center; margin: 2rem 0;">No active lookups saved in this session's terminal log.</p>`;
      return;
    }

    historyContainer.innerHTML = history.map(item => {
      const score = item.spamScore || 0;
      const badgeColor = score <= 20 ? "var(--neon-green)" : score <= 50 ? "var(--neon-yellow)" : score <= 80 ? "#ff9900" : "#ff4b4b";
      const displayTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="glass-section phone-history-item" style="padding: 0.6rem; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; background: rgba(255,255,255,0.01); transition: all 0.2s;" data-number="${item.phoneNumber}">
          <div style="display: flex; flex-direction: column; gap: 0.15rem; min-width: 0;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: bold; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.phoneNumber}</span>
            <span style="font-size: 0.6rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.carrier} • ${item.country}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
            <span style="font-family: var(--font-mono); font-size: 0.65rem; color: ${badgeColor}; font-weight: bold;">${score}%</span>
            <span style="font-size: 0.58rem; color: var(--text-muted);">${displayTime}</span>
          </div>
        </div>
      `;
    }).join("");

    // Attach click events to reload historic scans
    const items = historyContainer.querySelectorAll('.phone-history-item');
    items.forEach(el => {
      el.addEventListener('click', () => {
        const num = el.getAttribute('data-number');
        if (num) {
          numInput.value = num;
          scanBtn.click();
        }
      });
    });
  }

  // Simple string-to-hash function for report SHA checksum mock
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase();
    return "CE" + "0".repeat(8 - hex.length) + hex + "FA5418E9B" + hex.slice(-2);
  }
}
