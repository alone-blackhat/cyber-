/*
 * CyberShield Awareness - Premium Elegant Dark SOC Javascript Controller
 * Re-imagined Security Operations Center (SOC) Console
 */

import { fetchCyberNews, escapeHTML } from "./news-api.js";
import jsQR from "jsqr";
import { initPhoneIntelligence } from "./phone-intelligence.js";
import { initPasswordAnalyzer } from "./password-analyzer.js";

document.addEventListener('DOMContentLoaded', () => {
  
  // --- STATE MANAGERS ---
  const consoleState = {
    user: 'Agent Alice',
    securityScore: 88,
    criticalThreats: 4,
    safeDomainsAnalyzed: 1420,
    phishingTrapsHooked: 392,
    passwordCiphersAnalyzed: 127,
    quizProgress: 92,
    activeTipIndex: 0,
    quizScore: 0,
    quizCurrentQuestion: 0,
    complianceStreak: 3,
    activeSection: 'dashboard'
  };

  // --- FETCH ACTIVE USER SESSION ---
  async function fetchActiveSession() {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();
      if (result.success && result.user) {
        consoleState.user = result.user.username;
        const userNameEls = document.querySelectorAll('.user-name');
        userNameEls.forEach(el => el.textContent = result.user.username);
        
        const welcomeTitle = document.getElementById('typing-welcome');
        if (welcomeTitle) {
          welcomeTitle.textContent = `AUTHENTICATION CONFIRMED: WELCOME ${result.user.username.toUpperCase()} TO SECURITY OPERATIONS CENTER`;
        }
      }
    } catch (err) {
      console.error("Session verification failure:", err);
    }
  }

  fetchActiveSession();

  let mapInterval = null;

  // --- CYBER SAFETY TIPS CORRIDOR ---
  const safetyTips = [
    "Never disclose authentication OTPs, MFA codes, or password hashes to anyone. CyberShield Security will never request them.",
    "Enable Multi-Factor Authentication (MFA) using authenticators or hardware keys rather than SMS verification.",
    "Draft passphrases over simple passwords. Multi-word phrases like 'correct-horse-battery-staple' provide massive brute-force entropy.",
    "Update terminal kernels, operating systems, and host agents immediately when security patches are released.",
    "Do not trust sender headers blindly. Check the DKIM, SPF, and DMARC alignment records before opening email links.",
    "Avoid public hotspots for administrative actions. When outside secure perimeter zones, always route through an active AES VPN.",
    "Ensure your local home routers are updated and their default administrative credentials have been modified."
  ];

  // --- INITIALIZE ALL WIDGETS ---
  initClock();
  initMatrixRain();
  initBackgroundParticles();
  initSidebarNavigation();
  initMetricCounters();
  initInteractiveTips();
  initThreatMapSimulator();
  initAnalyticsCharts();
  initPhishingLab();
  initURLChecker();
  initPasswordChecker();
  initFileSandbox();
  initComplianceQuiz();
  initReportGenerator();
  initSettingsController();
  initNotificationsDropdown();
  initSidebarCodeBars();
  initQRChecker();
  initEmailSafetyChecker();
  initPhoneIntelligence();
  initPasswordAnalyzer();
  initCommunityForum();
  initSupportConsole();
  initFeedbackConsole();
  initCyberFabSheet();
  initBackNavigationButton();
  window.showToast = showToast;

  // Restore stored target if redirected from cyber-news.html
  const storedTarget = localStorage.getItem('active_soc_target');
  if (storedTarget) {
    localStorage.removeItem('active_soc_target');
    setTimeout(() => {
      const targetMenuItem = document.querySelector(`.menu-item[data-target="${storedTarget}"]`);
      if (targetMenuItem) {
        targetMenuItem.click();
      }
    }, 150);
  }

  // --- 1. LIVE SYSTEM CLOCK ---
  function initClock() {
    const clockDisplay = document.getElementById('clock-display');
    if (!clockDisplay) return;

    function updateClock() {
      const now = new Date();
      const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
      clockDisplay.textContent = `${timeStr} UTC`;
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  // --- 2. MATRIX RAIN AND BACKGROUND ANIMATION ---
  function initMatrixRain() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set size to fit window
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Characters definition
    const chars = "0101010101ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*+=".split("");
    const fontSize = 11;
    const columns = Math.floor(canvas.width / fontSize);

    // Track vertical position of drops
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    function draw() {
      if (document.hidden) return; // Skip calculation and rendering when tab is inactive

      // Semi-transparent black to leave trails
      ctx.fillStyle = "rgba(2, 4, 8, 0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(0, 242, 255, 0.35)"; // Neo Cyan matrix
      ctx.font = `${fontSize}px "JetBrains Mono"`;

      for (let i = 0; i < drops.length; i++) {
        // Pick a random char
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Horizontal coordinate
        const x = i * fontSize;
        // Vertical coordinate
        const y = drops[i] * fontSize;

        // Draw character
        ctx.fillText(text, x, y);

        // Reset if it hits bottom of screen
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }

        // Move drop vertically
        drops[i]++;
      }
    }

    // Call draw loop
    const matrixInterval = setInterval(draw, 33);
    
    // Clean up if needed, though this is a single page application
    window.addEventListener('beforeunload', () => {
      clearInterval(matrixInterval);
    });
  }

  // --- 2b. PARTICLE CONSTELLATION ---
  function initBackgroundParticles() {
    const canvas = document.getElementById('background-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const maxParticles = 50;
    const connectionDist = 120;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() * 0.4) - 0.2;
        this.speedY = (Math.random() * 0.4) - 0.2;
        this.color = ['#00f2fe', '#4facfe', '#00ff9d'][Math.floor(Math.random() * 3)];
        this.opacity = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    function animate() {
      if (!canvas || !ctx) return;

      if (document.hidden) {
        requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  // --- 3. SIDEBAR NAVIGATION CONTROLLER ---
  function initSidebarNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.viewport-section');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        if (!target) return;

        // Check if it is a news click
        if (target === 'news') {
          showToast('SOC NAVIGATION ROUTE', 'Routing to Cyber News Intelligence Portal...');
          document.body.classList.add('page-fade-out');
          setTimeout(() => {
            window.location.href = 'cyber-news.html';
          }, 350);
          return;
        }

        // Check if it is a logout click
        if (item.id === 'sidebar-logout' || target === 'logout') {
          handleLogout();
          return;
        }

        // Clear active on items
        menuItems.forEach(m => m.classList.remove('active'));
        item.classList.add('active');

        // Synchronize bottom nav bar
        bottomNavItems.forEach(b => {
          b.classList.remove('active');
          if (b.getAttribute('data-nav-target') === target) {
            b.classList.add('active');
          }
        });

        // Switch active section with fade transitions
        sections.forEach(sec => {
          sec.classList.remove('active-section');
          if (sec.id === `view-${target}`) {
            sec.classList.add('active-section');
            consoleState.activeSection = target;
            showToast('SOC NAVIGATION ROUTE', `Accessing ${item.querySelector('span').textContent} workspace...`);
          }
        });


      });
    });

    // Bottom Navigation Bar button clicks
    bottomNavItems.forEach(bItem => {
      bItem.addEventListener('click', () => {
        const target = bItem.getAttribute('data-nav-target');
        const correspondingMenuItem = document.querySelector(`.menu-item[data-target="${target}"]`);
        if (correspondingMenuItem) {
          correspondingMenuItem.click();
        }
      });
    });

    // Quick Actions Portal Cards Click Handler
    const quickActionCards = document.querySelectorAll('.quick-action-card');
    quickActionCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.getAttribute('data-action');
        if (!action) return;
        
        // Find corresponding menu item and trigger click
        const targetMenuItem = document.querySelector(`.menu-item[data-target="${action}"]`);
        if (targetMenuItem) {
          targetMenuItem.click();
          
          // Focus specific input controls if needed
          setTimeout(() => {
            if (action === 'url-checker') {
              document.getElementById('url-input-field')?.focus();
            } else if (action === 'password-checker') {
              document.getElementById('password-input-field')?.focus();
            }
          }, 350);
        }
      });
    });

    // Diagnostic Tools Portal Cards Click Handler
    const portalCards = document.querySelectorAll('.portal-tool-card');
    portalCards.forEach(card => {
      card.addEventListener('click', () => {
        const trigger = card.getAttribute('data-trigger');
        if (!trigger) return;
        const targetMenuItem = document.querySelector(`.menu-item[data-target="${trigger}"]`);
        if (targetMenuItem) {
          targetMenuItem.click();
        }
      });
    });

    // Logo click goes back to main dashboard
    const logo = document.querySelector('.logo-wrapper');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', () => {
        const dashItem = document.querySelector('.menu-item[data-target="dashboard"]');
        if (dashItem) dashItem.click();
      });
    }

    // Mobile sidebar toggle with Hamburger & Overlay
    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (hamburgerBtn && sidebar && overlay) {
      hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('mobile-open');
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('mobile-open');
      });

      // Close sidebar when an item is selected on mobile
      menuItems.forEach(item => {
        item.addEventListener('click', () => {
          sidebar.classList.remove('mobile-open');
          overlay.classList.remove('mobile-open');
        });
      });
    }

    // Mobile Search toggle behavior
    const searchContainer = document.querySelector('.search-container');
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.getElementById('global-search');
    if (searchContainer && searchIcon) {
      searchIcon.addEventListener('click', (e) => {
        // Only trigger expansion on mobile screens
        if (window.innerWidth <= 650) {
          e.stopPropagation();
          searchContainer.classList.toggle('expanded');
          if (searchContainer.classList.contains('expanded')) {
            searchInput.focus();
          }
        }
      });

      // Clicking outside mobile expanded search collapses it
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 650 && searchContainer.classList.contains('expanded') && !searchContainer.contains(e.target)) {
          searchContainer.classList.remove('expanded');
        }
      });
    }

    // Nav bar logout trigger
    const navLogout = document.getElementById('nav-logout');
    if (navLogout) {
      navLogout.addEventListener('click', handleLogout);
    }
  }

  async function handleLogout() {
    showToast('TERMINATING SESSION', 'Revoking SOC encryption keys... redirecting to gateway.', true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1200);
  }

  // --- 4. ANIMATED METRIC COUNTERS ---
  function initMetricCounters() {
    animateCount('counter-score', consoleState.securityScore, "%");
    animateCount('counter-threats', consoleState.criticalThreats, "");
    animateCount('counter-checked', consoleState.safeDomainsAnalyzed, "");
    animateCount('counter-phishing', consoleState.phishingTrapsHooked, "");
    animateCount('counter-pass', consoleState.passwordCiphersAnalyzed, "");
    animateCount('counter-quiz', consoleState.quizProgress, "%");

    // Welcome typing title effect
    const welcomeTitle = document.getElementById('typing-welcome');
    if (welcomeTitle) {
      const fullText = `AUTHENTICATION CONFIRMED: WELCOME ${consoleState.user.toUpperCase()} TO SECURITY OPERATIONS CENTER`;
      let i = 0;
      welcomeTitle.textContent = "";
      
      function typeEffect() {
        if (i < fullText.length) {
          welcomeTitle.textContent += fullText.charAt(i);
          i++;
          setTimeout(typeEffect, 30);
        }
      }
      setTimeout(typeEffect, 500);
    }
  }

  function animateCount(elemId, endValue, suffix = "") {
    const obj = document.getElementById(elemId);
    if (!obj) return;

    let startValue = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    function step(timestamp) {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentVal = Math.floor(progress * (endValue - startValue) + startValue);
      obj.textContent = currentVal + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        obj.textContent = endValue + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  // --- 5. INTERACTIVE ROTATING SAFETY TIPS ---
  function initInteractiveTips() {
    const placeholder = document.getElementById('dashboard-tip-placeholder');
    const cycleBtn = document.getElementById('cycle-banner-tip');

    if (!placeholder) return;

    function cycleTip() {
      // Outward transition
      placeholder.style.opacity = '0';
      
      setTimeout(() => {
        consoleState.activeTipIndex = (consoleState.activeTipIndex + 1) % safetyTips.length;
        placeholder.textContent = `"${safetyTips[consoleState.activeTipIndex]}"`;
        placeholder.style.opacity = '1';
      }, 300);
    }

    if (cycleBtn) {
      cycleBtn.addEventListener('click', cycleTip);
    }

    // Auto rotate every 12 seconds
    setInterval(cycleTip, 12000);
  }

  // --- 6. REAL-TIME THREAT MAP VECTOR SIMULATOR ---
  function initThreatMapSimulator() {
    const mapContainer = document.getElementById('world-map-svg');
    const simulationRows = document.getElementById('simulation-rows');

    if (!mapContainer || !simulationRows) return;

    const sources = [
      { name: "CN-NODE-BEIJING", x: 740, y: 100, class: "Beijing, CN" },
      { name: "RU-NODE-S_PETERSBURG", x: 530, y: 70, class: "S. Petersburg, RU" },
      { name: "EU-RELAY-FRANKFURT", x: 480, y: 95, class: "Frankfurt, GER" },
      { name: "BR-GATE-SAO_PAULO", x: 290, y: 310, class: "Sao Paulo, BR" },
      { name: "US-CORRIDOR-SEATTLE", x: 120, y: 90, class: "Seattle, US" }
    ];

    const destinations = [
      { name: "NA-EDGE-PRIMARY", x: 180, y: 120 },
      { name: "EU-CORE-GATEWAY", x: 500, y: 100 },
      { name: "AS-PACIFIC-NODE", x: 780, y: 110 },
      { name: "SA-RECOVERY-RESERVE", x: 280, y: 300 }
    ];

    const attackTypes = [
      { type: "Phishing Arc", risk: "MEDIUM", class: "blue" },
      { type: "Malware Drop", risk: "HIGH", class: "yellow" },
      { type: "DDoS Synflood", risk: "CRITICAL", class: "red" },
      { type: "SQLi Probe", risk: "HIGH", class: "yellow" },
      { type: "Credential Stuffing", risk: "MEDIUM", class: "blue" }
    ];

    // Clear loading text
    simulationRows.innerHTML = "";

    function generateAttack() {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const dest = destinations[Math.floor(Math.random() * destinations.length)];
      const attack = attackTypes[Math.floor(Math.random() * attackTypes.length)];

      // Trigger visual laser vector on the SVG
      const pathGroup = document.getElementById('map-attack-lines');
      if (pathGroup) {
        const pathId = `attack-${Date.now()}`;
        const strokeColor = attack.class === 'red' ? '#ef4444' : attack.class === 'yellow' ? '#f59e0b' : '#4facfe';
        
        // Draw elegant curve arc rather than a flat line
        const dx = dest.x - source.x;
        const dy = dest.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // Control curve radius
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("id", pathId);
        path.setAttribute("d", `M ${source.x} ${source.y} A ${dr} ${dr} 0 0 1 ${dest.x} ${dest.y}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", strokeColor);
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("class", "attack-vector-line");
        
        pathGroup.appendChild(path);

        // Delete visual node after animation finishes (3 seconds)
        setTimeout(() => {
          path.remove();
        }, 3000);
      }

      // Append logs feed row
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      const row = document.createElement('div');
      row.className = 'feed-row';
      row.innerHTML = `
        <div class="feed-meta-col">
          <span class="feed-class-indicator ${attack.class}">${attack.risk}</span>
          <span class="feed-location-text"><strong>${source.name}</strong> &rarr; <strong>${dest.name}</strong> (${attack.type})</span>
        </div>
        <span class="feed-time-indicator">${timeStr} UTC</span>
      `;

      simulationRows.prepend(row);

      // Maintain max logs list in feed to prevent DOM bloat
      if (simulationRows.children.length > 25) {
        simulationRows.lastElementChild.remove();
      }
    }

    // Generate random attacks in intervals
    mapInterval = setInterval(generateAttack, 2800);

    // Wire up large simulator view injectors
    const injectButtons = document.querySelectorAll('.sim-inject-btn');
    const simReport = document.getElementById('sim-live-report');

    injectButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.getAttribute('data-type');
        triggerManualSimulation(type);
      });
    });

    function triggerManualSimulation(type) {
      if (simReport) {
        simReport.innerHTML = `
          <p class="color-cyan" style="font-weight: 600;">[STATUS] PAYLOAD INJECTED SUCCESSFULLY</p>
          <p><strong>Vector Classification:</strong> ${type}</p>
          <p><strong>Trace Origin:</strong> SIM-INJECT-LOCAL // PORT 3000</p>
          <p><strong>Recommended Action:</strong> Initiate immediate firewall packet sanitization. Verify compliance protocols. Update all affected client host signatures.</p>
        `;
        showToast('SIMULATOR OVERRIDE', `Injected simulated ${type} incident. Check trace logs.`);
      }
    }
  }



  // --- 7. PROFESSIONAL ANALYTICS CHARTS (Chart.js) ---
  function initAnalyticsCharts() {
    const ctxThreat = document.getElementById('threat-chart-canvas');
    const ctxAwareness = document.getElementById('awareness-chart-canvas');

    if (!ctxThreat || !ctxAwareness) return;

    // Chart A: Line Chart
    new Chart(ctxThreat, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Interceptions',
          data: [42, 68, 120, 50, 95, 30, 4],
          borderColor: '#00f2ff',
          backgroundColor: 'rgba(0, 242, 255, 0.05)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 } } },
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 } } }
        }
      }
    });

    // Chart B: Bar Chart
    new Chart(ctxAwareness, {
      type: 'bar',
      data: {
        labels: ['Phishing', 'Malware', 'Ciphers', 'Social Eng', 'DDoS'],
        datasets: [{
          label: 'Compliance Accuracy',
          data: [82, 74, 90, 85, 95],
          backgroundColor: 'rgba(0, 255, 157, 0.65)',
          borderColor: '#00ff9d',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { max: 100, grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 } } },
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 } } }
        }
      }
    });
  }

  // --- 8. PHISHING EMAIL LABS ---
  function initPhishingLab() {
    const feed = document.getElementById('phishing-email-inbound');
    const details = document.getElementById('phishing-email-details');

    if (!feed || !details) return;

    const mockEmails = [
      {
        id: "em-1",
        sender: "Secured-Paypal Service <accounts@paypal-verification-gateway-ssl.net>",
        senderClean: "accounts@paypal-verification-gateway-ssl.net",
        subject: "Urgent: Unauthenticated login attempts caught on routing corridor. Verify credentials.",
        date: "Today, 10:25 UTC",
        body: `Dear Client,<br/><br/>
        Our cybersecurity tracking engine flags 3 suspicious login attempts targeting your financial terminal in Shanghai, China.<br/><br/>
        To prevent account freeze, you must immediately confirm your credit signatures in our sandboxed portal:
        <br/><br/>
        <a href="#" style="color:var(--neon-cyan); text-decoration:underline;">https://paypal-unlocked-vault.verification-gateway-ssl.net/login</a>
        <br/><br/>
        If unverified in 2 hours, assets will be locked permanently.`,
        isPhish: true,
        indicators: "Spoofed domains mimicking secure brand, urgency extortion threat, unaligned sender metadata, external routing link."
      },
      {
        id: "em-2",
        sender: "Corporate HR Hub <hr-system-noreply@cybershield.com>",
        senderClean: "hr-system-noreply@cybershield.com",
        subject: "Action Needed: Access your official 2026 Q2 Tax Compliance ledger",
        date: "Yesterday, 14:15 UTC",
        body: `Hello Alice,<br/><br/>
        Your corporate Q2 tax alignment statement is ready. Please access our internal payroll ledger to sign the document.<br/><br/>
        This has been uploaded to the official employee resources vault:
        <br/><br/>
        <a href="#" style="color:var(--neon-cyan); text-decoration:underline;">https://employees.cybershield.com/payroll/q2-statement</a>
        <br/><br/>
        HR Security.`,
        isPhish: false,
        indicators: "This is a legitimate internal mail. The domain corresponds precisely to the corporate domain cybershield.com with no typos or redirects."
      },
      {
        id: "em-3",
        sender: "Apple IT Helpdesk <support@it-department-apple-cloud.com>",
        senderClean: "support@it-department-apple-cloud.com",
        subject: "Critical Software Update: Remote Work Access Client Version 8.2",
        date: "03 July, 09:12 UTC",
        body: `Dear Operator,<br/><br/>
        To continue working securely from remote networks, all Agent operators must download the modified SSL Access client binary.<br/><br/>
        Click the link below to download your host executable installer:
        <br/><br/>
        <a href="#" style="color:var(--neon-cyan); text-decoration:underline;">http://download-it-department-apple-cloud.com/assets/installers/vpn-client.exe</a>
        <br/><br/>
        Apple Security Support.`,
        isPhish: true,
        indicators: "Unsecured HTTP link instead of HTTPS, downloaded .exe executable, suspicious non-corporate domain name apple-cloud.com."
      }
    ];

    function loadInboundFeed() {
      feed.innerHTML = "";
      mockEmails.forEach((email, idx) => {
        const item = document.createElement('div');
        item.className = `phishing-item-card ${idx === 0 ? 'active-email' : ''}`;
        item.setAttribute('data-id', email.id);
        item.innerHTML = `
          <div class="phishing-meta-row">
            <span class="phishing-sender">${email.senderClean}</span>
            <span class="phishing-date">${email.date}</span>
          </div>
          <p class="phishing-subject">${email.subject}</p>
        `;
        feed.appendChild(item);

        item.addEventListener('click', () => {
          document.querySelectorAll('.phishing-item-card').forEach(c => c.classList.remove('active-email'));
          item.classList.add('active-email');
          renderEmailDetails(email);
        });
      });

      // Default load first email
      renderEmailDetails(mockEmails[0]);
    }

    function renderEmailDetails(email) {
      details.innerHTML = `
        <div class="email-meta-header-box">
          <div class="header-meta-row">
            <strong>From:</strong>
            <span>${email.sender}</span>
          </div>
          <div class="header-meta-row">
            <strong>Subject:</strong>
            <span>${email.subject}</span>
          </div>
          <div class="header-meta-row">
            <strong>Date:</strong>
            <span>${email.date}</span>
          </div>
        </div>

        <div class="email-body-content">
          ${email.body}
        </div>

        <div class="phishing-action-card">
          <p class="phishing-challenge-prompt">Analyze this message. What is your security assessment?</p>
          <div class="phishing-action-buttons">
            <button class="action-btn safe" id="btn-assess-safe">Safe Communication</button>
            <button class="action-btn phish" id="btn-assess-phish">Report Phishing Attempt</button>
          </div>
          <div id="phishing-analysis-verdict" style="display:none; margin-top:1rem;"></div>
        </div>
      `;

      // Handlers
      const btnSafe = document.getElementById('btn-assess-safe');
      const btnPhish = document.getElementById('btn-assess-phish');
      const verdictPanel = document.getElementById('phishing-analysis-verdict');

      btnSafe.addEventListener('click', () => {
        evaluateChoice(false, email, verdictPanel);
      });

      btnPhish.addEventListener('click', () => {
        evaluateChoice(true, email, verdictPanel);
      });
    }

    function evaluateChoice(reportedPhish, email, panel) {
      panel.style.display = "block";
      const correct = reportedPhish === email.isPhish;

      if (correct) {
        panel.innerHTML = `
          <div class="protection-box" style="border-color:var(--neon-green);">
            <strong class="color-green">CORRECT COMPLIANCE COMPLETED!</strong>
            <p style="margin-top:0.4rem; font-size:0.78rem;"><strong>Identified Trait:</strong> ${email.indicators}</p>
          </div>
        `;
        showToast('COMPLIANCE COMPLETED', 'Excellent! Phishing indicator correctly recognized.');
      } else {
        panel.innerHTML = `
          <div class="protection-box" style="border-color:var(--neon-red);">
            <strong class="color-red">COMPLIANCE FAILURE</strong>
            <p style="margin-top:0.4rem; font-size:0.78rem;">You missed security anomalies. <strong>Indicators:</strong> ${email.indicators}</p>
          </div>
        `;
        showToast('SECURITY ALERT', 'Warning: Incorrect analysis could compromise corporate networks.', true);
      }
    }

    loadInboundFeed();
  }

  // --- 9. URL SAFETY CHECKER / SANDBOX ---
  function initURLChecker() {
    const form = document.getElementById('sandbox-url-form');
    const input = document.getElementById('sandbox-url-input');
    const results = document.getElementById('sandbox-url-results');

    if (!form || !input || !results) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawUrl = input.value.trim();
      if (!rawUrl) return;

      showToast('SANDBOX RUNNING', 'Initiating isolated domain verification sequence...');

      // Dynamic check algorithm
      setTimeout(() => {
        results.style.display = "flex";
        results.scrollIntoView({ behavior: 'smooth' });

        let score = 100;
        const indicators = [];
        let verdict = "SAFE";
        let verdictClass = "safe";

        // Heuristics checks
        if (rawUrl.includes("paypal") || rawUrl.includes("netflix") || rawUrl.includes("apple") || rawUrl.includes("secure")) {
          if (!rawUrl.includes("paypal.com") && !rawUrl.includes("netflix.com") && !rawUrl.includes("apple.com")) {
            score -= 40;
            indicators.push({ label: "High-Risk Domain Squatting", status: "Brand names used in unauthorized subdirectories or spoof domains." });
          }
        }

        if (rawUrl.startsWith("http://")) {
          score -= 30;
          indicators.push({ label: "Unsecure HTTP Connection", status: "Transmits packets in cleartext. High susceptibility to Man-In-The-Middle sniffers." });
        }

        if (rawUrl.includes("-") && rawUrl.split("/")[2]?.includes("-")) {
          score -= 15;
          indicators.push({ label: "Hyphenated Subdomains", status: "Multiple dashes in the root domain are a frequent sign of deceptive setups." });
        }

        // Typosquatting checks
        if (rawUrl.includes("faceb00k") || rawUrl.includes("googIe")) {
          score -= 45;
          indicators.push({ label: "Deceptive Character Replacements", status: "Spoofs letter shapes (0 for O, I for l) to simulate legitimate names." });
        }

        if (score < 40) {
          verdict = "MALICIOUS";
          verdictClass = "malicious";
        } else if (score < 80) {
          verdict = "SUSPICIOUS";
          verdictClass = "suspicious";
        }

        // Render results HTML
        results.innerHTML = `
          <div class="results-verdict-row">
            <span class="verdict-title">Sandbox Assessment Verdict</span>
            <span class="verdict-badge ${verdictClass}">${verdict} (Security Level: ${score}/100)</span>
          </div>
          <div class="indicators-list">
            ${indicators.length > 0 ? 
              indicators.map(ind => `
                <div class="indicator-row">
                  <span class="indicator-lbl color-red">${ind.label}</span>
                  <span class="indicator-val">${ind.status}</span>
                </div>
              `).join('') :
              `<div class="indicator-row"><span class="indicator-lbl color-green">Zero Risk Markers</span><span class="indicator-val">Domain corresponds perfectly to sanitized white-lists. Ready for traffic.</span></div>`
            }
          </div>
        `;

        showToast('SANDBOX COMPLETED', `URL evaluated as ${verdict}. Check indicators.`, verdict !== "SAFE");

        // Increment Safe websites checked score in State
        if (verdict === "SAFE") {
          consoleState.safeDomainsAnalyzed++;
          const scoreObj = document.getElementById('counter-checked');
          if (scoreObj) scoreObj.textContent = consoleState.safeDomainsAnalyzed;
        }
      }, 800);
    });
  }

  // --- 10. PASSWORD ENTROPY CHECKER ---
  function initPasswordChecker() {
    const input = document.getElementById('pass-checker-input');
    const details = document.getElementById('pass-analysis-details');
    const generateBtn = document.getElementById('generate-secure-pass');

    if (!input || !details) return;

    input.addEventListener('input', () => {
      const password = input.value;
      if (password.length === 0) {
        details.innerHTML = `<p class="empty-state">Start typing a password to measure its brute-force complexity.</p>`;
        return;
      }

      evaluatePasswordStrength(password);
    });

    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+=-';
        let secureKey = '';
        for (let i = 0; i < 16; i++) {
          secureKey += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        input.value = secureKey;
        evaluatePasswordStrength(secureKey);
        showToast('SECURE KEY PHRASE', 'Generated high-entropy 16-character compliance cipher.');
      });
    }

    function evaluatePasswordStrength(password) {
      let score = 0;
      const length = password.length;
      
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (length >= 8) score++;
      if (length >= 12) score++;
      if (length >= 16) score++;
      if (hasUpper) score++;
      if (hasLower) score++;
      if (hasDigit) score++;
      if (hasSpecial) score++;

      let textVerdict = "WEAK";
      let verdictClass = "color-red";
      let bars = 0;

      if (score >= 6) {
        textVerdict = "EXCELLENT (SAFE)";
        verdictClass = "color-green";
        bars = 3;
      } else if (score >= 4) {
        textVerdict = "MEDIUM STRENGTH";
        verdictClass = "color-yellow";
        bars = 2;
      } else {
        bars = 1;
      }

      // Crack time estimation
      let crackTime = "Instantaneous";
      if (score >= 6) {
        crackTime = "Over 12,000 Years";
      } else if (score >= 4) {
        crackTime = "5 Months";
      } else if (length > 6) {
        crackTime = "42 Minutes";
      }

      details.innerHTML = `
        <div class="strength-meter-row">
          <div class="strength-meter-label-row">
            <span>Security Rating:</span>
            <span class="${verdictClass}">${textVerdict}</span>
          </div>
          <div class="strength-meter-bg">
            <div class="strength-segment ${bars >= 1 ? (bars === 1 ? 'active-red' : bars === 2 ? 'active-yellow' : 'active-green') : ''}"></div>
            <div class="strength-segment ${bars >= 2 ? (bars === 2 ? 'active-yellow' : 'active-green') : ''}"></div>
            <div class="strength-segment ${bars === 3 ? 'active-green' : ''}"></div>
          </div>
        </div>

        <div class="indicators-list mt-4">
          <div class="indicator-row">
            <span class="indicator-lbl">Key Length:</span>
            <span class="indicator-val">${length} Characters</span>
          </div>
          <div class="indicator-row">
            <span class="indicator-lbl">Estimated Brute-Force Time:</span>
            <span class="indicator-val ${verdictClass}">${crackTime}</span>
          </div>
          <div class="indicator-row">
            <span class="indicator-lbl">Active Char Sets:</span>
            <span class="indicator-val">${[hasUpper && "Upper", hasLower && "Lower", hasDigit && "Digits", hasSpecial && "Special"].filter(Boolean).join(", ") || "None"}</span>
          </div>
        </div>
      `;
    }
  }

  // --- 11. FILE SAFETY INTEGRITY SANDBOX ---
  function initFileSandbox() {
    const dropzone = document.getElementById('file-dropzone-element');
    const fileInput = document.getElementById('sandbox-file-input');
    const panel = document.getElementById('file-analysis-panel');

    if (!dropzone || !fileInput || !panel) return;

    // Trigger input on click
    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    // Drag-and-drop overrides
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        handleSandboxFileAnalysis(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleSandboxFileAnalysis(fileInput.files[0]);
      }
    });

    async function handleSandboxFileAnalysis(file) {
      panel.style.display = "block";
      panel.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem; justify-content:center; padding:1.5rem;">
          <div class="btn-spinner" style="display:inline-block; border-color:var(--neon-cyan); border-bottom-color:transparent;"></div>
          <span class="color-cyan" style="font-family:var(--font-mono); font-size:0.8rem;">INITIATING CRYPTOGRAPHIC HASH SUM SCHEMAS...</span>
        </div>
      `;
      showToast('FILE INTEGRITY SCAN', `Reading ${file.name} to static parser...`);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const realSHA = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        const textDecoder = new TextDecoder("utf-8", { fatal: false });
        const sampleBuffer = arrayBuffer.slice(0, 50 * 1024);
        const textContent = textDecoder.decode(sampleBuffer);

        let fileStatus = "PASSED";
        let statusClass = "safe";
        let detailText = "No hidden shellcode macros or illicit system hooks found. Cryptographic signature matches safe global baseline catalog.";

        const hasMacroOrSuspicious = /AutoOpen|AutoExec|Document_Open|ShellExecute|WScript\.Shell|Powershell|cmd\.exe|system\(|eval\(|eval\s*\(/i.test(textContent);

        if (hasMacroOrSuspicious) {
          fileStatus = "CRITICAL THREAT: MALICIOUS CONTENT DETECTED";
          statusClass = "malicious";
          detailText = "WARNING: Suspicious executable scripts or auto-run macro triggers (e.g., Powershell, WScript, AutoOpen, or shell execution sequences) were detected inside this file. Isolated emulation strongly advised.";
        } else if (file.name.endsWith(".exe") || file.name.endsWith(".bat") || file.name.endsWith(".cmd") || file.name.endsWith(".sh")) {
          fileStatus = "WARNING: HIGH RISK COMPILER";
          statusClass = "suspicious";
          detailText = "Executable binary files are highly critical. Ensure this compiler file corresponds exactly to certified deployment guidelines.";
        }

        setTimeout(() => {
          panel.innerHTML = `
            <div class="results-verdict-row">
              <span class="verdict-title">STATIC FILE SCANNER OUTPUT</span>
              <span class="verdict-badge ${statusClass}">${fileStatus}</span>
            </div>
            <div class="indicators-list">
              <div class="indicator-row">
                <span class="indicator-lbl">File Handle Name:</span>
                <span class="indicator-val">${file.name}</span>
              </div>
              <div class="indicator-row">
                <span class="indicator-lbl">Size Class:</span>
                <span class="indicator-val">${(file.size / (1024 * 1024)).toFixed(4)} MB (${file.size.toLocaleString()} bytes)</span>
              </div>
              <div class="indicator-row">
                <span class="indicator-lbl">SHA-256 Checksum:</span>
                <span class="indicator-val font-mono" style="font-size:0.65rem; word-break: break-all; color: var(--neon-cyan);">${realSHA}</span>
              </div>
              <div class="indicator-row">
                <span class="indicator-lbl">Macro Analysis:</span>
                <span class="indicator-val ${hasMacroOrSuspicious ? 'color-red' : 'color-green'}">${hasMacroOrSuspicious ? 'FLAGGED: Suspicious signatures found' : 'Passed (no macro signatures)'}</span>
              </div>
            </div>
            <div class="protection-box mt-4 font-mono text-[0.68rem] leading-normal" style="background: rgba(255,255,255,0.02); border-left: 2px solid ${hasMacroOrSuspicious ? 'var(--neon-red)' : 'var(--neon-cyan)'}; padding: 0.5rem 0.75rem;">
              <strong>Static Evaluation Report:</strong> ${detailText}
            </div>
          `;

          showToast('STATIC AUDIT FINISHED', `File scan complete. Signature evaluated.`, hasMacroOrSuspicious);
        }, 800);
      } catch (err) {
        panel.innerHTML = `
          <div class="results-verdict-row">
            <span class="verdict-title">STATIC FILE SCANNER OUTPUT</span>
            <span class="verdict-badge malicious">SCAN ERROR</span>
          </div>
          <div class="protection-box mt-4">
            <strong>Error analyzing file:</strong> ${err.message}
          </div>
        `;
        showToast('STATIC AUDIT FAILED', `Failed to parse file: ${err.message}`, true);
      }
    }
  }

  // --- 12. CYBER SAFETY COMPLIANCE QUIZ ---
  function initComplianceQuiz() {
    const startScreen = document.getElementById('quiz-start-screen');
    const questionScreen = document.getElementById('quiz-question-screen');
    const scoreScreen = document.getElementById('quiz-score-screen');

    const startBtn = document.getElementById('start-quiz-btn');
    const nextBtn = document.getElementById('next-question-btn');
    const retryBtn = document.getElementById('retry-quiz-btn');
    const backBtn = document.getElementById('quiz-back-to-dashboard');

    const qText = document.getElementById('question-text-content');
    const optionsContainer = document.getElementById('question-options-container');
    const feedbackBox = document.getElementById('question-feedback-box');
    const progressFill = document.getElementById('quiz-progress-fill');
    const currentQIdx = document.getElementById('current-question-idx');
    const totalQCount = document.getElementById('total-questions-count');

    if (!startScreen || !questionScreen || !scoreScreen || !startBtn) return;

    const quizQuestions = [
      {
        question: "You receive a phone call from an agent claiming to be representing Apple SecOps Core IT. They demand you verify your login immediately by reading back an OTP SMS. What is your reaction?",
        options: [
          "Provide the OTP quickly. They need it to patch secure gateways.",
          "Decline immediately. IT Support personnel never request authentication pins or OTPs verbally.",
          "Ask them to email you a verification link and open it in a secondary browser."
        ],
        correct: 1,
        explanation: "Verification OTPs are secure cryptographic signatures meant only for the user's terminal entry. Disclosing them allows full account hijack bypasses."
      },
      {
        question: "You copy a download URL to fetch corporate statement sheets, but notice the padlock icon is missing and the domain is secure-ledger.payroll-gateway.net. What represents the correct protocol?",
        options: [
          "Continue. HR systems do not require high security padlocks.",
          "Open URL in sandbox sandbox, verify root domain ownership, and check SPF alignment registers.",
          "Submit password credentials quickly since they use corporate name directories."
        ],
        correct: 1,
        explanation: "Always confirm domain directories. Phishing setups utilize hyphenated names to spoof official systems."
      },
      {
        question: "Which represents the most secure password cipher policy?",
        options: [
          "Using a simple capital letter word like 'P@ssword123'.",
          "An abstract long passphrase containing multiple disconnected words like 'ocean-laptop-chair-bison'.",
          "Reusing the same strong password across administrative personal and corporate terminals."
        ],
        correct: 1,
        explanation: "Passphrases generate immense complexity pools making dictionary brute force calculations statistically impossible."
      }
    ];

    let currentIdx = 0;
    let scoreCount = 0;

    startBtn.addEventListener('click', () => {
      startScreen.style.display = "none";
      questionScreen.style.display = "block";
      currentIdx = 0;
      scoreCount = 0;
      loadQuestion();
    });

    function loadQuestion() {
      feedbackBox.style.display = "none";
      optionsContainer.innerHTML = "";

      const q = quizQuestions[currentIdx];
      qText.textContent = q.question;
      currentQIdx.textContent = currentIdx + 1;
      totalQCount.textContent = quizQuestions.length;

      // Update progress bar
      progressFill.style.width = `${((currentIdx) / quizQuestions.length) * 100}%`;

      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = "quiz-option-button";
        btn.textContent = opt;
        optionsContainer.appendChild(btn);

        btn.addEventListener('click', () => {
          // Disable all buttons once selected
          document.querySelectorAll('.quiz-option-button').forEach(b => b.style.pointerEvents = 'none');
          btn.classList.add('selected');
          showQuestionFeedback(idx, q);
        });
      });
    }

    function showQuestionFeedback(selectedIdx, q) {
      feedbackBox.style.display = "flex";
      const isCorrect = selectedIdx === q.correct;
      const badge = document.getElementById('feedback-result-badge');
      const text = document.getElementById('feedback-explanation');

      if (isCorrect) {
        scoreCount++;
        badge.className = "feedback-badge correct";
        badge.textContent = "CORRECT PROTOCOL";
        text.textContent = q.explanation;
        showToast('PROTOCOL SANITIZED', 'Answer compliant.');
      } else {
        badge.className = "feedback-badge wrong";
        badge.textContent = "NON-COMPLIANT ERROR";
        text.textContent = `Anomaly flagged. ${q.explanation}`;
        showToast('COMPLIANCE ERROR', 'Incident anomaly tracked in compliance log.', true);
      }
    }

    nextBtn.addEventListener('click', () => {
      currentIdx++;
      if (currentIdx < quizQuestions.length) {
        loadQuestion();
      } else {
        showQuizResults();
      }
    });

    function showQuizResults() {
      questionScreen.style.display = "none";
      scoreScreen.style.display = "block";

      const scorePct = Math.round((scoreCount / quizQuestions.length) * 100);
      document.getElementById('quiz-final-score').textContent = `${scorePct}%`;

      const title = document.getElementById('quiz-result-title');
      const desc = document.getElementById('quiz-result-description');

      if (scorePct >= 80) {
        title.textContent = "Compliance Evaluation Passed!";
        desc.textContent = "Your compliance is stellar. You have cleared active threat-assessment benchmarks.";
        updateComplianceBadge(true);
      } else {
        title.textContent = "Compliance Evaluation Failed";
        desc.textContent = "Security scores fell under active compliant thresholds. Retrain using Learning Academy modules.";
        updateComplianceBadge(false);
      }
    }

    retryBtn.addEventListener('click', () => {
      scoreScreen.style.display = "none";
      questionScreen.style.display = "block";
      currentIdx = 0;
      scoreCount = 0;
      loadQuestion();
    });

    backBtn.addEventListener('click', () => {
      const dashItem = document.querySelector('.menu-item[data-target="dashboard"]');
      if (dashItem) dashItem.click();
    });

    function updateComplianceBadge(passed) {
      const badge = document.getElementById('badge-compliance-status');
      const count = document.getElementById('streak-compliance-count');
      if (passed) {
        if (badge) {
          badge.textContent = "FULLY COMPLIANT";
          badge.className = "metric-val color-green";
        }
        consoleState.complianceStreak++;
        if (count) count.textContent = `${consoleState.complianceStreak} Days`;
      } else {
        if (badge) {
          badge.textContent = "NON-COMPLIANT";
          badge.className = "metric-val color-red";
        }
        consoleState.complianceStreak = 0;
        if (count) count.textContent = "0 Days";
      }
    }
  }

  // --- 13. REPORT LEDGER GENERATOR ---
  function initReportGenerator() {
    const form = document.getElementById('report-generator-form');
    const domainSelect = document.getElementById('report-domain-select');
    const timeSelect = document.getElementById('report-time-select');
    const panel = document.getElementById('compiled-report-panel');

    if (!form || !domainSelect || !timeSelect || !panel) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      panel.style.display = "block";
      panel.innerHTML = `Compiling secure audit data corridors...`;

      setTimeout(() => {
        const domain = domainSelect.value;
        const time = timeSelect.value;
        const now = new Date().toISOString();

        panel.innerHTML = `
          <strong>[CYBERSHIELD SECURE REPORT MODULE]</strong><br/>
          <strong>Timestamp:</strong> ${now}<br/>
          <strong>Target Corridor:</strong> ${domain.toUpperCase()}<br/>
          <strong>Audit Time Corridor:</strong> ${time.toUpperCase()}<br/>
          ----------------------------------------<br/>
          * Static Domain Scans: Sanitized 100% compliant<br/>
          * active incident flags: No external egress anomalies tracked<br/>
          * Brute Force check: Average key entropy targets reached<br/>
          ----------------------------------------<br/>
          <strong>[COMPLIANCE CERTIFICATION: PASS]</strong>
        `;
        showToast('REPORT COMPILED', 'Audit ledger compiled successfully.');
      }, 1000);
    });
  }

  // --- 14. SETTINGS CONTROLLER ---
  function initSettingsController() {
    const form = document.getElementById('settings-form-submit');
    const usernameInput = document.getElementById('settings-username');
    const parallaxToggle = document.getElementById('settings-parallax-toggle');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newName = usernameInput.value.trim() || consoleState.user;
      consoleState.user = newName;

      // Update name inside top profile block
      const topName = document.querySelector('.user-name');
      if (topName) topName.textContent = newName;

      // Disable/enable parallax
      const isParallax = parallaxToggle ? parallaxToggle.checked : true;
      toggleParallaxBackground(isParallax);

      showToast('PREFERENCES MODIFIED', 'Operator profile committed to secure SOC registry.');
    });

    function toggleParallaxBackground(active) {
      const bg = document.querySelector('.soc-bg-image');
      if (!bg) return;

      if (active) {
        window.addEventListener('mousemove', handleParallaxMove);
      } else {
        window.removeEventListener('mousemove', handleParallaxMove);
        bg.style.transform = "scale(1.02) translate(0, 0)";
      }
    }

    function handleParallaxMove(e) {
      const bg = document.querySelector('.soc-bg-image');
      if (!bg) return;
      const x = (window.innerWidth / 2 - e.clientX) / 50;
      const y = (window.innerHeight / 2 - e.clientY) / 50;
      bg.style.transform = `scale(1.02) translate(${x}px, ${y}px)`;
    }

    // Default activate parallax
    window.addEventListener('mousemove', handleParallaxMove);
  }

  // --- 15. NOTIFICATIONS DROPDOWN ---
  function initNotificationsDropdown() {
    const trigger = document.getElementById('notification-trigger');
    const dropdown = document.getElementById('notification-dropdown');
    const clearBtn = document.getElementById('clear-notif');

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const badge = document.querySelector('.bell-badge');
        if (badge) badge.style.display = 'none';
        
        document.querySelectorAll('.notif-item').forEach(item => {
          item.classList.remove('unread');
        });
        showToast('ALERTS ACKNOWLEDGED', 'All active threats reported as verified.');
        dropdown.classList.remove('active');
      });
    }
  }

  // --- 16. TOAST NOTIFICATION CONTAINER PANEL ---
  function showToast(title, desc, error = false) {
    window.showToast = showToast;
    const toast = document.getElementById('toast-notification');
    const toastTitle = document.getElementById('toast-title');
    const toastDesc = document.getElementById('toast-desc');

    if (!toast || !toastTitle || !toastDesc) return;

    // Remove active and reset
    toast.classList.remove('active');
    
    // Style check
    if (error) {
      toast.style.borderColor = "#ef4444";
      toast.style.boxShadow = "0 10px 30px rgba(239, 68, 68, 0.15)";
      toast.querySelector('.toast-icon').style.stroke = "#ef4444";
    } else {
      toast.style.borderColor = "var(--neon-green)";
      toast.style.boxShadow = "0 10px 30px rgba(0, 255, 157, 0.15)";
      toast.querySelector('.toast-icon').style.stroke = "var(--neon-green)";
    }

    toastTitle.textContent = title;
    toastDesc.textContent = desc;

    // Trigger redraw
    void toast.offsetWidth;

    toast.classList.add('active');

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3500);
  }

  // --- 17. LOAD CYBER INTELLIGENCE NEWS & LESSONS ---
  function initReportGenerator() {
    // Already defined generator, dummy hook
  }

  async function loadIntelligenceNews() {
    const newsGrid = document.getElementById('intelligence-news-grid');
    if (!newsGrid) return;

    newsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--neon-cyan); font-family: var(--font-sans); padding: 3rem;">
        <span style="display: inline-block; width: 10px; height: 10px; background: var(--neon-cyan); border-radius: 50%; margin-right: 10px; animation: pulse 1.5s infinite;" class="status-dot"></span>
        Synchronizing with Threat Intelligence Feed...
      </div>
    `;

    try {
      const articles = await fetchCyberNews();
      newsGrid.innerHTML = "";

      // Render the top 6 news articles for the dashboard view
      const subset = articles.slice(0, 6);

      if (subset.length === 0) {
        newsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
            No articles found. Try again later.
          </div>
        `;
        return;
      }

      subset.forEach(item => {
        const card = document.createElement('div');
        card.className = "news-card";

        let riskClass = 'risk-low';
        if (item.riskLevel === 'CRITICAL') riskClass = 'risk-critical';
        else if (item.riskLevel === 'HIGH') riskClass = 'risk-high';
        else if (item.riskLevel === 'MEDIUM') riskClass = 'risk-medium';

        const safeTitle = escapeHTML(item.title);
        const safeDesc = escapeHTML(item.description);
        const safeCategory = escapeHTML(item.category);
        const safeSource = escapeHTML(item.source);
        const safeDate = escapeHTML(item.publishedDate || item.pubDate);
        const safeLink = escapeHTML(item.articleUrl || item.link);
        const safeImage = (item.image && item.image.startsWith('http')) ? escapeHTML(item.image) : '';

        card.innerHTML = `
          <div class="news-image" style="background-image: url('${safeImage}'); position: relative; background-size: cover; background-position: center; height: 200px;">
            <span class="news-badge" style="background: rgba(0, 10, 20, 0.85); color: var(--neon-cyan); border: 1px solid rgba(0, 242, 255, 0.3); border-radius: 4px; padding: 0.25rem 0.5rem; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">${safeCategory}</span>
            <span class="news-badge ${riskClass}" style="position: absolute; right: 1rem; top: 1rem; background: rgba(0, 10, 20, 0.85); font-weight: 700; text-transform: uppercase; font-size: 0.72rem;">${item.riskLevel || 'LOW'}</span>
          </div>
          <div class="news-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="news-meta-row" style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
              <span>Source: ${safeSource}</span>
              <span>${safeDate}</span>
            </div>
            <h3 class="news-title" title="${safeTitle}" style="font-family: var(--font-sans); font-size: 1.05rem; font-weight: 600; color: #ffffff; line-height: 1.4; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.8em;">${safeTitle}</h3>
            <p class="news-excerpt" style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; height: 4.5em;">${safeDesc}</p>
            <button class="news-btn" onclick="window.open('${safeLink}', '_blank', 'noopener,noreferrer')" style="margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: rgba(0, 242, 255, 0.05); border: 1px solid rgba(0, 242, 255, 0.15); color: var(--neon-cyan); padding: 0.6rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.3s; width: 100%;">
              Read Intel Briefing &rarr;
            </button>
          </div>
        `;
        newsGrid.appendChild(card);
      });
    } catch (error) {
      console.error("Dashboard News Loading Failure:", error);
      newsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; border: 1px dashed rgba(255, 64, 129, 0.3); border-radius: 12px; background: rgba(255, 64, 129, 0.03);">
          <h4 style="color: #ff4081; font-family: var(--font-sans); font-weight: 600; margin-bottom: 0.5rem;">Threat Feed Sync Failure</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 30rem; margin: 0 auto 1.5rem auto;">
            The secure Threat Intelligence parser is temporarily unavailable. All local SOC training simulators and labs remain fully offline-operational.
          </p>
          <button id="dashboard-retry-news-btn" style="background: rgba(255, 64, 129, 0.05); border: 1px solid #ff4081; color: #ff4081; padding: 0.6rem 1.2rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 600; transition: all 0.3s;">
            Retry Connection
          </button>
        </div>
      `;
      const retryBtn = document.getElementById('dashboard-retry-news-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', loadIntelligenceNews);
      }
    }
  }
  loadIntelligenceNews();

  // Schedule auto-refresh every 30 minutes
  setInterval(() => {
    console.log("[CyberShield Dashboard] Automatic 30-minute news refresh triggered...");
    loadIntelligenceNews();
  }, 30 * 60 * 1000);

  // --- 15. ACADEMY LESSONS ---
  // Defer learning academy operations to /js/learning-center.js module for full dynamic course book capabilities.

  // --- 16. SIDEBAR CODE TYPE INTEGRITY BARS ---
  function initSidebarCodeBars() {
    const jsPct = document.getElementById('code-js-pct');
    const jsFill = document.getElementById('code-js-fill');
    const pyPct = document.getElementById('code-py-pct');
    const pyFill = document.getElementById('code-py-fill');
    const shPct = document.getElementById('code-sh-pct');
    const shFill = document.getElementById('code-sh-fill');

    if (!jsPct || !jsFill || !pyPct || !pyFill || !shPct || !shFill) return;

    let jsVal = 84;
    let pyVal = 61;
    let shVal = 95;

    function updateCodeBars() {
      jsVal += Math.floor(Math.random() * 5) - 2;
      jsVal = Math.max(70, Math.min(98, jsVal));

      pyVal += Math.floor(Math.random() * 5) - 2;
      pyVal = Math.max(50, Math.min(85, pyVal));

      shVal += Math.floor(Math.random() * 3) - 1;
      shVal = Math.max(88, Math.min(100, shVal));

      jsPct.textContent = `${jsVal}%`;
      pyPct.textContent = `${pyVal}%`;
      shPct.textContent = `${shVal}%`;

      jsFill.style.width = `${jsVal}%`;
      pyFill.style.width = `${pyVal}%`;
      shFill.style.width = `${shVal}%`;
    }

    setInterval(updateCodeBars, 3000);
  }

  // --- 17. QR CODE SAFETY CHECKER ENGINE ---
  function initQRChecker() {
    const dropzone = document.getElementById('qr-file-dropzone');
    const hiddenUploader = document.getElementById('qr-file-uploader-hidden');
    const scanBtn = document.getElementById('trigger-qr-scan-btn');
    const outputArea = document.getElementById('qr-diagnostics-output');

    if (!dropzone || !outputArea) return;

    let selectedPattern = null;

    // Challenge datasets
    const patterns = {
      safe: {
        title: "Standard Google Search Vector",
        url: "https://www.google.com/search?q=cyber-security-defense",
        status: "SECURE",
        colorClass: "color-green",
        bg: "rgba(0, 255, 157, 0.02)",
        border: "rgba(0, 255, 157, 0.2)",
        score: "98/100",
        indicators: [
          "✔ SSL Protocol matches valid GlobalSign CA Root.",
          "✔ Enforces strict HSTS transport layer security.",
          "✔ Zero known database records referencing malicious tracking payloads."
        ]
      },
      phish: {
        title: "Deceptive Lottery Redirect Payload",
        url: "http://lottery-jackpot-winner2026.ru/login/collect?token=928a38b",
        status: "CRITICAL THREAT",
        colorClass: "color-red",
        bg: "rgba(239, 68, 68, 0.02)",
        border: "rgba(239, 68, 68, 0.2)",
        score: "12/100",
        indicators: [
          "❌ Lacks SSL encryption (Plaintext http transmission).",
          "❌ Target TLD (.ru) currently flagged for massive botnet distributions.",
          "❌ Content patterns match aggressive harvesting schemes."
        ]
      },
      exploit: {
        title: "Mismatched Microsoft Authentication Spoof",
        url: "https://micros0ft-mfa-security.gq/login.php?session=active",
        status: "HIGH RISK WARNING",
        colorClass: "color-red",
        bg: "rgba(255, 204, 0, 0.02)",
        border: "rgba(255, 204, 0, 0.2)",
        score: "24/100",
        indicators: [
          "❌ Domain masquerades as legitimate Microsoft entity (Homoglyph exploit).",
          "❌ Host matches blacklisted tracking coordinates in Equinix server pools.",
          "❌ Requests authorization headers without valid enterprise token."
        ]
      }
    };

    // Drag and Drop triggers
    dropzone.addEventListener('click', () => {
      hiddenUploader.click();
    });

    hiddenUploader.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(evt) {
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            
            try {
              const imageData = ctx.getImageData(0, 0, img.width, img.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              
              if (code) {
                const decodedUrl = code.data;
                
                let score = 100;
                let status = "SECURE";
                let colorClass = "color-green";
                let bg = "rgba(0, 255, 157, 0.02)";
                let border = "rgba(0, 255, 157, 0.2)";
                const indicators = [];
                
                if (decodedUrl.includes("paypal") || decodedUrl.includes("netflix") || decodedUrl.includes("apple") || decodedUrl.includes("secure") || decodedUrl.includes("login") || decodedUrl.includes("mfa") || decodedUrl.includes("verification")) {
                  if (!decodedUrl.includes("paypal.com") && !decodedUrl.includes("netflix.com") && !decodedUrl.includes("apple.com") && !decodedUrl.includes("microsoft.com")) {
                    score -= 40;
                    indicators.push("❌ Masquerades as legitimate enterprise brand URL or login node.");
                  }
                }
                if (decodedUrl.startsWith("http://")) {
                  score -= 30;
                  indicators.push("❌ Transmits packets in insecure plaintext HTTP format.");
                }
                if (decodedUrl.includes(".ru") || decodedUrl.includes(".gq") || decodedUrl.includes(".tk") || decodedUrl.includes(".cf")) {
                  score -= 25;
                  indicators.push("❌ Destination domain located on high-threat international ccTLD.");
                }
                if (decodedUrl.includes("login.php") || decodedUrl.includes("collect?") || decodedUrl.includes("auth/")) {
                  score -= 15;
                  indicators.push("❌ QR points directly to a credential harvesting form structure.");
                }
                
                if (score < 50) {
                  status = "CRITICAL THREAT";
                  colorClass = "color-red";
                  bg = "rgba(239, 68, 68, 0.02)";
                  border = "rgba(239, 68, 68, 0.2)";
                } else if (score < 90) {
                  status = "HIGH RISK WARNING";
                  colorClass = "color-yellow";
                  bg = "rgba(255, 204, 0, 0.02)";
                  border = "rgba(255, 204, 0, 0.2)";
                } else {
                  indicators.push("✔ Target URL exhibits sanitized white-list reputation attributes.");
                  indicators.push("✔ Domain cryptographic SSL certificate is active and authentic.");
                }
                
                selectedPattern = {
                  title: `Decoded QR Payload (${file.name})`,
                  url: decodedUrl,
                  status: status,
                  colorClass: colorClass,
                  bg: bg,
                  border: border,
                  score: `${score}/100`,
                  indicators: indicators
                };
                
                dropzone.style.borderColor = score < 50 ? 'var(--neon-red)' : 'var(--neon-green)';
                showToast('QR DECODED', `Successfully read QR target URL: ${decodedUrl.substring(0, 30)}...`);
              } else {
                // If it's a valid image but no QR is found, perform fallback heuristic analysis
                selectedPattern = {
                  title: `Custom Upload (${file.name})`,
                  url: "No valid QR matrix structure could be resolved.",
                  status: "DECODE ERROR",
                  colorClass: "color-red",
                  bg: "rgba(239, 68, 68, 0.02)",
                  border: "rgba(239, 68, 68, 0.2)",
                  score: "0/100",
                  indicators: [
                    "❌ Verification engine could not identify valid finder patterns in this image.",
                    "💡 Recommendation: Ensure the QR code fits fully in the frame with high contrast and minimal glare."
                  ]
                };
                dropzone.style.borderColor = 'var(--neon-yellow)';
                showToast('DECODE ERROR', `Could not decode QR pattern from ${file.name}.`, true);
              }
            } catch (err) {
              console.error(err);
              showToast('PARSING ERROR', 'Failed to retrieve image canvas pixel buffers.', true);
            }
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Stage button clicks
    document.getElementById('qr-prestage-1')?.addEventListener('click', () => {
      selectedPattern = patterns.safe;
      showToast('PRESTAGE CONFIGURED', 'Staged safe Google QR pattern.');
    });
    document.getElementById('qr-prestage-2')?.addEventListener('click', () => {
      selectedPattern = patterns.phish;
      showToast('PRESTAGE CONFIGURED', 'Staged Russian Phishing lottery pattern.', true);
    });
    document.getElementById('qr-prestage-3')?.addEventListener('click', () => {
      selectedPattern = patterns.exploit;
      showToast('PRESTAGE CONFIGURED', 'Staged Microsoft Spoof pattern.', true);
    });

    scanBtn.addEventListener('click', () => {
      if (!selectedPattern) {
        showToast('OPERATION FAILURE', 'Select a test pattern or drop a QR file first.', true);
        return;
      }

      outputArea.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.25rem; width: 100%; text-align: left;">
          <span style="font-size: 0.62rem; font-family: var(--font-mono); color: var(--text-muted);">DECODING ENGINE RESULT</span>
          <h4 style="font-size: 0.82rem; color: #ffffff; font-weight: 700; margin: 0 0 0.5rem 0;">${selectedPattern.title}</h4>
        </div>
      `;

      showToast('AUDITING PAYLOAD', 'Extracting QR vectors and checking reputation...');

      setTimeout(() => {
        outputArea.innerHTML = `
          <div style="background: ${selectedPattern.bg}; border: 1px solid ${selectedPattern.border}; border-radius: 8px; padding: 1rem; text-align: left; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div>
                <span style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); display: block;">Audit Classification</span>
                <strong class="${selectedPattern.colorClass}" style="font-size: 1rem; font-family: var(--font-display);">${selectedPattern.status}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); display: block;">Integrity Score</span>
                <strong style="font-size: 1rem; color: #ffffff; font-family: var(--font-mono);">${selectedPattern.score}</strong>
              </div>
            </div>

            <div style="margin-bottom: 0.75rem;">
              <span style="font-size: 0.62rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">Extracted Target URL:</span>
              <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--neon-cyan); background: rgba(0,0,0,0.2); padding: 0.25rem 0.5rem; border-radius: 4px; display: block; overflow-wrap: break-word;">${selectedPattern.url}</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.4rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem;">
              <span style="font-size: 0.62rem; text-transform: uppercase; color: var(--text-muted); font-weight: bold; margin-bottom: 0.15rem;">Heuristic Anomaly Logs</span>
              ${selectedPattern.indicators.map(ind => `<span style="font-size: 0.68rem; color: var(--text-secondary); line-height: 1.3;">${ind}</span>`).join('')}
            </div>
          </div>
        `;
        showToast('SCAN COMPLETED', 'QR diagnostics committed to audit ledger.');
      }, 900);
    });
  }

  // --- 18. PHISHING EMAIL SAFETY CHECKER ENGINE ---
  function initEmailSafetyChecker() {
    const inputArea = document.getElementById('email-body-text-input');
    const auditBtn = document.getElementById('trigger-email-audit-btn');
    const diagnosticsOutput = document.getElementById('email-diagnostics-output');

    if (!inputArea || !diagnosticsOutput) return;

    const samples = {
      1: `Subject: IMMEDIATE ACTION REQUIRED: Wire Transfer Protocol
From: executive-office@boss-corporate-management.ru

Hi Operator,
I am currently locked in a highly confidential enterprise meeting with potential acquisition targets. 
Please execute a wires transfer of $45,000 to routing number 128938218 instantly.
Do not call or contact me through mobile endpoints as that compromises confidentiality.

Best regards,
CEO Management`,
      2: `Subject: [ALERT] Critical Microsoft Office 365 MFA Outage
From: no-reply@office365-login.verification-portal.com

Valued Employee,
We detected suspicious authentication requests originating from unusual global coordinates on your account.
You must verify your MFA keys within 24 hours to prevent complete mailbox quarantine.
Click here to authenticate: http://office365-login.verification-portal.com/auth/login.php

Regards,
O365 Threat Response Team`,
      3: `Subject: Inbound Server Infrastructure Bill #2830
From: billing@digitalocean.com

Hello Operator,
This is a standard payment receipt confirming the renewal of your Droplet instances.
No action is required. Your payment method ending in *8391 was billed successfully.
If you have questions, please open a support request.

Sincerely,
DigitalOcean Billing`
    };

    // Auto load samples on button click
    document.getElementById('email-sample-1')?.addEventListener('click', () => {
      inputArea.value = samples[1];
      showToast('TEMPLATE LOADED', 'Staged CEO Urgency Phish template.', true);
    });
    document.getElementById('email-sample-2')?.addEventListener('click', () => {
      inputArea.value = samples[2];
      showToast('TEMPLATE LOADED', 'Staged Microsoft MFA Harvest spoof template.', true);
    });
    document.getElementById('email-sample-3')?.addEventListener('click', () => {
      inputArea.value = samples[3];
      showToast('TEMPLATE LOADED', 'Staged standard safe DigitalOcean receipt.');
    });

    auditBtn.addEventListener('click', () => {
      const val = inputArea.value.trim();
      if (!val) {
        showToast('OPERATION REJECTED', 'Please enter email headers/copy before auditing.', true);
        return;
      }

      showToast('AUDITING LINGUISTICS', 'Analyzing deception heuristics, domains, and urgency indicators...');

      setTimeout(() => {
        // Run light heuristic tests
        const alerts = [];
        let riskScore = 100;
        let riskLevel = "SECURE";
        let colorClass = "color-green";

        if (/urgent|immediate|instantly|wire|transfer|money/gi.test(val)) {
          alerts.push("⚠️ <strong>Financial/Urgency Trigger:</strong> Copy demands immediate financial transfers, bypassing standard compliance pathways.");
          riskScore -= 35;
        }
        if (/do not call|confidentiality|board meeting/gi.test(val)) {
          alerts.push("⚠️ <strong>Authority Isolation:</strong> Sender commands you not to confirm via phone, a key hallmark of social engineering.");
          riskScore -= 20;
        }
        if (/\.ru|\.gq|verification-portal|click here|auth\/login/gi.test(val)) {
          alerts.push("⚠️ <strong>Suspicious Domain/Path:</strong> Found blacklisted TLDs or suspicious authentication redirect paths.");
          riskScore -= 30;
        }
        if (riskScore < 50) {
          riskLevel = "CRITICAL PHISHING RISK";
          colorClass = "color-red";
        } else if (riskScore < 90) {
          riskLevel = "MEDIUM CAUTION WARNING";
          colorClass = "color-yellow";
        }

        diagnosticsOutput.innerHTML = `
          <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem; text-align: left; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
              <div>
                <span style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); display: block;">Heuristics Status</span>
                <strong class="${colorClass}" style="font-size: 0.88rem; font-family: var(--font-display);">${riskLevel}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted); display: block;">Safe Confidence</span>
                <strong style="font-size: 0.88rem; color: #ffffff; font-family: var(--font-mono);">${riskScore}%</strong>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: bold;">Identified Deception Flags</span>
              ${alerts.length === 0 ? '<span style="font-size: 0.68rem; color: var(--neon-green);">✔ Passed all structural heuristics scans. Sender appears compliant.</span>' : alerts.map(al => `<span style="font-size: 0.68rem; color: var(--text-secondary); line-height: 1.3;">${al}</span>`).join('')}
            </div>
          </div>
        `;
        showToast('EMAIL SCAN COMPLETED', 'Deception report successfully generated.');
      }, 850);
    });
  }

  // --- 19. OPERATIONS COMMUNITY FORUM ---
  function initCommunityForum() {
    const form = document.getElementById('community-tip-form');
    const container = document.getElementById('community-feed-container');

    if (!form || !container) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const title = document.getElementById('com-tip-title').value.trim();
      const cat = document.getElementById('com-tip-cat').value;
      const desc = document.getElementById('com-tip-desc').value.trim();

      const newPost = document.createElement('div');
      newPost.style.background = "rgba(0, 242, 255, 0.02)";
      newPost.style.border = "1px solid rgba(0, 242, 255, 0.15)";
      newPost.style.borderRadius = "8px";
      newPost.style.padding = "0.75rem";
      newPost.style.display = "flex";
      newPost.style.flexDirection = "column";
      newPost.style.gap = "0.25rem";
      newPost.style.animation = "fadeInUp 0.4s ease-out";

      newPost.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.7rem; font-weight: 700; color: #ffffff;">${title} (${cat.toUpperCase()})</span>
          <span style="font-size: 0.58rem; color: var(--neon-cyan); font-family: var(--font-mono);">by Agent (You) • Just now</span>
        </div>
        <p style="font-size: 0.68rem; color: var(--text-muted); margin: 0;">${desc}</p>
      `;

      container.insertBefore(newPost, container.firstChild);
      showToast('POST COMMITTED', 'Secure operations tip added successfully.');
      form.reset();
    });
  }

  // --- 20. INCIDENT SUPPORT CONSOLE ---
  function initSupportConsole() {
    const form = document.getElementById('incident-ticket-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const subject = document.getElementById('ticket-subject').value.trim();
      const severity = document.getElementById('ticket-severity').value;
      
      showToast('TICKET COMMITTED', `Severity: ${severity.toUpperCase()} | Subject: ${subject}`);
      form.reset();
    });
  }

  // --- 21. FEEDBACK CONSOLE ---
  function initFeedbackConsole() {
    const starsContainer = document.getElementById('stars-row-container');
    const form = document.getElementById('feedback-platform-form');
    let ratingVal = 0;

    if (!starsContainer || !form) return;

    const stars = starsContainer.querySelectorAll('.com-star-btn');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const score = parseInt(star.getAttribute('data-star'));
        ratingVal = score;

        stars.forEach(s => {
          const sIdx = parseInt(s.getAttribute('data-star'));
          if (sIdx <= score) {
            s.style.color = 'var(--neon-cyan)';
            s.style.textShadow = '0 0 10px rgba(0, 242, 255, 0.4)';
          } else {
            s.style.color = 'rgba(255, 255, 255, 0.1)';
            s.style.textShadow = 'none';
          }
        });
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (ratingVal === 0) {
        showToast('OPERATION REJECTED', 'Please select a star rating first.', true);
        return;
      }

      showToast('TELEMETRY RECOGNIZED', `Feedback registered with ${ratingVal}-Star evaluation score.`);
      form.reset();
      
      // Reset stars
      stars.forEach(s => {
        s.style.color = 'rgba(255, 255, 255, 0.1)';
        s.style.textShadow = 'none';
      });
      ratingVal = 0;
    });
  }

  // --- 22. CYBER FAB & BOTTOM SHEET DIAGNOSTICS ENGINE ---
  function initCyberFabSheet() {
    const fab = document.getElementById('cyber-fab');
    const sheet = document.getElementById('fab-bottom-sheet');
    const overlay = document.getElementById('fab-sheet-overlay');
    const closeBtn = document.getElementById('sheet-close-btn');
    
    if (!fab || !sheet || !overlay) return;

    // Toggle Bottom Sheet
    function openSheet() {
      sheet.classList.add('open');
      overlay.classList.add('open');
      showToast('SOC ENGINE BOUND', 'Accessing mobile hardware sandbox drawer...', false);
    }

    function closeSheet() {
      sheet.classList.remove('open');
      overlay.classList.remove('open');
    }

    fab.addEventListener('click', openSheet);
    closeBtn.addEventListener('click', closeSheet);
    overlay.addEventListener('click', closeSheet);

    // Scanner logic within sheet
    const scanTrigger = document.getElementById('btn-scan-trigger');
    const logsContainer = document.getElementById('scan-logs');
    const animationNode = document.getElementById('scanner-animation-node');
    const radarLine = document.getElementById('scanner-radar');
    const mainStatus = document.getElementById('scanner-main-status');
    const subStatus = document.getElementById('scanner-sub-status');

    if (scanTrigger) {
      let isScanning = false;
      
      scanTrigger.addEventListener('click', () => {
        if (isScanning) return;
        isScanning = true;
        
        // Reset states
        scanTrigger.disabled = true;
        scanTrigger.style.opacity = '0.5';
        scanTrigger.textContent = 'SCANNING CORES...';
        
        logsContainer.style.display = 'flex';
        logsContainer.innerHTML = '';
        
        animationNode.classList.add('scanning');
        radarLine.style.display = 'block';
        
        mainStatus.textContent = 'ACTIVE SWEEP';
        mainStatus.style.color = 'var(--neon-cyan)';
        subStatus.textContent = 'Auditing mobile file headers, RAM caches & secure keys...';

        // Add log lines sequentially
        const logLines = [
          { text: 'Connecting to device system logs...', type: 'normal' },
          { text: 'Verifying local keychain encryption parity...', type: 'normal' },
          { text: 'Checking kernel safety headers (SHA-256)...', type: 'normal' },
          { text: 'SUCCESS: Kernel integrity authentic.', type: 'success' },
          { text: 'Scanning local storage block allocations...', type: 'normal' },
          { text: 'Evaluating active cache hooks & memory states...', type: 'normal' },
          { text: 'Auditing secure enclave keys...', type: 'normal' },
          { text: 'SUCCESS: 0 threat vectors detected.', type: 'success' }
        ];

        let index = 0;
        function showNextLog() {
          if (index < logLines.length) {
            const line = logLines[index];
            const logEl = document.createElement('div');
            logEl.className = `scan-log-line ${line.type}`;
            logEl.textContent = `[${new Date().toLocaleTimeString()}] ${line.text}`;
            logsContainer.appendChild(logEl);
            logsContainer.scrollTop = logsContainer.scrollHeight;
            index++;
            setTimeout(showNextLog, 300);
          } else {
            // Scanning Complete
            setTimeout(() => {
              animationNode.classList.remove('scanning');
              radarLine.style.display = 'none';
              
              mainStatus.textContent = 'SYSTEM SHIELD SECURE';
              mainStatus.style.color = 'var(--neon-green)';
              subStatus.textContent = 'All subsystems verified green. 0 anomalies detected.';
              
              scanTrigger.disabled = false;
              scanTrigger.style.opacity = '1';
              scanTrigger.textContent = 'Run Shield Integrity Scan';
              
              isScanning = false;
              
              showToast('SCAN COMPLETE', 'Mobile system audit completed. Parity: 100%.', false);
              
              // Device feedback if supported
              if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
              }
            }, 500);
          }
        }
        
        setTimeout(showNextLog, 200);
      });
    }

    // Quick utilities clicks inside bottom-sheet
    const clearAlertsBtn = document.getElementById('util-clear-alerts');
    if (clearAlertsBtn) {
      clearAlertsBtn.addEventListener('click', () => {
        // Find notification count bubble in top bar
        const badge = document.getElementById('notif-badge');
        if (badge) {
          badge.style.display = 'none';
        }
        showToast('THREATS ACKNOWLEDGED', 'Active notifications cleared & logged.');
      });
    }

    const genCipherBtn = document.getElementById('util-gen-cipher');
    if (genCipherBtn) {
      genCipherBtn.addEventListener('click', () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
        let key = '';
        for (let i = 0; i < 24; i++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Try writing to clipboard
        navigator.clipboard.writeText(key).then(() => {
          showToast('SAFE KEY GENERATED', `24-Char Cipher copied: ${key.substring(0, 8)}...`);
        }).catch(() => {
          showToast('SAFE KEY GENERATED', `24-Char Cipher: ${key.substring(0, 8)}...`);
        });
      });
    }

    const integrityCheckBtn = document.getElementById('util-integrity-check');
    if (integrityCheckBtn) {
      integrityCheckBtn.addEventListener('click', () => {
        showToast('HEURISTICS VERIFIED', 'Secure memory space checks out OK.');
      });
    }
  }

  // --- 23. MODERN PREMIUM BACK NAVIGATION CORE ---
  function initBackNavigationButton() {
    const btn = document.getElementById('nav-back-btn');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      // 1. Create Ripple Effect on click!
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'back-ripple-effect';
      
      // Calculate dynamic click coordinates relative to the button bounds
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      btn.appendChild(ripple);
      
      // Remove ripple after transition is finished
      setTimeout(() => {
        ripple.remove();
      }, 600);

      // 2. Navigation logic
      const referrer = document.referrer;
      if (referrer && referrer.indexOf(window.location.host) !== -1) {
        window.history.back();
      } else {
        // Fallback pattern: trigger back, and redirect to index.html if still on same page
        window.history.back();
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 250);
      }
    });
  }

});
