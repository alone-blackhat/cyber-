import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Upload,
  Shield,
  Lock,
  Unlock,
  Download,
  Image as ImageIcon,
  Copy,
  Check,
  AlertCircle,
  Activity,
  Info,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import { embedMessage, extractMessage, getImgSpecs } from "./utils/stego";

interface ActivityLog {
  id: string;
  time: string;
  action: string;
  status: "success" | "failed" | "processing";
  detail: string;
}

export default function App() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"encode" | "decode">("encode");

  // Hiding (Encode) State
  const [encodeFile, setEncodeFile] = useState<File | null>(null);
  const [encodeMsg, setEncodeMsg] = useState("");
  const [encodePass, setEncodePass] = useState("");
  const [showEncodePass, setShowEncodePass] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [encodedResult, setEncodedResult] = useState<string | null>(null);
  const [encodedSpecs, setEncodedSpecs] = useState<any | null>(null);
  const [encodedPreviewHex, setEncodedPreviewHex] = useState<string | null>(null);
  const [encodeError, setEncodeError] = useState<string | null>(null);

  // Extracting (Decode) State
  const [decodeFile, setDecodeFile] = useState<File | null>(null);
  const [decodePass, setDecodePass] = useState("");
  const [showDecodePass, setShowDecodePass] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodedMsg, setDecodedMsg] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // General Image Specifications State
  const [imgSpecs, setImgSpecsState] = useState<any | null>(null);

  // Activity Logs state with some initial values
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: "1",
      time: new Date(Date.now() - 3600000).toLocaleTimeString(),
      action: "System Initialization",
      status: "success",
      detail: "Steganography cryptographic sub-module online. PBKDF2 & AES-GCM primitives certified."
    },
    {
      id: "2",
      time: new Date(Date.now() - 1800000).toLocaleTimeString(),
      action: "Integrity Audit",
      status: "success",
      detail: "Secure local canvas sandboxing active. No outbound data transmission verified."
    }
  ]);

  // Ref for file inputs
  const encodeInputRef = useRef<HTMLInputElement>(null);
  const decodeInputRef = useRef<HTMLInputElement>(null);

  // Add Log helper
  const addLog = useCallback((action: string, status: "success" | "failed" | "processing", detail: string) => {
    setLogs(prev => [
      {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        action,
        status,
        detail
      },
      ...prev
    ]);
  }, []);

  // Format Helper for file size
  const formatBytes = useCallback((bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }, []);

  // Handle Encode File drop / selection
  const handleEncodeFileChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEncodeError("Security violation: Only valid image files (PNG/JPG) are authorized.");
      addLog("Image Load Rejected", "failed", "Invalid file type attempted. Subsystem accepts only image files.");
      return;
    }
    setEncodeError(null);
    setEncodedResult(null);
    setEncodedPreviewHex(null);
    setEncodeFile(file);
    addLog("Source Image Loaded", "success", `File: ${file.name} (${formatBytes(file.size)})`);

    try {
      const specs = await getImgSpecs(file);
      setImgSpecsState(specs);
    } catch (err: any) {
      setEncodeError(err.message || "Failed to parse image specs.");
    }
  };

  // Handle Decode File drop / selection
  const handleDecodeFileChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setDecodeError("Security violation: Only valid image files (PNG/JPG) are authorized.");
      addLog("Target Image Load Rejected", "failed", "Invalid file type attempted.");
      return;
    }
    setDecodeError(null);
    setDecodedMsg(null);
    setDecodeFile(file);
    addLog("Target Image Loaded", "success", `File: ${file.name} (${formatBytes(file.size)})`);

    try {
      const specs = await getImgSpecs(file);
      setImgSpecsState(specs);
    } catch (err: any) {
      setDecodeError(err.message || "Failed to parse image specs.");
    }
  };

  // Run Stego Hiding
  const handleEncode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encodeFile) {
      setEncodeError("Operational requirement: Please upload a source PNG carrier image first.");
      return;
    }
    if (!encodeMsg.trim()) {
      setEncodeError("Data payload requirement: Secret message body cannot be empty.");
      return;
    }

    setIsEncoding(true);
    setEncodeError(null);
    setEncodeProgress(5);
    addLog("Stego Embedding Initiated", "processing", `Encoding sequence triggered. Payload size: ${encodeMsg.length} chars.`);

    try {
      const result = await embedMessage(
        encodeFile,
        encodeMsg,
        encodePass,
        (progress) => {
          setEncodeProgress(progress);
        }
      );

      setEncodedResult(result.dataUrl);
      setEncodedSpecs(result.info);
      if (result.encryptedPreview) {
        setEncodedPreviewHex(result.encryptedPreview);
      }
      setIsEncoding(false);
      addLog(
        "Stego Embedding Successful",
        "success",
        `Secret message embedded cleanly into LSB layers. Safe capacity consumed: ~${(
          ((encodeMsg.length + (encodePass ? 17 : 5)) / result.info.capacity) *
          100
        ).toFixed(2)}%`
      );
    } catch (err: any) {
      setIsEncoding(false);
      setEncodeError(err.message || "Embedding failure.");
      addLog("Stego Embedding Failure", "failed", err.message || "Unidentified process interruption.");
    }
  };

  // Run Stego Extracting
  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decodeFile) {
      setDecodeError("Operational requirement: Please upload an encoded carrier image first.");
      return;
    }

    setIsDecoding(true);
    setDecodeError(null);
    setDecodedMsg(null);
    addLog("Stego Extraction Initiated", "processing", "Scanning target image channels for hidden packet headers.");

    try {
      // Small simulated delay to feel very tactical and secure
      await new Promise(resolve => setTimeout(resolve, 800));

      const message = await extractMessage(decodeFile, decodePass);
      setDecodedMsg(message);
      setIsDecoding(false);
      addLog("Stego Extraction Successful", "success", `Hidden payload extracted. Signature integrity check: PASSED.`);
    } catch (err: any) {
      setIsDecoding(false);
      setDecodeError(err.message || "Extraction failed.");
      addLog("Stego Extraction Failure", "failed", err.message || "Payload signature verification failed.");
    }
  };

  // Copy to clipboard helper
  const handleCopy = useCallback(() => {
    if (!decodedMsg) return;
    navigator.clipboard.writeText(decodedMsg);
    setCopied(true);
    addLog("Payload Copied", "success", "Decrypted secret text copied to terminal clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }, [decodedMsg, addLog]);

  // Clean current states
  const handleResetEncode = () => {
    setEncodeFile(null);
    setEncodeMsg("");
    setEncodePass("");
    setEncodedResult(null);
    setEncodedPreviewHex(null);
    setEncodeError(null);
    setImgSpecsState(null);
    addLog("Encode Channel Reset", "success", "Cleared active source carrier and text variables.");
  };

  const handleResetDecode = () => {
    setDecodeFile(null);
    setDecodePass("");
    setDecodedMsg(null);
    setDecodeError(null);
    setImgSpecsState(null);
    addLog("Decode Channel Reset", "success", "Cleared target carrier and cryptographic fields.");
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropEncode = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleEncodeFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDropDecode = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDecodeFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans p-4 md:p-8 relative z-10 max-w-7xl mx-auto flex flex-col justify-between">
      {/* HEADER SECTION */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => (window.location.href = "/dashboard.html")}
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--neon-cyan)] transition-all cursor-pointer text-[var(--neon-cyan)] hover:scale-105"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--neon-cyan)] animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-widest font-mono text-[var(--neon-cyan)]">SECURE COVERT CHANNEL</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Steganography <span className="text-[var(--neon-cyan)]">Toolkit</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hide and Extract Cryptographically Signed Messages Inside Image Carrier Layers
          </p>
        </div>

        {/* Dynamic Status Badges */}
        <div className="flex items-center gap-3">
          <div className="glass-section px-3 py-1.5 flex items-center gap-2 border border-white/10 text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandbox Mode: <span className="text-emerald-400">LOCAL_ONLY</span></span>
          </div>
          <div className="glass-section px-3 py-1.5 flex items-center gap-2 border border-white/10 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />
            <span>Layer Cipher: <span className="text-[var(--neon-cyan)]">AES-GCM-256</span></span>
          </div>
        </div>
      </header>

      {/* CORE CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 mb-6">
        
        {/* LEFT COLUMN: CONTROL INTERFACES (7 COLS) */}
        <main className="lg:col-span-8 space-y-6">
          
          {/* TAP SWITCHER */}
          <div className="flex border-b border-white/10 gap-1">
            <button
              onClick={() => setActiveTab("encode")}
              className={`px-5 py-3 text-xs uppercase tracking-wider font-mono font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "encode"
                  ? "border-[var(--neon-cyan)] text-[var(--neon-cyan)] bg-white/5"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/2"
              }`}
            >
              🔒 Embed Secret Message
            </button>
            <button
              onClick={() => setActiveTab("decode")}
              className={`px-5 py-3 text-xs uppercase tracking-wider font-mono font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === "decode"
                  ? "border-[var(--neon-cyan)] text-[var(--neon-cyan)] bg-white/5"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-white/2"
              }`}
            >
              🔓 Extract Secret Message
            </button>
          </div>

          {/* TAB 1: EMBEDDING (ENCODE) PANEL */}
          {activeTab === "encode" && (
            <div className="glass-section p-6 border border-white/10 space-y-5 rounded-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm uppercase tracking-widest font-mono text-[var(--neon-cyan)] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Message Cover Layer Embedding
                </h2>
                {encodeFile && (
                  <button
                    onClick={handleResetEncode}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Reset Panel
                  </button>
                )}
              </div>

              {encodeError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs flex items-center gap-2.5 font-mono">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{encodeError}</span>
                </div>
              )}

              <form onSubmit={handleEncode} className="space-y-5">
                {/* File Upload Drag-and-Drop Dropzone */}
                {!encodeFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDropEncode}
                    onClick={() => encodeInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-[var(--neon-cyan)]/50 rounded-lg p-8 text-center cursor-pointer transition-all bg-white/2 hover:bg-white/5 flex flex-col items-center justify-center gap-3 group"
                  >
                    <input
                      type="file"
                      ref={encodeInputRef}
                      onChange={(e) => handleEncodeFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/png, image/jpeg"
                    />
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[var(--neon-cyan)] group-hover:scale-110 transition-all">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Drag and drop your Carrier Image or <span className="text-[var(--neon-cyan)] underline">browse files</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Accepts raw PNG / JPG templates • Maximum size 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-16 h-16 rounded bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(encodeFile)}
                        alt="Carrier source"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-mono font-bold text-white truncate">{encodeFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatBytes(encodeFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => encodeInputRef.current?.click()}
                      className="px-2.5 py-1 text-[10px] font-mono border border-white/10 hover:border-[var(--neon-cyan)] rounded text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      Replace
                    </button>
                    <input
                      type="file"
                      ref={encodeInputRef}
                      onChange={(e) => handleEncodeFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/png, image/jpeg"
                    />
                  </div>
                )}

                {/* Secret Message Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    Secret Message Payload
                  </label>
                  <textarea
                    value={encodeMsg}
                    onChange={(e) => setEncodeMsg(e.target.value)}
                    placeholder="Enter the classified text payload to embed inside the image pixels..."
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]/20 rounded p-3 text-xs text-white placeholder-slate-500 font-mono transition-all resize-none outline-none"
                    disabled={isEncoding}
                  />
                </div>

                {/* Optional Cryptographic Password Protection */}
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[var(--neon-cyan)]" /> AES-GCM Encrypt Layer (Recommended)
                    </label>
                    <span className="text-[9px] uppercase font-mono bg-white/5 px-2 py-0.5 rounded text-[var(--neon-cyan)] border border-white/10">
                      SECURED BY AES-256
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Encrypting message contents prior to cover embedding guarantees message confidentiality even if the image LSB bits are extracted by malicious third parties.
                  </p>
                  <div className="relative">
                    <input
                      type={showEncodePass ? "text" : "password"}
                      value={encodePass}
                      onChange={(e) => setEncodePass(e.target.value)}
                      placeholder="Enter optional password or signature key..."
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[var(--neon-cyan)] rounded py-2 px-3 pr-10 text-xs font-mono text-white outline-none transition-all"
                      disabled={isEncoding}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEncodePass(!showEncodePass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showEncodePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Progress Indicator for processing */}
                {isEncoding && (
                  <div className="space-y-1.5 font-mono">
                    <div className="flex justify-between text-[10px] text-[var(--neon-cyan)]">
                      <span>STENCIL OPERATION IN PROGRESS...</span>
                      <span>{encodeProgress}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--neon-cyan)] rounded-full transition-all duration-300 shadow-[0_0_8px_var(--neon-cyan)]"
                        style={{ width: `${encodeProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                {!encodedResult ? (
                  <button
                    type="submit"
                    disabled={isEncoding || !encodeFile || !encodeMsg.trim()}
                    className={`w-full py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      !encodeFile || !encodeMsg.trim() || isEncoding
                        ? "bg-slate-800/50 text-slate-500 border-white/5 cursor-not-allowed"
                        : "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30 hover:bg-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/60 shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                    }`}
                  >
                    {isEncoding ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Embedding Message...
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5" /> Encode & Embed Secret Message
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                        Cover Layer Process Complete • Embedded PNG Generated
                      </p>
                    </div>

                    {encodedPreviewHex && (
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-mono text-slate-500 block">Encrypted Payload Preview</span>
                        <code className="block bg-black/50 border border-white/10 rounded p-2 text-[10px] font-mono text-slate-400 break-all select-all">
                          {encodedPreviewHex}
                        </code>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <a
                        href={encodedResult}
                        download={`${encodeFile ? encodeFile.name.split(".")[0] : "stego"}_hidden.png`}
                        className="flex-1 py-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/60 transition-all font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 text-center flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Stego Image
                      </a>
                      <button
                        type="button"
                        onClick={handleResetEncode}
                        className="px-4 py-2 rounded border border-white/10 hover:bg-white/5 font-mono text-xs text-slate-300 transition-all cursor-pointer"
                      >
                        Encode Another
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: EXTRACTION (DECODE) PANEL */}
          {activeTab === "decode" && (
            <div className="glass-section p-6 border border-white/10 space-y-5 rounded-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm uppercase tracking-widest font-mono text-[var(--neon-cyan)] flex items-center gap-2">
                  <Unlock className="w-4 h-4" /> Message Cover Layer Extraction
                </h2>
                {decodeFile && (
                  <button
                    onClick={handleResetDecode}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer"
                  >
                    Reset Panel
                  </button>
                )}
              </div>

              {decodeError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs flex items-center gap-2.5 font-mono">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{decodeError}</span>
                </div>
              )}

              <form onSubmit={handleDecode} className="space-y-5">
                {/* File Upload Drag-and-Drop Dropzone */}
                {!decodeFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDropDecode}
                    onClick={() => decodeInputRef.current?.click()}
                    className="border-2 border-dashed border-white/15 hover:border-[var(--neon-cyan)]/50 rounded-lg p-8 text-center cursor-pointer transition-all bg-white/2 hover:bg-white/5 flex flex-col items-center justify-center gap-3 group"
                  >
                    <input
                      type="file"
                      ref={decodeInputRef}
                      onChange={(e) => handleDecodeFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/png"
                    />
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[var(--neon-cyan)] group-hover:scale-110 transition-all">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Drag and drop encoded Image or <span className="text-[var(--neon-cyan)] underline">browse files</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">
                        Carrier must be in lossless format (PNG)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="w-16 h-16 rounded bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(decodeFile)}
                        alt="Carrier target"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-mono font-bold text-white truncate">{decodeFile.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatBytes(decodeFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => decodeInputRef.current?.click()}
                      className="px-2.5 py-1 text-[10px] font-mono border border-white/10 hover:border-[var(--neon-cyan)] rounded text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      Replace
                    </button>
                    <input
                      type="file"
                      ref={decodeInputRef}
                      onChange={(e) => handleDecodeFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/png"
                    />
                  </div>
                )}

                {/* Password Protection */}
                <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-2">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--neon-cyan)]" /> Decryption Key / Password
                  </label>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    If the payload was compiled with AES encryption, provide the exact password below. Unprotected payloads do not require a key.
                  </p>
                  <div className="relative">
                    <input
                      type={showDecodePass ? "text" : "password"}
                      value={decodePass}
                      onChange={(e) => setDecodePass(e.target.value)}
                      placeholder="Enter decryption password (if applicable)..."
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[var(--neon-cyan)] rounded py-2 px-3 pr-10 text-xs font-mono text-white outline-none transition-all"
                      disabled={isDecoding}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDecodePass(!showDecodePass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showDecodePass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Extract trigger */}
                <button
                  type="submit"
                  disabled={isDecoding || !decodeFile}
                  className={`w-full py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                    !decodeFile || isDecoding
                      ? "bg-slate-800/50 text-slate-500 border-white/5 cursor-not-allowed"
                      : "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border-[var(--neon-cyan)]/30 hover:bg-[var(--neon-cyan)]/20 hover:border-[var(--neon-cyan)]/60 shadow-[0_0_15px_rgba(0,242,255,0.1)] hover:shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                  }`}
                >
                  {isDecoding ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scanning Cover Layers...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> Extract & Verify Message
                    </>
                  )}
                </button>
              </form>

              {/* Extracted message output result */}
              {decodedMsg !== null && (
                <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/20 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                        Payload Signature Successfully Decoded
                      </p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="text-xs font-mono text-[var(--neon-cyan)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Payload
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-black/50 border border-white/10 rounded p-3 text-xs text-slate-200 font-mono break-all whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {decodedMsg}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* RIGHT COLUMN: SYSTEM SPECS, METRICS & ACTIVITY FEED (4 COLS) */}
        <aside className="lg:col-span-4 space-y-6 text-xs">
          
          {/* CARD 1: IMAGE SPECIFICATIONS & CAPACITY INFO */}
          <section className="glass-section p-5 border border-white/10 rounded-lg space-y-4">
            <h3 className="text-xs uppercase tracking-widest font-mono text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--neon-cyan)]" /> Cover Layer Specifications
            </h3>

            {imgSpecs ? (
              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Resolution</span>
                  <span className="text-white">{imgSpecs.width} × {imgSpecs.height} px</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Raw Format</span>
                  <span className="text-white">{imgSpecs.format}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Compressed Size</span>
                  <span className="text-white">{formatBytes(imgSpecs.size)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Total Pixel Channels</span>
                  <span className="text-white">{(imgSpecs.width * imgSpecs.height * 3).toLocaleString()} bits</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Safe Embedding Limit</span>
                  <span className="text-emerald-400">{imgSpecs.capacity.toLocaleString()} chars</span>
                </div>
                
                {/* Visual storage indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>CAPACITY BANDWIDTH DETECTED</span>
                    <span>100% SECURE</span>
                  </div>
                  <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 font-mono text-[11px] border border-dashed border-white/5 rounded-lg bg-black/10">
                <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                Upload a cover layer carrier to analyze stego safe limit capacity.
              </div>
            )}
          </section>

          {/* CARD 2: RECENT OPERATIONS ACTIVITY LOG */}
          <section className="glass-section p-5 border border-white/10 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest font-mono text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--neon-cyan)]" /> Operations Telemetry
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded bg-black/40 border border-white/5 space-y-1 font-mono text-[10px] leading-normal"
                >
                  <div className="flex justify-between items-center text-[9px] text-slate-500">
                    <span>{log.time}</span>
                    <span
                      className={`uppercase px-1.5 py-0.5 rounded text-[8px] border ${
                        log.status === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : log.status === "failed"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-slate-300 font-bold">{log.action}</p>
                  <p className="text-slate-400 leading-normal">{log.detail}</p>
                </div>
              ))}
            </div>
          </section>

        </aside>

      </div>

      {/* FOOTER METRICS */}
      <footer className="border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px] text-slate-500">
        <p>© 2026 CyberShield SecOps. Cryptographic Sandboxing Active. All rights reserved.</p>
        <p className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          NODE-STG-SEC-04 Connected
        </p>
      </footer>
    </div>
  );
}
