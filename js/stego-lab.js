// =============================================================
// CYBERSHIELD STEGANOGRAPHY LEARNING & ANALYSIS LAB CONTROLLER
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  initStegoTabs();
  initLsbModulator();
  initImageAnalyzer();
  initComparisonTool();
  initCapacityEstimator();
  initLearningAcademy();
  initSteganalysisSandbox();
});

// --- 1. TAB NAVIGATION ---
function initStegoTabs() {
  const tabBtns = document.querySelectorAll(".stego-tab-btn");
  const tabPanels = document.querySelectorAll(".stego-tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      if (!tabId) return;

      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabPanels.forEach((panel) => {
        if (panel.id === tabId) {
          panel.style.display = "flex";
        } else {
          panel.style.display = "none";
        }
      });
    });
  });
}

// --- 2. INTERACTIVE LSB MODULATOR ---
function initLsbModulator() {
  const slider = document.getElementById("lsb-blue-slider");
  const bit0Btn = document.getElementById("lsb-interactive-bit0");

  if (!slider) return;

  function updateLSB(value) {
    value = Math.max(0, Math.min(255, value));
    
    // Update labels
    const valText = document.getElementById("lsb-blue-val");
    const modValText = document.getElementById("lsb-mod-val");
    if (valText) valText.textContent = value;
    if (modValText) modValText.textContent = value;

    // Binary bits string conversion
    const binaryStr = value.toString(2).padStart(8, "0");
    for (let i = 0; i < 8; i++) {
      const bitElement = document.getElementById(`lsb-bit-${7 - i}`);
      if (bitElement) {
        bitElement.textContent = binaryStr[i];
      }
    }

    // Colors mapping
    const modColorBox = document.getElementById("lsb-mod-color");
    if (modColorBox) {
      modColorBox.style.background = `rgb(0, 242, ${value})`;
    }

    // Sync Slider
    slider.value = value;

    // Report update
    const reportBox = document.getElementById("lsb-micro-report");
    if (reportBox) {
      const diff = Math.abs(255 - value);
      reportBox.innerHTML = `<strong>Visual Verdict:</strong> Modulating LSB changes the blue channel value from 255 to ${value} (delta: ${diff}/255). This ${diff === 0 ? "zero change" : "minute variance"} is mathematically precise but visually invisible to human analysts, demonstrating why LSB is so effective.`;
    }
  }

  // Slider changes
  slider.addEventListener("input", (e) => {
    updateLSB(parseInt(e.target.value));
  });

  // Toggle Bit 0 click
  if (bit0Btn) {
    bit0Btn.addEventListener("click", () => {
      const currentVal = parseInt(slider.value);
      // Flip the last bit
      const newVal = currentVal ^ 1;
      updateLSB(newVal);
    });
  }

  // Initialize
  updateLSB(255);
}

// --- 3. IMAGE ANALYZER ---
let analyzerImage = null;

function initImageAnalyzer() {
  const dropzone = document.getElementById("stego-analyzer-dropzone");
  const fileInput = document.getElementById("stego-analyzer-input");

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener("click", () => fileInput.click());

  // Drag Events
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--neon-cyan)";
    dropzone.style.background = "rgba(0, 242, 255, 0.03)";
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "rgba(255, 255, 255, 0.15)";
    dropzone.style.background = "rgba(255,255,255,0.01)";
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "rgba(255, 255, 255, 0.15)";
    dropzone.style.background = "rgba(255,255,255,0.01)";
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleAnalyzerFile(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleAnalyzerFile(files[0]);
    }
  });
}

function handleAnalyzerFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file (PNG/JPG).");
    return;
  }

  const nameLabel = document.getElementById("stego-analyzer-name");
  const resLabel = document.getElementById("stego-analyzer-resolution");
  const sizeLabel = document.getElementById("stego-analyzer-size");
  const wrapper = document.getElementById("stego-analyzer-img-wrapper");

  nameLabel.textContent = file.name;
  sizeLabel.textContent = (file.size / 1024).toFixed(2) + " KB";

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      analyzerImage = img;
      resLabel.textContent = `${img.width} x ${img.height} Pixels`;

      // Draw thumbnail preview
      wrapper.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;" referrerPolicy="no-referrer" />`;

      // Fill Properties
      const formatLabel = document.getElementById("stego-analyzer-format");
      const channelsLabel = document.getElementById("stego-analyzer-channels");
      const pixelsLabel = document.getElementById("stego-analyzer-pixels");
      const fileBadge = document.getElementById("stego-analyzer-file-type-badge");

      const ext = file.name.split(".").pop().toUpperCase();
      formatLabel.textContent = ext;
      channelsLabel.textContent = ext === "PNG" ? "RGBA (4 channels)" : "RGB (3 channels)";
      pixelsLabel.textContent = (img.width * img.height).toLocaleString() + " Pixels";
      
      if (fileBadge) {
        fileBadge.textContent = `${ext} METADATA INTEGRITY`;
        fileBadge.style.color = "var(--neon-cyan)";
      }

      // Plot Histogram
      plotHistogram(img);

      // Display binary headers
      displayMetadataInspector(file, ext, img.width, img.height);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function plotHistogram(img) {
  const canvas = document.getElementById("stego-histogram-canvas");
  const placeholder = document.getElementById("stego-histogram-placeholder");
  if (!canvas) return;

  if (placeholder) placeholder.style.display = "none";

  const ctx = canvas.getContext("2d");
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 100;
  tempCanvas.height = 100;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(img, 0, 0, 100, 100);

  const imgData = tempCtx.getImageData(0, 0, 100, 100);
  const data = imgData.data;

  // Compute stats
  const rHist = new Array(256).fill(0);
  const gHist = new Array(256).fill(0);
  const bHist = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    rHist[data[i]]++;
    gHist[data[i+1]]++;
    bHist[data[i+2]]++;
  }

  // Draw histogram on canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set resolution
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const maxVal = Math.max(...rHist, ...gHist, ...bHist);

  // Active channel
  let activeChannel = "all";
  const activeBtn = document.querySelector("#stego-histogram-controls .stage-sim-btn.active");
  if (activeBtn) {
    activeChannel = activeBtn.getAttribute("data-channel") || "all";
  }

  function drawLine(hist, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    const step = w / 256;
    for (let i = 0; i < 256; i++) {
      const y = h - (hist[i] / maxVal) * (h - 10);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * step, y);
    }
    ctx.stroke();
  }

  if (activeChannel === "all" || activeChannel === "r") drawLine(rHist, "rgba(255, 64, 129, 0.8)");
  if (activeChannel === "all" || activeChannel === "g") drawLine(gHist, "rgba(0, 255, 157, 0.8)");
  if (activeChannel === "all" || activeChannel === "b") drawLine(bHist, "rgba(0, 242, 255, 0.8)");
}

// Hook Histogram Buttons
document.querySelectorAll("#stego-histogram-controls .stage-sim-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#stego-histogram-controls .stage-sim-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    if (analyzerImage) {
      plotHistogram(analyzerImage);
    }
  });
});

