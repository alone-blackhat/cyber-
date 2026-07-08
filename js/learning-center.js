/*
 * CyberShield Academy - Interactive Learning Center Controller
 * Dedicated module handling course maps, digital book reader, persistent progress engine, and credential signatures.
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- DATABASE & STATE ENGINES ---
  let coursesCatalog = [];
  let currentPathData = null; // Holds the currently loaded detailed course path lessons
  let activeLessonIndex = 0;
  let activePathId = null;

  const ACADEMY_STORAGE_KEY = 'cybershield_academy_progress';

  let progressState = {
    completedLessons: {}, // Map of 'lesson-id' -> true
    bookmarks: {},        // Map of 'lesson-id' -> true
    xp: 0,
    completedPaths: {}    // Map of 'path-id' -> true
  };

  // --- INITIALIZATION ---
  function initAcademy() {
    loadLocalProgress();
    fetchCatalog();
    setupEventHandlers();
  }

  // --- PROGRESS PERSISTENCE ---
  function loadLocalProgress() {
    const raw = localStorage.getItem(ACADEMY_STORAGE_KEY);
    if (raw) {
      try {
        progressState = JSON.parse(raw);
        // Ensure standard structure
        if (!progressState.completedLessons) progressState.completedLessons = {};
        if (!progressState.bookmarks) progressState.bookmarks = {};
        if (progressState.xp === undefined) progressState.xp = 0;
        if (!progressState.completedPaths) progressState.completedPaths = {};
      } catch (e) {
        console.error("Failed to parse academy progress, resetting...", e);
      }
    } else {
      saveLocalProgress();
    }
    updateProgressMetrics();
  }

  function saveLocalProgress() {
    localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(progressState));
    updateProgressMetrics();
  }

  function updateProgressMetrics() {
    const statPaths = document.getElementById('learning-stat-paths');
    const statLessons = document.getElementById('learning-stat-lessons');
    const statXp = document.getElementById('learning-stat-xp');

    if (statPaths) {
      const completedCount = Object.keys(progressState.completedPaths || {}).filter(k => progressState.completedPaths[k]).length;
      statPaths.textContent = `${completedCount} / 3`;
    }

    if (statLessons) {
      const completedLessonsCount = Object.keys(progressState.completedLessons || {}).filter(k => progressState.completedLessons[k]).length;
      statLessons.textContent = `${completedLessonsCount} / 53`;
    }

    if (statXp) {
      statXp.textContent = `${progressState.xp} XP`;
    }
  }

  // --- FETCH CATALOG DATA ---
  async function fetchCatalog() {
    try {
      const response = await fetch('/data/courses/catalog.json');
      if (!response.ok) throw new Error("Catalog fetch failure");
      coursesCatalog = await response.ok ? await response.json() : [];
      renderCatalogGrid();
    } catch (e) {
      console.error("Academy Catalog Load Error:", e);
      // Fallback
      coursesCatalog = [];
    }
  }

  // --- RENDER COURSE GRID ---
  function renderCatalogGrid(filterTerm = "all", searchKeyword = "") {
    const grid = document.getElementById('learning-content-grid');
    if (!grid) return;

    grid.innerHTML = "";

    const filtered = coursesCatalog.filter(path => {
      // Difficulty match
      if (filterTerm !== "all" && path.difficulty !== filterTerm) {
        return false;
      }
      // Search match
      if (searchKeyword) {
        const key = searchKeyword.toLowerCase();
        const matchesTitle = path.title.toLowerCase().includes(key);
        const matchesSubtitle = path.subtitle.toLowerCase().includes(key);
        const matchesLessons = path.lessons.some(l => l.toLowerCase().includes(key));
        return matchesTitle || matchesSubtitle || matchesLessons;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; border: 1px dashed rgba(255, 255, 255, 0.08); border-radius: 8px; background: rgba(255,255,255,0.01);">
          <span style="font-size: 2rem;">🔍</span>
          <h4 style="margin: 1rem 0 0.5rem 0; color: #fff; font-size: 1rem;">No matching runbooks found</h4>
          <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0;">Try adjusting your keywords or path filter tab.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(path => {
      // Calculate real progress for this path
      const pathLessonIds = getPathLessonIds(path.id);
      const pathLessonsTotal = path.lessons.length;
      const completedInPath = pathLessonIds.filter(id => progressState.completedLessons[id]).length;
      const progressPercent = pathLessonsTotal > 0 ? Math.round((completedInPath / pathLessonsTotal) * 100) : 0;

      // Mark path as fully complete if it reached 100%
      if (progressPercent === 100 && !progressState.completedPaths[path.id]) {
        progressState.completedPaths[path.id] = true;
        progressState.xp += 500; // Path completion bonus!
        saveLocalProgress();
      }

      const diffColor = path.difficulty === "Beginner" ? "var(--neon-cyan)" : path.difficulty === "Intermediate" ? "var(--neon-green)" : "#bd00ff";
      const diffBorder = path.difficulty === "Beginner" ? "rgba(0, 242, 255, 0.15)" : path.difficulty === "Intermediate" ? "rgba(0, 255, 157, 0.15)" : "rgba(189, 0, 255, 0.15)";
      const diffBg = path.difficulty === "Beginner" ? "rgba(0, 242, 255, 0.02)" : path.difficulty === "Intermediate" ? "rgba(0, 255, 157, 0.02)" : "rgba(189, 0, 255, 0.02)";

      const card = document.createElement('div');
      card.className = "learning-card";
      card.style.background = "var(--bg-card)";
      card.style.border = `1px solid var(--border-glass)`;
      card.style.borderRadius = "12px";
      card.style.overflow = "hidden";
      card.style.position = "relative";
      card.style.transition = "transform 0.3s, border-color 0.3s";
      card.style.display = "flex";
      card.style.flexDirection = "column";

      card.innerHTML = `
        <!-- Card Header Banner -->
        <div style="background: ${path.coverGradient}; height: 8px; width: 100%;"></div>
        
        <div style="padding: 1.5rem; display: flex; flex-direction: column; flex: 1; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="learning-badge" style="background: ${diffBg}; border: 1px solid ${diffBorder}; color: ${diffColor};">${path.difficulty}</span>
            <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted);">${path.duration}</span>
          </div>

          <div>
            <h3 class="learning-title" style="font-size: 1.1rem; font-weight: 700; margin: 0 0 0.5rem 0; line-height: 1.3;">${path.title}</h3>
            <p class="learning-desc" style="font-size: 0.8rem; line-height: 1.5; color: var(--text-muted); margin: 0; min-height: 3.2em; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${path.subtitle}</p>
          </div>

          <!-- Progress Bar -->
          <div style="margin: 0.5rem 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 0.35rem;">
              <span>SYLLABUS PROGRESS</span>
              <span style="color: ${diffColor}; font-weight: bold;">${progressPercent}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden; border: 1px solid rgba(255,255,255,0.02);">
              <div style="width: ${progressPercent}%; height: 100%; background: ${path.coverGradient}; border-radius: 3px; transition: width 0.4s;"></div>
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); margin-top: 0.35rem;">
              ✔ ${completedInPath} of ${pathLessonsTotal} runbooks resolved
            </div>
          </div>

          <!-- Actions Footer -->
          <div style="display: flex; gap: 0.75rem; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 1rem; margin-top: auto;">
            <button class="start-path-btn" data-path="${path.id}" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); color: #fff; padding: 0.65rem 1rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: var(--font-sans);" onmouseover="this.style.background='rgba(0, 242, 255, 0.05)'; this.style.borderColor='var(--neon-cyan)'; this.style.color='var(--neon-cyan)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.02)'; this.style.borderColor='rgba(255, 255, 255, 0.08)'; this.style.color='#fff';">
              <span>${progressPercent > 0 ? "RESUME PATH" : "START LEARNING"}</span> &rarr;
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Rebind action click listeners
    document.querySelectorAll('.start-path-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pathId = e.currentTarget.getAttribute('data-path');
        openPathInReader(pathId);
      });
    });
  }

  // --- MAP PATH ID TO UNIQUE LESSON PREFIX KEYWAYS ---
  function getPathLessonIds(pathId) {
    if (pathId === "beginner-path") {
      return [
        "intro-cyber", "comp-fundamentals", "net-basics", "osi-model", "tcp-ip",
        "ip-address", "dns-basics", "http-protocol", "https-ssl", "linux-basics",
        "linux-commands", "password-security", "mfa-basics", "email-security",
        "phishing-awareness", "social-engineering", "cyber-hygiene", "safe-browsing"
      ];
    } else if (pathId === "intermediate-path") {
      return [
        "ethical-hacking", "cyber-kill-chain", "recon-strategy", "digital-footprinting",
        "port-scanning", "system-enumeration", "web-security", "auth-protocols",
        "auth-mechanisms", "cookie-mechanics", "session-management", "sqli-awareness",
        "xss-awareness", "csrf-awareness", "malware-mechanics", "ransomware-tactics",
        "spyware-detection", "incident-response"
      ];
    } else if (pathId === "advanced-path") {
      return [
        "owasp-bac", "owasp-injection", "owasp-misconfig", "owasp-crypto-failures",
        "owasp-auth-failures", "owasp-ssrf", "crypto-symmetric", "crypto-asymmetric",
        "crypto-hashing", "crypto-signatures", "crypto-ssl-tls", "crypto-pki",
        "forensics-disk", "forensics-memory", "forensics-logs", "forensics-evidence",
        "forensics-chain"
      ];
    }
    return [];
  }

  // --- SETUP EVENT HANDLERS ---
  function setupEventHandlers() {
    // Search filter input listener
    const searchInput = document.getElementById('academy-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.academy-filter-btn.active')?.getAttribute('data-filter') || 'all';
        renderCatalogGrid(activeFilter, e.target.value);
      });
    }

    // Filter tabs click handlers
    document.querySelectorAll('.academy-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.academy-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Reset tabs style
        document.querySelectorAll('.academy-filter-btn').forEach(b => {
          b.style.background = "rgba(255, 255, 255, 0.02)";
          b.style.borderColor = "rgba(255, 255, 255, 0.08)";
          b.style.color = "var(--text-muted)";
        });

        // Set active tab style
        e.target.style.background = "rgba(0, 242, 255, 0.1)";
        e.target.style.borderColor = "var(--neon-cyan)";
        e.target.style.color = "var(--neon-cyan)";

        const filterVal = e.target.getAttribute('data-filter');
        const currentKeyword = document.getElementById('academy-search-input')?.value || "";
        renderCatalogGrid(filterVal, currentKeyword);
      });
    });

    // Close reader button click listener
    const closeReaderBtn = document.getElementById('close-reader-btn');
    if (closeReaderBtn) {
      closeReaderBtn.addEventListener('click', () => {
        document.getElementById('book-reader-modal').style.display = 'none';
        renderCatalogGrid(); // Refresh catalog progress meters
      });
    }
  }

  // --- OPEN DIGITAL BOOK READER ---
  async function openPathInReader(pathId) {
    activePathId = pathId;
    let endpoint = '';
    
    if (pathId === 'beginner-path') {
      endpoint = '/data/courses/beginner.json';
    } else if (pathId === 'intermediate-path') {
      endpoint = '/data/courses/intermediate.json';
    } else if (pathId === 'advanced-path') {
      endpoint = '/data/courses/advanced.json';
    }

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Runbooks file fetch error");
      currentPathData = await response.json();

      // Setup reader metadata
      const pathCatalog = coursesCatalog.find(p => p.id === pathId);
      if (pathCatalog) {
        document.getElementById('reader-path-badge').textContent = pathCatalog.difficulty.toUpperCase();
        document.getElementById('reader-path-title').textContent = pathCatalog.title;
        
        // Dynamic badge color matching difficulty
        const badge = document.getElementById('reader-path-badge');
        if (pathCatalog.difficulty === "Beginner") {
          badge.style.color = "var(--neon-cyan)";
          badge.style.borderColor = "rgba(0, 242, 255, 0.2)";
        } else if (pathCatalog.difficulty === "Intermediate") {
          badge.style.color = "var(--neon-green)";
          badge.style.borderColor = "rgba(0, 255, 157, 0.2)";
        } else {
          badge.style.color = "#bd00ff";
          badge.style.borderColor = "rgba(189, 0, 255, 0.2)";
        }
      }

      // Determine default active lesson index: first uncompleted lesson, or 0
      activeLessonIndex = 0;
      for (let i = 0; i < currentPathData.length; i++) {
        const lesson = currentPathData[i];
        if (!progressState.completedLessons[lesson.id]) {
          activeLessonIndex = i;
          break;
        }
      }

      // Open reader modal
      document.getElementById('book-reader-modal').style.display = 'block';

      renderReaderSidebarTOC();
      loadActiveLessonInReader();
      updateReaderProgressMeter();

    } catch (e) {
      console.error("Failed to load runbooks:", e);
      alert("System Integrity Alert: Detailed secure course runbooks are currently unavailable.");
    }
  }

  // --- UPDATE READER PROGRESS BAR ---
  function updateReaderProgressMeter() {
    if (!currentPathData) return;
    const total = currentPathData.length;
    const completed = currentPathData.filter(lesson => progressState.completedLessons[lesson.id]).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('reader-progress-text').textContent = `${pct}%`;
    document.getElementById('reader-progress-bar').style.width = `${pct}%`;
  }

  // --- RENDER SIDEBAR TOC ---
  function renderReaderSidebarTOC() {
    const list = document.getElementById('reader-toc-list');
    if (!list || !currentPathData) return;

    list.innerHTML = "";

    currentPathData.forEach((lesson, index) => {
      const isCompleted = progressState.completedLessons[lesson.id];
      const isActive = index === activeLessonIndex;

      const li = document.createElement('li');
      li.style.padding = "0.85rem 1.25rem";
      li.style.borderBottom = "1px solid rgba(255, 255, 255, 0.03)";
      li.style.cursor = "pointer";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.gap = "0.75rem";
      li.style.fontSize = "0.82rem";
      li.style.fontFamily = "var(--font-sans)";
      li.style.transition = "all 0.2s";

      if (isActive) {
        li.style.background = "rgba(0, 242, 255, 0.06)";
        li.style.borderLeft = "3px solid var(--neon-cyan)";
        li.style.color = "#ffffff";
      } else {
        li.style.borderLeft = "3px solid transparent";
        li.style.color = "var(--text-muted)";
      }

      li.addEventListener('mouseover', () => {
        if (!isActive) {
          li.style.background = "rgba(255, 255, 255, 0.01)";
          li.style.color = "#ffffff";
        }
      });
      li.addEventListener('mouseout', () => {
        if (!isActive) {
          li.style.background = "transparent";
          li.style.color = "var(--text-muted)";
        }
      });

      // Status icon check (Neon Green checkmark if completed, transparent ring if not)
      const statusIcon = isCompleted 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<div style="width: 12px; height: 12px; border: 1.5px solid rgba(255,255,255,0.25); border-radius: 50%;"></div>`;

      li.innerHTML = `
        <span style="display: flex; align-items: center; justify-content: center; width: 16px;">${statusIcon}</span>
        <span style="font-weight: ${isActive ? '600' : '500'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${lesson.title}</span>
      `;

      li.addEventListener('click', () => {
        activeLessonIndex = index;
        renderReaderSidebarTOC();
        loadActiveLessonInReader();
      });

      list.appendChild(li);
    });
  }

  // --- LOAD ACTIVE LESSON CONTENT ---
  function loadActiveLessonInReader() {
    const readerArea = document.getElementById('reader-content-area');
    if (!readerArea || !currentPathData) return;

    const lesson = currentPathData[activeLessonIndex];
    if (!lesson) return;

    const isCompleted = progressState.completedLessons[lesson.id];
    const categoryName = `Lesson ${String(activeLessonIndex + 1).padStart(2, '0')}`;

    // Compile Key definitions glossary markdown
    let glossaryHTML = "";
    if (lesson.chapter.definitions) {
      glossaryHTML = `
        <div style="background: rgba(255, 255, 255, 0.01); border: 1px dashed rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
          <h4 style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--neon-cyan); letter-spacing: 0.1em; margin: 0 0 0.85rem 0; text-transform: uppercase;">GLOSSARY DEEP INDEX</h4>
          <dl style="display: flex; flex-direction: column; gap: 1rem; margin: 0;">
            ${Object.keys(lesson.chapter.definitions).map(term => `
              <div style="margin: 0;">
                <dt style="font-size: 0.82rem; font-weight: 700; color: #ffffff; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 4px; height: 4px; background: var(--neon-cyan); border-radius: 50%;"></span>
                  ${term}
                </dt>
                <dd style="font-size: 0.78rem; color: var(--text-muted); margin-left: 0.75rem; line-height: 1.5;">${lesson.chapter.definitions[term]}</dd>
              </div>
            `).join('')}
          </dl>
        </div>
      `;
    }

    // Compile practical examples list
    let examplesHTML = "";
    if (lesson.chapter.examples && lesson.chapter.examples.length > 0) {
      examplesHTML = `
        <div style="margin: 1.5rem 0;">
          <h4 style="font-size: 0.85rem; font-weight: 700; color: #fff; margin-bottom: 0.75rem;">Practical Action Controls</h4>
          <ul style="list-style: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 0.65rem;">
            ${lesson.chapter.examples.map(ex => `
              <li style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; display: flex; gap: 0.5rem; align-items: flex-start;">
                <span style="color: var(--neon-green); font-family: var(--font-mono); font-size: 0.75rem; margin-top: 0.1rem;">[+]</span>
                <span>${ex}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Compile Notes
    let notesHTML = "";
    if (lesson.chapter.notes && lesson.chapter.notes.length > 0) {
      notesHTML = `
        <div style="background: rgba(0, 242, 255, 0.02); border-left: 3px solid var(--neon-cyan); border-radius: 4px; padding: 1rem 1.25rem; margin: 1.5rem 0;">
          <h4 style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--neon-cyan); margin: 0 0 0.5rem 0; letter-spacing: 0.05em; text-transform: uppercase;">SECURITY OFFICER'S NOTE</h4>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            ${lesson.chapter.notes.map(note => `
              <li style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">${note}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Compile Exam Tips
    let tipsHTML = "";
    if (lesson.chapter.tips && lesson.chapter.tips.length > 0) {
      tipsHTML = `
        <div style="background: rgba(0, 255, 157, 0.02); border-left: 3px solid var(--neon-green); border-radius: 4px; padding: 1rem 1.25rem; margin: 1.5rem 0;">
          <h4 style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--neon-green); margin: 0 0 0.5rem 0; letter-spacing: 0.05em; text-transform: uppercase;">EXAM BOARD BLUEPRINT TIP</h4>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            ${lesson.chapter.tips.map(tip => `
              <li style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">${tip}</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Compile Case Studies
    let realWorldHTML = "";
    if (lesson.chapter.realWorldExample) {
      realWorldHTML = `
        <div style="background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0; box-shadow: inset 0 0 15px rgba(0,0,0,0.4);">
          <h4 style="font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-muted); margin: 0 0 0.5rem 0; letter-spacing: 0.05em; text-transform: uppercase;">HISTORICAL INCIDENT LOG</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5; margin: 0; font-style: italic;">
            "${lesson.chapter.realWorldExample}"
          </p>
        </div>
      `;
    }

    // Compile Quiz Choices
    const quizChoicesHTML = lesson.quiz.options.map((opt, optIdx) => `
      <button class="quiz-choice-btn" data-index="${optIdx}" style="display: flex; align-items: center; gap: 1rem; width: 100%; text-align: left; background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 1rem 1.25rem; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; transition: all 0.25s; font-family: var(--font-sans);">
        <span class="choice-alpha" style="font-family: var(--font-mono); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">${String.fromCharCode(65 + optIdx)}</span>
        <span style="line-height: 1.4; flex: 1;">${opt}</span>
      </button>
    `).join('');

    // Write full HTML content
    readerArea.innerHTML = `
      <!-- Breadcrumb meta -->
      <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; margin-bottom: -1rem;">
        <span>${categoryName}</span>
        <span>/</span>
        <span style="color: var(--neon-cyan);">${lesson.title}</span>
      </div>

      <!-- Core Lesson Body -->
      <div style="display: flex; flex-direction: column; gap: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 2rem;">
        <h1 style="font-size: 2rem; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.25; tracking: -0.5px;">${lesson.chapter.title}</h1>
        <p style="font-size: 0.88rem; line-height: 1.7; color: rgba(255, 255, 255, 0.75); margin: 0;">${lesson.chapter.explanation}</p>
      </div>

      <!-- Diagram Pre -->
      ${lesson.chapter.diagram ? `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
          <span style="font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-muted); letter-spacing: 0.15em; text-transform: uppercase;">CORE ARCHITECTURE DECAL</span>
          <pre style="background: #02050a; border: 1px solid rgba(0, 242, 255, 0.15); border-radius: 6px; padding: 1.5rem; overflow-x: auto; font-family: var(--font-mono); font-size: 0.78rem; color: var(--neon-cyan); box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8); line-height: 1.4; margin: 0;">${lesson.chapter.diagram}</pre>
        </div>
      ` : ""}

      <!-- Deep layout assets -->
      ${glossaryHTML}
      ${examplesHTML}
      ${realWorldHTML}
      ${notesHTML}
      ${tipsHTML}

      <!-- Interactive Assessment Box -->
      <div id="academy-quiz-card" style="background: rgba(10, 15, 25, 0.4); border: 1px solid rgba(0, 242, 255, 0.15); border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; box-shadow: 0 0 25px rgba(0,0,0,0.4); margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--neon-cyan); letter-spacing: 0.1em; text-transform: uppercase;">SOC CREDENTIAL INTEGRITY AUDIT</span>
          <span id="quiz-status-badge" style="font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700; text-transform: uppercase; background: ${isCompleted ? 'rgba(0, 255, 157, 0.05)' : 'rgba(255,255,255,0.02)'}; color: ${isCompleted ? 'var(--neon-green)' : 'var(--text-muted)'}; padding: 0.15rem 0.45rem; border-radius: 3px; border: 1px solid ${isCompleted ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255,255,255,0.05)'};">
            ${isCompleted ? "RESOLVED (100 XP)" : "OPEN TASK"}
          </span>
        </div>

        <div>
          <h4 style="font-size: 0.95rem; font-weight: 600; color: #ffffff; margin: 0 0 1rem 0; line-height: 1.4;">${lesson.quiz.question}</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${quizChoicesHTML}
          </div>
        </div>

        <div id="quiz-feedback-banner" style="display: none; padding: 1rem 1.25rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.5; flex-direction: column; gap: 0.5rem;">
          <!-- Populated by evaluation -->
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <button id="submit-answer-btn" style="background: rgba(0, 242, 255, 0.05); border: 1px solid var(--neon-cyan); color: var(--neon-cyan); padding: 0.75rem 1.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.3s; font-family: var(--font-mono);" onmouseover="this.style.boxShadow='0 0 10px rgba(0, 242, 255, 0.25)';" onmouseout="this.style.boxShadow='none';">
            SUBMIT CREDENTIAL ANSWER
          </button>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button id="prev-lesson-btn" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); padding: 0.65rem 1rem; border-radius: 8px; font-size: 0.75rem; cursor: pointer; font-family: var(--font-mono);" ${activeLessonIndex === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ""}>
              &larr; PREV
            </button>
            <button id="next-lesson-btn" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); padding: 0.65rem 1rem; border-radius: 8px; font-size: 0.75rem; cursor: pointer; font-family: var(--font-mono);" ${activeLessonIndex === currentPathData.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ""}>
              NEXT &rarr;
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Quiz Option Selector click events
    let selectedOptionIndex = null;
    const choiceButtons = document.querySelectorAll('.quiz-choice-btn');
    
    choiceButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Clear all button borders/highlights
        choiceButtons.forEach(b => {
          b.style.borderColor = "rgba(255, 255, 255, 0.05)";
          b.style.color = "var(--text-muted)";
          b.querySelector('.choice-alpha').style.borderColor = "rgba(255,255,255,0.08)";
          b.querySelector('.choice-alpha').style.background = "rgba(255,255,255,0.03)";
          b.querySelector('.choice-alpha').style.color = "#ffffff";
        });

        // Highlight selected
        selectedOptionIndex = parseInt(e.currentTarget.getAttribute('data-index'));
        e.currentTarget.style.borderColor = "var(--neon-cyan)";
        e.currentTarget.style.color = "#ffffff";
        
        const alpha = e.currentTarget.querySelector('.choice-alpha');
        alpha.style.borderColor = "var(--neon-cyan)";
        alpha.style.background = "rgba(0, 242, 255, 0.1)";
        alpha.style.color = "var(--neon-cyan)";
      });
    });

    // Handle Submit Answer
    const submitBtn = document.getElementById('submit-answer-btn');
    submitBtn.addEventListener('click', () => {
      if (selectedOptionIndex === null) {
        alert("Verification Warning: Select an option before submitting credentials check.");
        return;
      }

      const isCorrect = selectedOptionIndex === lesson.quiz.answer;
      const feedbackBanner = document.getElementById('quiz-feedback-banner');
      feedbackBanner.style.display = "flex";

      if (isCorrect) {
        feedbackBanner.style.background = "rgba(0, 255, 157, 0.04)";
        feedbackBanner.style.border = "1px solid rgba(0, 255, 157, 0.2)";
        feedbackBanner.style.color = "var(--neon-green)";
        feedbackBanner.innerHTML = `
          <strong style="font-family: var(--font-mono); letter-spacing: 0.05em; font-size: 0.75rem; text-transform: uppercase;">[✔] SECURITY AUDIT VERIFIED - PASS</strong>
          <p style="margin: 0.25rem 0 0 0; color: rgba(255,255,255,0.75); font-family: var(--font-sans);">${lesson.quiz.explanation}</p>
        `;

        // Highlight selected option in green
        const correctBtn = document.querySelector(`.quiz-choice-btn[data-index="${lesson.quiz.answer}"]`);
        if (correctBtn) {
          correctBtn.style.borderColor = "var(--neon-green)";
          const alpha = correctBtn.querySelector('.choice-alpha');
          alpha.style.borderColor = "var(--neon-green)";
          alpha.style.background = "rgba(0, 255, 157, 0.1)";
          alpha.style.color = "var(--neon-green)";
        }

        // Apply XP on first time completion
        if (!progressState.completedLessons[lesson.id]) {
          progressState.completedLessons[lesson.id] = true;
          progressState.xp += 100;
          saveLocalProgress();

          // Update UI state indicators immediately
          document.getElementById('quiz-status-badge').textContent = "RESOLVED (100 XP)";
          document.getElementById('quiz-status-badge').style.color = "var(--neon-green)";
          document.getElementById('quiz-status-badge').style.borderColor = "rgba(0, 255, 157, 0.15)";
          document.getElementById('quiz-status-badge').style.background = "rgba(0, 255, 157, 0.05)";

          // Trigger confetti or quick visual success flash in TOC
          renderReaderSidebarTOC();
          updateReaderProgressMeter();
        }

      } else {
        feedbackBanner.style.background = "rgba(255, 64, 129, 0.04)";
        feedbackBanner.style.border = "1px solid rgba(255, 64, 129, 0.2)";
        feedbackBanner.style.color = "#ff4081";
        feedbackBanner.innerHTML = `
          <strong style="font-family: var(--font-mono); letter-spacing: 0.05em; font-size: 0.75rem; text-transform: uppercase;">[!] SECURITY CONTROL AUDIT FAILURE - REJECTED</strong>
          <p style="margin: 0.25rem 0 0 0; color: rgba(255,255,255,0.75); font-family: var(--font-sans);">${lesson.quiz.explanation}</p>
        `;

        // Highlight wrong choice in red, highlight correct in green
        const wrongBtn = document.querySelector(`.quiz-choice-btn[data-index="${selectedOptionIndex}"]`);
        if (wrongBtn) {
          wrongBtn.style.borderColor = "#ff4081";
          const wrongAlpha = wrongBtn.querySelector('.choice-alpha');
          wrongAlpha.style.borderColor = "#ff4081";
          wrongAlpha.style.background = "rgba(255, 64, 129, 0.1)";
          wrongAlpha.style.color = "#ff4081";
        }

        const correctBtn = document.querySelector(`.quiz-choice-btn[data-index="${lesson.quiz.answer}"]`);
        if (correctBtn) {
          correctBtn.style.borderColor = "var(--neon-green)";
          const alpha = correctBtn.querySelector('.choice-alpha');
          alpha.style.borderColor = "var(--neon-green)";
          alpha.style.background = "rgba(0, 255, 157, 0.1)";
          alpha.style.color = "var(--neon-green)";
        }
      }
    });

    // Prev/Next actions
    const prevBtn = document.getElementById('prev-lesson-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (activeLessonIndex > 0) {
          activeLessonIndex--;
          renderReaderSidebarTOC();
          loadActiveLessonInReader();
          scrollToTopReader();
        }
      });
    }

    const nextBtn = document.getElementById('next-lesson-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (activeLessonIndex < currentPathData.length - 1) {
          activeLessonIndex++;
          renderReaderSidebarTOC();
          loadActiveLessonInReader();
          scrollToTopReader();
        }
      });
    }
  }

  function scrollToTopReader() {
    const mainReaderPanel = document.querySelector('#book-reader-modal main');
    if (mainReaderPanel) mainReaderPanel.scrollTop = 0;
  }

  // Run on startup
  initAcademy();
});
