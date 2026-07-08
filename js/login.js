/**
 * CyberShield Awareness - Premium Cyber Security Login Logic
 * Manages background animations, interactions, form feedback, and safety tips.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE & UTILS ---
  const securityTips = [
    "Enable Multi-Factor Authentication (MFA) on all accounts. It stops 99.9% of automated credential theft attempts.",
    "Beware of phishing emails. Always verify the sender's full email address before clicking any links or downloading attachments.",
    "Use a dedicated, secure password manager to generate and store unique, complex passwords for every single service.",
    "Keep your operating system, web browser, and security software fully updated to instantly patch critical vulnerabilities.",
    "Never use public Wi-Fi networks for financial transactions or personal accounts without a secure Virtual Private Network (VPN).",
    "Check the URL carefully before logging into any account. Watch for subtle spelling variations in domain names (typosquatting).",
    "Back up your critical data regularly to an external offline hard drive or encrypted cloud service to mitigate ransomware risks.",
    "Limit the personal metadata you share on public social channels. Attackers actively harvest this for targeted social engineering.",
    "Avoid plugging unknown USB storage drives into your workstation. They can contain malicious payloads configured to auto-run.",
    "Always lock your machine screen (Win + L / Cmd + Ctrl + Q) whenever you step away from your desk, even for a moment.",
    "Periodically audit application permissions on your mobile devices and remove any unused or redundant programs."
  ];

  let currentTipIndex = Math.floor(Math.random() * securityTips.length);

  // --- COMPONENT SELECTORS ---
  const backgroundContainer = document.querySelector('.soc-bg-image');
  const matrixCanvas = document.getElementById('matrix-canvas');
  const particlesCanvas = document.getElementById('background-canvas');
  const loginForm = document.getElementById('cyber-login-form');
  const loginSubmitBtn = document.getElementById('submit-btn');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  
  // Show/Hide Password
  const passwordToggleBtn = document.getElementById('password-toggle');
  const eyeIconOpen = document.getElementById('eye-icon-open');
  const eyeIconClosed = document.getElementById('eye-icon-closed');

  // Tip of the Day elements
  const tipContent = document.getElementById('tip-content');
  const tipRefreshBtn = document.getElementById('tip-refresh');

  // Toast Notification
  const toastNotification = document.getElementById('toast-notification');
  const toastTitle = document.getElementById('toast-title');
  const toastDesc = document.getElementById('toast-desc');

  // --- INITIALIZE VIEWS ---
  initializeSafetyTip();

  // --- PASSWORD TOGGLE ---
  if (passwordToggleBtn) {
    passwordToggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      if (isPassword) {
        eyeIconOpen.style.display = 'none';
        eyeIconClosed.style.display = 'block';
        passwordToggleBtn.setAttribute('aria-label', 'Hide password');
      } else {
        eyeIconOpen.style.display = 'block';
        eyeIconClosed.style.display = 'none';
        passwordToggleBtn.setAttribute('aria-label', 'Show password');
      }
    });
  }

  // --- REFRESH SECURITY TIPS ---
  if (tipRefreshBtn && tipContent) {
    tipRefreshBtn.addEventListener('click', () => {
      tipContent.classList.add('fade-out');
      tipRefreshBtn.style.pointerEvents = 'none'; // Prevent double clicking

      setTimeout(() => {
        let nextIndex;
        // Ensure we don't pick the same tip twice in a row
        do {
          nextIndex = Math.floor(Math.random() * securityTips.length);
        } while (nextIndex === currentTipIndex && securityTips.length > 1);

        currentTipIndex = nextIndex;
        tipContent.textContent = securityTips[currentTipIndex];
        tipContent.classList.remove('fade-out');
        tipRefreshBtn.style.pointerEvents = 'auto';
      }, 300);
    });
  }

  function initializeSafetyTip() {
    if (tipContent) {
      tipContent.textContent = securityTips[currentTipIndex];
    }
  }

  // --- BUTTON RIPPLE EFFECT ---
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Calculate coordinates relative to the button
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create a ripple element
      const ripple = document.createElement('span');
      ripple.classList.add('btn-ripple');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      // Clean up after animation finishes
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // --- REAL AUTHENTICATION SYSTEM INTEGRATION ---
  let authMode = 'login';
  const authModeToggle = document.getElementById('auth-mode-toggle');
  const authToggleMsg = document.getElementById('auth-toggle-msg');
  const usernameFieldGroup = document.getElementById('username-field-group');
  const usernameInput = document.getElementById('username-input');
  const cardTitle = document.querySelector('#auth-card .card-title');
  const cardSubtitle = document.querySelector('#auth-card .card-subtitle');
  const emailLabel = document.querySelector('#email-field-group .input-label');

  if (authModeToggle) {
    authModeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (authMode === 'login') {
        // Switch to register mode
        authMode = 'register';
        if (cardTitle) cardTitle.textContent = 'Create Security Clearance';
        if (cardSubtitle) cardSubtitle.textContent = 'Register your corporate cryptographic node';
        if (emailLabel) emailLabel.textContent = 'Corporate Email Address';
        if (usernameFieldGroup) usernameFieldGroup.style.display = 'block';
        if (usernameInput) usernameInput.required = true;
        if (loginSubmitBtn) loginSubmitBtn.querySelector('.btn-text').textContent = 'GENERATE SECURE CLEARANCE';
        if (authToggleMsg) authToggleMsg.textContent = 'Already cleared?';
        authModeToggle.textContent = 'Initialize Secure Login';
      } else {
        // Switch to login mode
        authMode = 'login';
        if (cardTitle) cardTitle.textContent = 'Secured Console Link';
        if (cardSubtitle) cardSubtitle.textContent = 'Authorize access using your corporate credentials';
        if (emailLabel) emailLabel.textContent = 'Identity ID / Email';
        if (usernameFieldGroup) usernameFieldGroup.style.display = 'none';
        if (usernameInput) usernameInput.required = false;
        if (loginSubmitBtn) loginSubmitBtn.querySelector('.btn-text').textContent = 'INITIALIZE SECURE LOGIN';
        if (authToggleMsg) authToggleMsg.textContent = 'Need cyber clearance?';
        authModeToggle.textContent = 'Create an Account';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const username = usernameInput ? usernameInput.value.trim() : '';

      if (authMode === 'register') {
        // Registration Flow
        if (!username || !email || !password) {
          showToast('REGISTRATION FAILURE', 'Please fill in all security clearance parameters.', true);
          return;
        }

        // Show loading state
        loginSubmitBtn.classList.add('loading');
        loginSubmitBtn.disabled = true;
        const originalText = loginSubmitBtn.querySelector('.btn-text').textContent;
        loginSubmitBtn.querySelector('.btn-text').textContent = 'INITIALIZING ENCRYPTED UPLOAD...';

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
          });

          const result = await response.json();

          loginSubmitBtn.classList.remove('loading');
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.querySelector('.btn-text').textContent = originalText;

          if (result.success) {
            showToast('CLEARANCE CONFIRMED', 'Operational identity created! Initializing console link...');
            // Automatically switch to login mode and pre-populate email
            setTimeout(() => {
              if (authModeToggle) authModeToggle.click();
              emailInput.value = email;
              passwordInput.value = '';
            }, 2000);
          } else {
            showToast('ACCESS DENIED', result.error || 'Identity generation rejected.', true);
          }
        } catch (error) {
          loginSubmitBtn.classList.remove('loading');
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.querySelector('.btn-text').textContent = originalText;
          showToast('LINK ERROR', 'Symmetric connection failure. Check backend node.', true);
        }

      } else {
        // Login Flow
        if (!email || !password) {
          showToast('ACCESS DENIED', 'Please enter your credentials to scan.', true);
          return;
        }

        // Transition button to loading/scanning state
        loginSubmitBtn.classList.add('loading');
        loginSubmitBtn.disabled = true;
        const originalText = loginSubmitBtn.querySelector('.btn-text').textContent;
        loginSubmitBtn.querySelector('.btn-text').textContent = 'SCANNING CREDENTIALS...';

        // Multi-phase security scans
        setTimeout(() => {
          loginSubmitBtn.querySelector('.btn-text').textContent = 'COMPARING SIGNATURES...';

          setTimeout(async () => {
            try {
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usernameOrEmail: email, password })
              });

              const result = await response.json();

              loginSubmitBtn.classList.remove('loading');
              loginSubmitBtn.disabled = false;
              loginSubmitBtn.querySelector('.btn-text').textContent = originalText;

              if (result.success) {
                showToast(
                  'AUTHORIZATION CONFIRMED', 
                  'Token signature verified. Redirecting to CyberShield Hub...'
                );
                
                // Redirect to premium dashboard page
                setTimeout(() => {
                  window.location.href = '/dashboard.html';
                }, 1500);
              } else {
                showToast('ACCESS DENIED', result.error || 'Incorrect username or password.', true);
              }
            } catch (err) {
              loginSubmitBtn.classList.remove('loading');
              loginSubmitBtn.disabled = false;
              loginSubmitBtn.querySelector('.btn-text').textContent = originalText;
              showToast('ACCESS DENIED', 'Incorrect username or password.', true);
            }
          }, 800);
        }, 1200);
      }
    });
  }

  // --- GOOGLE & GITHUB SOCIAL SINGLE SIGN-ON (SSO) ---
  const googleAuthBtn = document.getElementById('google-auth-btn');
  const githubAuthBtn = document.getElementById('github-auth-btn');

  async function handleOAuthLogin(provider) {
    try {
      showToast('ESTABLISHING SECURE GATEWAY', `Contacting ${provider === 'google' ? 'Google' : 'GitHub'} identity nodes...`);
      
      const response = await fetch(`/api/auth/${provider}/url`);
      if (!response.ok) {
        throw new Error(`Failed to retrieve authenticating handshake parameters.`);
      }
      const { url } = await response.json();
      
      // Calculate popup center
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2 + window.screenX;
      const top = (window.innerHeight - height) / 2 + window.screenY;
      
      const authWindow = window.open(
        url,
        `${provider}_oauth_popup`,
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      if (!authWindow) {
        showToast('POPUP BLOCKED', 'Please allow popups to utilize Social Single Sign-On (SSO).', true);
      }
    } catch (err) {
      console.error(`${provider} SSO error:`, err);
      showToast('OAUTH GATEWAY ERROR', err.message || `Could not establish trust route with ${provider}.`, true);
    }
  }

  if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', () => handleOAuthLogin('google'));
  }

  if (githubAuthBtn) {
    githubAuthBtn.addEventListener('click', () => handleOAuthLogin('github'));
  }

  // Listen for callback messages from popup window
  window.addEventListener('message', (event) => {
    // Basic origin check to allow .run.app and localhost origins
    const origin = event.origin;
    if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return;
    }

    if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
      showToast(
        'AUTHORIZATION CONFIRMED',
        'Cryptographic single sign-on verification succeeded. Initializing terminal link...'
      );
      
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
    }
  });

  // Display OAuth error if redirected with query params
  const urlParams = new URLSearchParams(window.location.search);
  const oauthError = urlParams.get('error');
  if (oauthError) {
    showToast('IDENTITY FAILURE', decodeURIComponent(oauthError), true);
    // Clean URL bar
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // --- TOAST CONTROLLER ---
  let toastTimeout;
  function showToast(title, description, isError = false) {
    // Reset existing toast
    clearTimeout(toastTimeout);
    toastNotification.classList.remove('active', 'error');

    // Force reflow
    void toastNotification.offsetWidth;

    // Apply new values
    toastTitle.textContent = title;
    toastDesc.textContent = description;
    
    if (isError) {
      toastNotification.classList.add('error');
    }
    
    toastNotification.classList.add('active');

    // Auto-hide after 5 seconds
    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('active');
    }, 5000);
  }

  // --- MOUSE PARALLAX EFFECT ---
  window.addEventListener('mousemove', (e) => {
    if (!backgroundContainer) return;
    
    // Calculate normalized cursor position (-0.5 to 0.5)
    const normalizedX = (e.clientX / window.innerWidth) - 0.5;
    const normalizedY = (e.clientY / window.innerHeight) - 0.5;

    // Move background in opposite direction (very subtle parallax)
    const bgMoveX = normalizedX * -12;
    const bgMoveY = normalizedY * -12;
    backgroundContainer.style.transform = `scale(1.03) translate(${bgMoveX}px, ${bgMoveY}px)`;
  });


  // --- CANVAS ANIMATIONS ENGINE ---

  // 1. Matrix Rain Animation
  let matrixContext = null;
  if (matrixCanvas) {
    matrixContext = matrixCanvas.getContext('2d');
  }

  const alphabet = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&+*¥';
  const fontSize = 14;
  let columns = 0;
  let rainDrops = [];

  function initMatrix() {
    if (!matrixCanvas || !matrixContext) return;
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    columns = Math.floor(matrixCanvas.width / fontSize);
    rainDrops = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = Math.random() * -100; // Staggered entry height
    }
  }

  function drawMatrix() {
    if (!matrixCanvas || !matrixContext) return;
    
    // Clear slightly on each frame to create trails
    matrixContext.fillStyle = 'rgba(5, 7, 15, 0.12)';
    matrixContext.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    matrixContext.fillStyle = 'rgba(0, 242, 254, 0.45)'; // Cool cyan rain matching theme
    matrixContext.font = fontSize + 'px monospace';

    for (let i = 0; i < rainDrops.length; i++) {
      const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      
      // Calculate coordinates
      const x = i * fontSize;
      const y = rainDrops[i] * fontSize;

      // Draw random glow nodes occasionally
      if (Math.random() > 0.98) {
        matrixContext.fillStyle = '#00f5a0'; // Splash of neon green occasionally
      } else {
        matrixContext.fillStyle = 'rgba(0, 242, 254, 0.4)';
      }

      matrixContext.fillText(text, x, y);

      // Reset drop when off screen or randomly
      if (y > matrixCanvas.height && Math.random() > 0.975) {
        rainDrops[i] = 0;
      }
      rainDrops[i]++;
    }
  }


  // 2. Slow Drifting Glow Particles
  let particlesContext = null;
  if (particlesCanvas) {
    particlesContext = particlesCanvas.getContext('2d');
  }

  const particlesArray = [];
  const maxParticles = 40;

  class Particle {
    constructor() {
      this.init();
    }

    init() {
      if (!particlesCanvas) return;
      this.x = Math.random() * particlesCanvas.width;
      this.y = Math.random() * particlesCanvas.height;
      this.size = Math.random() * 2 + 1; // 1px to 3px
      this.speedX = (Math.random() * 0.2) - 0.1; // slow drift
      this.speedY = (Math.random() * -0.2) - 0.05; // upwards bias
      this.opacity = Math.random() * 0.4 + 0.1;
      this.opacityDirection = Math.random() > 0.5 ? 0.005 : -0.005;
      
      // Theme colors for particles: Cyan, Blue, Green
      const colors = ['#00f2fe', '#4facfe', '#00f5a0'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap around screen edges
      if (particlesCanvas) {
        if (this.y < 0) this.y = particlesCanvas.height;
        if (this.y > particlesCanvas.height) this.y = 0;
        if (this.x < 0) this.x = particlesCanvas.width;
        if (this.x > particlesCanvas.width) this.x = 0;
      }

      // Pulse opacity slowly
      this.opacity += this.opacityDirection;
      if (this.opacity >= 0.6 || this.opacity <= 0.1) {
        this.opacityDirection = -this.opacityDirection;
      }
    }

    draw() {
      if (!particlesContext) return;
      particlesContext.save();
      particlesContext.beginPath();
      particlesContext.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      
      // Make them glow
      particlesContext.shadowBlur = this.size * 3;
      particlesContext.shadowColor = this.color;
      particlesContext.fillStyle = this.color;
      particlesContext.globalAlpha = this.opacity;
      
      particlesContext.fill();
      particlesContext.restore();
    }
  }

  function initParticles() {
    if (!particlesCanvas) return;
    particlesCanvas.width = window.innerWidth;
    particlesCanvas.height = window.innerHeight;

    particlesArray.length = 0;
    for (let i = 0; i < maxParticles; i++) {
      particlesArray.push(new Particle());
    }
  }

  function drawParticles() {
    if (!particlesCanvas || !particlesContext) return;
    particlesContext.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
    
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
  }


  // --- RESIZE EVENT HANDLER ---
  window.addEventListener('resize', () => {
    initMatrix();
    initParticles();
  });

  // --- MASTER ANIMATION LOOP (60 FPS) ---
  initMatrix();
  initParticles();

  let lastTime = 0;
  const matrixInterval = 50; // slowdown matrix rain slightly for readability
  let matrixTimer = 0;

  function animate(timestamp) {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Drifting particles run full speed
    drawParticles();

    // Matrix Rain is throttled to run at an organic, readable pace
    matrixTimer += deltaTime;
    if (matrixTimer >= matrixInterval) {
      drawMatrix();
      matrixTimer = 0;
    }

    requestAnimationFrame(animate);
  }

  // Start loop once images/DOM are active
  requestAnimationFrame(animate);
});