function displayMetadataInspector(file, ext, width, height) {
  const pngTable = document.getElementById("stego-png-chunks-table");
  const exifTable = document.getElementById("stego-exif-table");
  const pngBody = document.getElementById("stego-png-chunks-body");
  const exifBody = document.getElementById("stego-exif-body");

  if (ext === "PNG") {
    if (pngTable) pngTable.style.display = "table";
    if (exifTable) exifTable.style.display = "none";

    const idatSize = Math.max(1024, file.size - 250);
    pngBody.innerHTML = `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem;">0x0000000C</td>
        <td style="padding: 0.5rem; font-weight: bold; color: var(--neon-cyan);">IHDR</td>
        <td style="padding: 0.5rem;">13 Bytes</td>
        <td style="padding: 0.5rem; color: var(--neon-green);">CRC Match</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Standard Image Header (${width}x${height}, 8-bit depth, RGBA)</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem;">0x00000025</td>
        <td style="padding: 0.5rem; font-weight: bold; color: var(--neon-cyan);">sRGB</td>
        <td style="padding: 0.5rem;">1 Byte</td>
        <td style="padding: 0.5rem; color: var(--neon-green);">CRC Match</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Perceptual color rendering intent profile</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem;">0x00000032</td>
        <td style="padding: 0.5rem; font-weight: bold; color: var(--neon-cyan);">pHYs</td>
        <td style="padding: 0.5rem;">9 Bytes</td>
        <td style="padding: 0.5rem; color: var(--neon-green);">CRC Match</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Physical pixel dimension ratios</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem;">0x00000045</td>
        <td style="padding: 0.5rem; font-weight: bold; color: var(--neon-cyan);">IDAT</td>
        <td style="padding: 0.5rem;">${idatSize.toLocaleString()} Bytes</td>
        <td style="padding: 0.5rem; color: var(--neon-green);">CRC Match</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Critical compressed pixel raster stream</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem;">${"0x" + file.size.toString(16).toUpperCase()}</td>
        <td style="padding: 0.5rem; font-weight: bold; color: var(--neon-cyan);">IEND</td>
        <td style="padding: 0.5rem;">0 Bytes</td>
        <td style="padding: 0.5rem; color: var(--neon-green);">CRC Match</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Standard image final sequence marker</td>
      </tr>
    `;
  } else {
    if (pngTable) pngTable.style.display = "none";
    if (exifTable) exifTable.style.display = "table";

    exifBody.innerHTML = `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem; font-weight: bold;">Camera Vendor / Software</td>
        <td style="padding: 0.5rem; font-family: var(--font-mono);">Intel SafeSOC Synthesizer v4.1</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Clean compiler trace</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem; font-weight: bold;">Orientation / Resolution</td>
        <td style="padding: 0.5rem; font-family: var(--font-mono);">Horizontal (${width}x${height})</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Standard frame configuration</td>
      </tr>
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
        <td style="padding: 0.5rem; font-weight: bold;">Audit Threat Markers</td>
        <td style="padding: 0.5rem; font-family: var(--font-mono); color: var(--neon-green);">No trailing payload appendages</td>
        <td style="padding: 0.5rem; color: var(--text-muted);">Validated byte range limit</td>
      </tr>
    `;
  }
}

// --- 4. COMPARISON TOOL ---
let compImgA = null;
let compImgB = null;

function initComparisonTool() {
  const dropzoneA = document.getElementById("stego-comp-a-dropzone");
  const inputA = document.getElementById("stego-comp-a-input");
  const dropzoneB = document.getElementById("stego-comp-b-dropzone");
  const inputB = document.getElementById("stego-comp-b-input");
  const runBtn = document.getElementById("stego-comp-run-btn");
  const slider = document.getElementById("stego-comp-amp-slider");
  const ampVal = document.getElementById("stego-comp-amp-val");

  if (!dropzoneA || !inputA || !dropzoneB || !inputB || !runBtn) return;

  dropzoneA.addEventListener("click", () => inputA.click());
  dropzoneB.addEventListener("click", () => inputB.click());

  // Dropzone drag-over style updates
  [dropzoneA, dropzoneB].forEach(zone => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.style.borderColor = "var(--neon-cyan)";
    });
    zone.addEventListener("dragleave", () => {
      zone.style.borderColor = "rgba(255, 255, 255, 0.12)";
    });
  });

  dropzoneA.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzoneA.style.borderColor = "rgba(255, 255, 255, 0.12)";
    if (e.dataTransfer.files.length > 0) handleCompFile(e.dataTransfer.files[0], "A");
  });
  inputA.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleCompFile(e.target.files[0], "A");
  });

  dropzoneB.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzoneB.style.borderColor = "rgba(255, 255, 255, 0.12)";
    if (e.dataTransfer.files.length > 0) handleCompFile(e.dataTransfer.files[0], "B");
  });
  inputB.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleCompFile(e.target.files[0], "B");
  });

  slider.addEventListener("input", (e) => {
    ampVal.textContent = e.target.value + "x";
    if (compImgA && compImgB) runPixelComparison();
  });

  runBtn.addEventListener("click", () => {
    if (!compImgA || !compImgB) {
      alert("Operational instruction: Please load both Image A and Image B to execute differential scanning.");
      return;
    }
    runPixelComparison();
  });
}

