/**
 * Steganography Utility
 * Least Significant Bit (LSB) method for embedding and extracting messages.
 * Includes optional AES-GCM encryption using standard Web Crypto API.
 */

// Helper to hash password into a key
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBuffer);
  return crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Embeds a message into an image file (PNG).
 * @param imageFile The source PNG image file.
 * @param message The secret message to embed.
 * @param password Optional password for AES-GCM encryption.
 * @param onProgress Optional progress callback.
 */
export async function embedMessage(
  imageFile: File,
  message: string,
  password?: string,
  onProgress?: (progress: number) => void
): Promise<{ dataUrl: string; encryptedPreview?: string; info: any }> {
  if (onProgress) onProgress(10);

  // 1. Prepare the payload bytes
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  let payloadBytes: Uint8Array;
  let isEncrypted = false;
  let encryptedPreviewStr = "";

  if (password && password.trim() !== "") {
    isEncrypted = true;
    if (onProgress) onProgress(20);
    
    // Encrypt
    const key = await deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      messageBytes
    );
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    
    // Hex representation for the encrypted preview
    encryptedPreviewStr = Array.from(iv)
      .concat(Array.from(encryptedBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 64) + "... [AES-GCM-256 Secured]";

    // Payload: [IV (12 bytes)][Ciphertext]
    payloadBytes = new Uint8Array(iv.length + encryptedBytes.length);
    payloadBytes.set(iv, 0);
    payloadBytes.set(encryptedBytes, iv.length);
  } else {
    payloadBytes = messageBytes;
  }

  if (onProgress) onProgress(45);

  // Total packet: [Length (4 bytes)][IsEncrypted (1 byte)][Payload]
  const packetLength = payloadBytes.length;
  const fullPacket = new Uint8Array(4 + 1 + packetLength);
  
  // Write length as 32-bit unsigned integer (Little Endian)
  fullPacket[0] = packetLength & 0xFF;
  fullPacket[1] = (packetLength >> 8) & 0xFF;
  fullPacket[2] = (packetLength >> 16) & 0xFF;
  fullPacket[3] = (packetLength >> 24) & 0xFF;
  
  // Write encryption flag
  fullPacket[4] = isEncrypted ? 1 : 0;
  
  // Write payload
  fullPacket.set(payloadBytes, 5);

  // 2. Load the image into canvas
  if (onProgress) onProgress(60);
  const img = await loadImage(imageFile);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context.");
  }
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const pixelData = imgData.data;

  // Calculate capacity
  // 3 channels (R, G, B) per pixel, skipping alpha
  const maxCapacityBytes = Math.floor((pixelData.length * 3) / 32); // each pixel rgba has 3 channels we can write, 1 bit per channel

  if (fullPacket.length * 8 > (pixelData.length * 3) / 4) {
    // Let's keep a margin of alpha channels and safety
    const actualBitsAvailable = Math.floor((pixelData.length * 3) / 4);
    if (fullPacket.length * 8 > actualBitsAvailable) {
      throw new Error(`Message is too large for this image. Maximum safe payload size is ${Math.floor(actualBitsAvailable / 8)} bytes.`);
    }
  }

  if (onProgress) onProgress(80);

  // Convert packet to bit array
  const bits: number[] = [];
  for (let i = 0; i < fullPacket.length; i++) {
    const byte = fullPacket[i];
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      bits.push((byte >> bitIdx) & 1);
    }
  }

  // Embed bits into pixel channels (skip A)
  let bitPointer = 0;
  for (let i = 0; i < pixelData.length && bitPointer < bits.length; i++) {
    if (i % 4 === 3) continue; // skip alpha channel
    pixelData[i] = (pixelData[i] & 0xFE) | bits[bitPointer];
    bitPointer++;
  }

  ctx.putImageData(imgData, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");

  if (onProgress) onProgress(100);

  return {
    dataUrl,
    encryptedPreview: encryptedPreviewStr || undefined,
    info: {
      width: img.width,
      height: img.height,
      size: imageFile.size,
      format: "PNG",
      capacity: maxCapacityBytes
    }
  };
}

/**
 * Extracts a secret message from an encoded image file.
 * @param imageFile The encoded image file.
 * @param password Optional password if AES-GCM encryption was used.
 */
export async function extractMessage(
  imageFile: File,
  password?: string
): Promise<string> {
  const img = await loadImage(imageFile);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context.");
  }
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const pixelData = imgData.data;

  // Extract all bits from R, G, B channels
  const bits: number[] = [];
  for (let i = 0; i < pixelData.length; i++) {
    if (i % 4 === 3) continue; // skip Alpha
    bits.push(pixelData[i] & 1);
  }

  // Convert bits back to bytes
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      byte |= (bits[i * 8 + bitIdx] << bitIdx);
    }
    bytes[i] = byte;
  }

  // Read length (bytes 0-3)
  const length = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24);
  
  if (length <= 0 || length > bytes.length - 5) {
    throw new Error("Decoding failure: No valid hidden signature or packet boundary detected in this image.");
  }

  // Read encryption flag (byte 4)
  const isEncrypted = bytes[4] === 1;

  // Read payload bytes
  const payloadBytes = bytes.slice(5, 5 + length);

  if (isEncrypted) {
    if (!password || password.trim() === "") {
      throw new Error("Decoding alert: The embedded payload is encrypted with AES-GCM. A password is required to decrypt it.");
    }
    try {
      const key = await deriveKey(password);
      const iv = payloadBytes.slice(0, 12);
      const ciphertext = payloadBytes.slice(12);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
      );
      return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
      throw new Error("Decryption failure: Invalid password or corrupted payload structure.");
    }
  } else {
    try {
      return new TextDecoder().decode(payloadBytes);
    } catch (e) {
      throw new Error("Decoding alert: Embedded payload is corrupted or uses an incompatible character encoding.");
    }
  }
}

// Utility to load File as Image
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load source image. Please ensure it is a valid PNG or JPG."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Estimates image specifications without embedding.
 */
export async function getImgSpecs(file: File): Promise<any> {
  const img = await loadImage(file);
  const pixelCount = img.width * img.height;
  // Skip alpha, 3 channels, 1 bit per channel = 3 bits per pixel
  const totalBits = pixelCount * 3;
  const safeCapacityBytes = Math.floor(totalBits / 32); // conservative capacity estimate
  return {
    width: img.width,
    height: img.height,
    size: file.size,
    format: file.type.replace("image/", "").toUpperCase(),
    capacity: safeCapacityBytes
  };
}