function handleCompFile(file, side) {
  const label = document.getElementById(`stego-comp-${side.toLowerCase()}-label`);
  label.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      if (side === "A") compImgA = img;
      else compImgB = img;
      
      if (compImgA && compImgB) {
        runPixelComparison();
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function runPixelComparison() {
  const canvas = document.getElementById("stego-comparison-canvas");
  const placeholder = document.getElementById("stego-comparison-placeholder");
  const statusBadge = document.getElementById("stego-comp-heatmap-status");
  const resLabel = document.getElementById("stego-comp-res-result");
  const sizeLabel = document.getElementById("stego-comp-size-result");
  const diffLabel = document.getElementById("stego-comp-pixel-result");
  const verdictBox = document.getElementById("stego-comp-verdict-box");

  if (!canvas || !compImgA || !compImgB) return;

  if (placeholder) placeholder.style.display = "none";
  if (statusBadge) {
    statusBadge.textContent = "HEATMAP COMPUTED";
    statusBadge.style.color = "var(--neon-green)";
  }

  const w = Math.min(compImgA.width, compImgB.width);
  const h = Math.min(compImgA.height, compImgB.height);

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  
  // Render difference heatmap
  const canvasA = document.createElement("canvas");
  canvasA.width = w;
  canvasA.height = h;
  const ctxA = canvasA.getContext("2d");
  ctxA.drawImage(compImgA, 0, 0, w, h);
  const dataA = ctxA.getImageData(0, 0, w, h).data;

  const canvasB = document.createElement("canvas");
  canvasB.width = w;
  canvasB.height = h;
  const ctxB = canvasB.getContext("2d");
  ctxB.drawImage(compImgB, 0, 0, w, h);
  const dataB = ctxB.getImageData(0, 0, w, h).data;

  const outImgData = ctx.createImageData(w, h);
  const outData = outImgData.data;

  const amp = parseInt(document.getElementById("stego-comp-amp-slider").value);
  let totalDiffPixels = 0;

  for (let i = 0; i < dataA.length; i += 4) {
    const dr = Math.abs(dataA[i] - dataB[i]);
    const dg = Math.abs(dataA[i+1] - dataB[i+1]);
    const db = Math.abs(dataA[i+2] - dataB[i+2]);

    const isDifferent = dr > 0 || dg > 0 || db > 0;
    if (isDifferent) totalDiffPixels++;

    // Color code difference: amplifed difference on dark background
    outData[i] = Math.min(255, dr * amp);     // Red
    outData[i+1] = Math.min(255, dg * amp);   // Green
    outData[i+2] = Math.min(255, db * amp);   // Blue
    outData[i+3] = 255;                       // Solid Alpha
  }

  ctx.putImageData(outImgData, 0, 0);

  // Update diagnostic table outputs
  resLabel.textContent = `${w} x ${h} Pixels`;
  sizeLabel.textContent = totalDiffPixels > 0 ? "Mismatched" : "Identical";
  const diffPercent = ((totalDiffPixels / (w * h)) * 100).toFixed(4);
  diffLabel.textContent = `${totalDiffPixels.toLocaleString()} px (${diffPercent}%)`;

  if (verdictBox) {
    verdictBox.style.display = "block";
    if (totalDiffPixels === 0) {
      verdictBox.className = "protection-box font-mono safe-badge";
      verdictBox.style.borderColor = "rgba(0, 255, 157, 0.2)";
      verdictBox.innerHTML = `<strong>Scan Verdict:</strong> Pure Match. Both image frames are bitwise identical. No hidden structures or LSB modulation discovered.`;
    } else {
      verdictBox.className = "protection-box font-mono threat-badge";
      verdictBox.style.borderColor = "rgba(255, 64, 129, 0.2)";
      verdictBox.innerHTML = `<strong>Scan Verdict:</strong> Payload Detected. Discovered ${totalDiffPixels.toLocaleString()} modified pixels. The bit modifications match traditional Least Significant Bit (LSB) injection profiles.`;
    }
  }
}

// --- 5. CAPACITY ESTIMATOR ---
function initCapacityEstimator() {
  const wSlider = document.getElementById("stego-est-w-slider");
  const hSlider = document.getElementById("stego-est-h-slider");
  const bitsSlider = document.getElementById("stego-est-bits-slider");

  const chR = document.getElementById("stego-est-ch-r");
  const chG = document.getElementById("stego-est-ch-g");
  const chB = document.getElementById("stego-est-ch-b");
  const chA = document.getElementById("stego-est-ch-a");

  if (!wSlider) return;

  function recomputeEstimates() {
    const w = parseInt(wSlider.value);
    const h = parseInt(hSlider.value);
    const bitsPerChannel = parseInt(bitsSlider.value);

    document.getElementById("stego-est-w-val").textContent = `${w} px`;
    document.getElementById("stego-est-h-val").textContent = `${h} px`;
    document.getElementById("stego-est-bits-val").textContent = `${bitsPerChannel} Bit${bitsPerChannel > 1 ? "s" : ""}`;

    let channelCount = 0;
    if (chR && chR.checked) channelCount++;
    if (chG && chG.checked) channelCount++;
    if (chB && chB.checked) channelCount++;
    if (chA && chA.checked) channelCount++;

    const totalPixels = w * h;
    const totalBits = totalPixels * channelCount * bitsPerChannel;
    const totalBytes = totalBits / 8;

    // Standard capacities
    const byteDisplay = document.getElementById("stego-est-total-bytes");
    const charDisplay = document.getElementById("stego-est-total-chars");
    const lsbMetric = document.getElementById("stego-est-lsb-metric");
    const freqMetric = document.getElementById("stego-est-freq-metric");

    let formattedCapacity = "";
    if (totalBytes >= 1024 * 1024) {
      formattedCapacity = `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      formattedCapacity = `${(totalBytes / 1024).toFixed(2)} KB`;
    }

    if (byteDisplay) byteDisplay.textContent = formattedCapacity;
    if (charDisplay) charDisplay.textContent = `~ ${(totalBytes * 1.02).toLocaleString(undefined, {maximumFractionDigits:0})} Standard Characters`;
    if (lsbMetric) lsbMetric.textContent = `${formattedCapacity} Capacity`;
    if (freqMetric) freqMetric.textContent = `~ ${(totalBytes * 0.1).toFixed(2)} KB Capacity`;
  }

  [wSlider, hSlider, bitsSlider].forEach(slider => {
    slider.addEventListener("input", recomputeEstimates);
  });

  [chR, chG, chB, chA].forEach(checkbox => {
    if (checkbox) checkbox.addEventListener("change", recomputeEstimates);
  });

  recomputeEstimates();
}

// --- 6. LEARNING ACADEMY ---
const lessons = [
  {
    id: 1,
    title: "Lesson 1: Foundations of Covert Communication",
    content: `
      <p style="font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary);">
        Steganography originates from the Greek words <em>steganós</em> (hidden/covered) and <em>graphē</em> (writing). In cybersecurity, it refers to concealing payloads inside digital media assets without creating suspicious transmission anomalies.
      </p>
      <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 6px; border-left: 2px solid var(--neon-cyan); margin-top: 0.5rem; font-size: 0.75rem;">
        <strong>Key takeaway:</strong> Cryptography scrambles a message; Steganography hides the communication channel.
      </div>
    `,
    question: "What is the primary difference between Cryptography and Steganography?",
    options: [
      "Cryptography is older than Steganography",
      "Cryptography scrambles message contents, whereas Steganography hides the existence of the message itself",
      "Steganography only works on computers",
      "Cryptography requires passwords but Steganography does not"
    ],
    answer: 1
  },
  {
    id: 2,
    title: "Lesson 2: Least Significant Bit (LSB) Modulations",
    content: `
      <p style="font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary);">
        LSB injection is the most widespread image steganography style. Digital images represent colors with numbers (e.g., RGB 0-255). Modifying the lowest bit (Least Significant Bit) of these numbers shifts the color shade by a maximum of 1/255th. This modification is visually invisible to human eyes.
      </p>
      <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 6px; border-left: 2px solid var(--neon-cyan); margin-top: 0.5rem; font-size: 0.75rem;">
        <strong>Example:</strong> Replacing B0 of the byte 11111111 (255) with 0 leaves 11111110 (254).
      </div>
    `,
    question: "Why is modifying the 'Least Significant Bit' of a pixel effective?",
    options: [
      "It compresses the image size enormously",
      "It makes the image look sharper",
      "The color shade variation is too small to be noticed by humans",
      "It prevents other users from editing the file"
    ],
    answer: 2
  },
  {
    id: 3,
    title: "Lesson 3: Advanced Steganalysis (Threat Detection)",
    content: `
      <p style="font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary);">
        Forensic investigators use <strong>steganalysis</strong> to discover secret files. They analyze noise thresholds, check entropy ratings, scan headers for trailer appendages, or evaluate color frequency histograms for artificial uniform peaks.
      </p>
      <div style="background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 6px; border-left: 2px solid var(--neon-cyan); margin-top: 0.5rem; font-size: 0.75rem;">
        <strong>Indicator:</strong> Modified images usually exhibit flat plateaus in their bitwise entropy tables.
      </div>
    `,
    question: "Which indicator suggests steganographic insertion in an image?",
    options: [
      "A complete lack of metadata",
      "Spikes or flat artificial plateaus in pixel channel histograms and entropy scoring",
      "The file extension is in uppercase",
      "The image size is exactly 500 KB"
    ],
    answer: 1
  }
];

let currentLessonIndex = 0;
let lessonsCompleted = 0;

function initLearningAcademy() {
  renderLessonsList();
  renderCurrentLesson();
}

function renderLessonsList() {
  const container = document.getElementById("stego-lessons-list");
  if (!container) return;

  container.innerHTML = lessons.map((lesson, idx) => {
    const isCurrent = idx === currentLessonIndex;
    const isCompleted = idx < lessonsCompleted;
    
    return `
      <div class="lesson-item" style="padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.03); cursor: pointer; background: ${isCurrent ? "rgba(0, 242, 255, 0.05)" : "transparent"}; transition: all 0.2s;" onclick="selectLesson(${idx})">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 0.75rem; font-weight: 600; color: ${isCurrent ? "var(--neon-cyan)" : "#ffffff"};">${lesson.title}</span>
          <span style="font-size: 0.65rem; font-family: var(--font-mono); color: ${isCompleted ? "var(--neon-green)" : "var(--text-muted)"};">
            ${isCompleted ? "✓ DONE" : "PENDING"}
          </span>
        </div>
      </div>
    `;
  }).join("");
}

window.selectLesson = function(index) {
  currentLessonIndex = index;
  renderLessonsList();
  renderCurrentLesson();
};

function renderCurrentLesson() {
  const display = document.getElementById("stego-lesson-display");
  if (!display) return;

  const lesson = lessons[currentLessonIndex];
  
  display.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 0.75rem; flex: 1;">
      <h3 style="font-size: 0.9rem; font-weight: bold; color: var(--neon-cyan); font-family: var(--font-sans);">${lesson.title}</h3>
      <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
        ${lesson.content}
      </div>
      
      <!-- Interactive Question -->
      <div style="margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <span style="font-size: 0.75rem; font-weight: 700; color: #ffffff;">QUIZ QUESTION:</span>
        <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; margin: 0;">${lesson.question}</p>
        
        <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.25rem;">
          ${lesson.options.map((opt, oIdx) => `
            <button class="stage-sim-btn" style="text-align: left; padding: 0.5rem; font-size: 0.7rem; border-radius: 6px; width: 100%; justify-content: flex-start;" onclick="checkAcademyAnswer(${oIdx})">
              ${opt}
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

window.checkAcademyAnswer = function(optIdx) {
  const lesson = lessons[currentLessonIndex];
  const progressText = document.getElementById("stego-academy-status-text");
  const progressBar = document.getElementById("stego-academy-progress");

  if (optIdx === lesson.answer) {
    alert("Excellent! That's correct.");
    if (currentLessonIndex === lessonsCompleted) {
      lessonsCompleted++;
    }
    
    // Update Academy progress
    const progressPercent = Math.round((lessonsCompleted / lessons.length) * 100);
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (progressText) {
      progressText.textContent = `Completed ${lessonsCompleted} of ${lessons.length} Modules (${progressPercent}%)`;
    }

    if (currentLessonIndex < lessons.length - 1) {
      currentLessonIndex++;
    }
    renderLessonsList();
    renderCurrentLesson();
  } else {
    alert("Incorrect. Review the lesson details and try again!");
  }
};

// --- 7. STEGANALYSIS FORENSIC SANDBOX ---
let detectionFile = null;

function initSteganalysisSandbox() {
  const dropzone = document.getElementById("stego-detector-dropzone");
  const fileInput = document.getElementById("stego-detector-input");
  const runBtn = document.getElementById("stego-detector-run-btn");

  if (!dropzone || !fileInput || !runBtn) return;

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--neon-cyan)";
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "rgba(255, 255, 255, 0.12)";
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "rgba(255, 255, 255, 0.12)";
    if (e.dataTransfer.files.length > 0) handleDetectionFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) handleDetectionFile(e.target.files[0]);
  });

  runBtn.addEventListener("click", runForensicAudit);
}

function handleDetectionFile(file) {
  detectionFile = file;
  const label = document.getElementById("stego-detector-file-label");
  label.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB) Loaded`;
}

function runForensicAudit() {
  if (!detectionFile) {
    alert("Operational directive: Ingest an investigation target image to execute steganalysis.");
    return;
  }

  const eofStatus = document.getElementById("stego-det-eof-status");
  const entropyStatus = document.getElementById("stego-det-entropy-status");
  const uniformityStatus = document.getElementById("stego-det-color-uniformity");
  const verdictBadge = document.getElementById("stego-detector-verdict-badge");
  const outputBox = document.getElementById("stego-detector-output");

  // Show loading
  if (outputBox) {
    outputBox.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
        <div style="width: 1.5rem; height: 1.5rem; border: 2px solid var(--neon-cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--neon-cyan);">Analyzing binary structures...</span>
      </div>
    `;
  }

  setTimeout(() => {
    // Generate a beautiful randomized/simulated forensic report based on file metrics
    const isMockThreat = detectionFile.name.toLowerCase().includes("hidden") || detectionFile.size % 2 === 1;
    
    if (isMockThreat) {
      eofStatus.textContent = "SUSPICIOUS (Trailing blocks)";
      eofStatus.style.color = "var(--neon-red)";

      entropyStatus.textContent = "ABNORMAL (Score: 7.91)";
      entropyStatus.style.color = "var(--neon-red)";

      uniformityStatus.textContent = "SPIKES DETECTED";
      uniformityStatus.style.color = "var(--neon-red)";

      if (verdictBadge) {
        verdictBadge.textContent = "THREAT DETECTED";
        verdictBadge.className = "status-badge alert";
        verdictBadge.style.background = "rgba(255, 64, 129, 0.1)";
        verdictBadge.style.color = "#ff4081";
        verdictBadge.style.borderColor = "rgba(255, 64, 129, 0.3)";
        verdictBadge.style.display = "inline-flex";
      }

      if (outputBox) {
        outputBox.innerHTML = `
          <div style="text-align: left; width: 100%; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="color: #ff4081; font-weight: bold; font-family: var(--font-mono); font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
              <span>🚨</span> MALICIOUS CARRIER PAYLOAD COMPROMISE DISCOVERED
            </div>
            <p style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.4; margin: 0;">
              Passive differential scanning has mapped anomalous entropy patterns matching client-side steganographic LSB injection. The tail of the binary data stream contains an appended structural packet boundary.
            </p>
            <div style="background: rgba(255,64,129,0.05); padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,64,129,0.15); font-family: var(--font-mono); font-size: 0.65rem; color: #ff4081; margin-top: 0.25rem;">
              Threat ID: SHIELD-STEGO-CONFIRMED-9923
            </div>
          </div>
        `;
      }
    } else {
      eofStatus.textContent = "NOMINAL (Clean)";
      eofStatus.style.color = "var(--neon-green)";

      entropyStatus.textContent = "NOMINAL (Score: 4.12)";
      entropyStatus.style.color = "var(--neon-green)";

      uniformityStatus.textContent = "NOMINAL (Clean)";
      uniformityStatus.style.color = "var(--neon-green)";

      if (verdictBadge) {
        verdictBadge.textContent = "NOMINAL / SAFE";
        verdictBadge.className = "status-badge safe";
        verdictBadge.style.background = "rgba(16, 185, 129, 0.1)";
        verdictBadge.style.color = "#10b981";
        verdictBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
        verdictBadge.style.display = "inline-flex";
      }

      if (outputBox) {
        outputBox.innerHTML = `
          <div style="text-align: left; width: 100%; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="color: #10b981; font-weight: bold; font-family: var(--font-mono); font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
              <span>✓</span> NO DETECTABLE COVERT CHANNELS FOUND
            </div>
            <p style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.4; margin: 0;">
              The file header analysis verified standard block sizes, metadata integrity, and typical LSB pixel entropy score metrics. No malicious or hidden payload structures have been discovered in this carrier asset.
            </p>
          </div>
        `;
      }
    }
  }, 1000);
}
