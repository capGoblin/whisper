/**
 * Encryption utilities for stealth messaging
 * Uses ECDH shared secrets and AES-256-GCM encryption
 */

import * as secp from "@noble/secp256k1";
import { keccak256 } from "viem";

/**
 * Compute shared secret using ECDH
 * @param privateKey - Private key (hex string with 0x prefix)
 * @param publicKey - Public key (hex string with 0x prefix)
 * @returns Hashed shared secret (hex string)
 */
export const computeSharedSecret = (
  privateKey: string,
  publicKey: string
): string => {
  try {
    // Remove 0x prefix if present
    const cleanPrivateKey = privateKey.startsWith("0x")
      ? privateKey.slice(2)
      : privateKey;
    const cleanPublicKey = publicKey.startsWith("0x")
      ? publicKey.slice(2)
      : publicKey;

    // Convert to Uint8Array for secp256k1
    const privateKeyBytes = new Uint8Array(
      cleanPrivateKey.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // Create public key point
    const publicKeyPoint = secp.Point.fromHex(cleanPublicKey);

    // Compute shared secret using ECDH
    const sharedSecretPoint = secp.getSharedSecret(
      privateKeyBytes,
      publicKeyPoint.toBytes(),
      true
    );

    // Hash the shared secret (skip first byte which is 0x04 prefix for uncompressed point)
    const hashedSecret = keccak256(sharedSecretPoint.slice(1));

    return hashedSecret;
  } catch (error) {
    console.error("Error computing shared secret:", error);
    throw new Error("Failed to compute shared secret");
  }
};

/**
 * Extract view tag from hashed shared secret
 * @param hashedSharedSecret - Hashed shared secret (hex string)
 * @returns View tag (2 hex characters with 0x prefix)
 */
export const extractViewTag = (hashedSharedSecret: string): string => {
  // Remove 0x prefix if present
  const cleanSecret = hashedSharedSecret.startsWith("0x")
    ? hashedSharedSecret.slice(2)
    : hashedSharedSecret;

  // Extract first byte (2 hex characters)
  const viewTag = "0x" + cleanSecret.slice(0, 2);

  return viewTag;
};

/**
 * Encrypt message using AES-256-GCM
 * @param message - Plain text message
 * @param sharedSecret - Shared secret (hex string)
 * @returns Encrypted message (hex string)
 */
export const encryptMessage = async (
  message: string,
  sharedSecret: string
): Promise<string> => {
  try {
    // Convert shared secret to Uint8Array
    const cleanSecret = sharedSecret.startsWith("0x")
      ? sharedSecret.slice(2)
      : sharedSecret;
    const secretBytes = new Uint8Array(
      cleanSecret.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    // Encrypt message
    const messageBytes = new TextEncoder().encode(message);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      messageBytes
    );

    // Combine IV + encrypted data and convert to hex
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return (
      "0x" +
      Array.from(combined)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  } catch (error) {
    console.error("Error encrypting message:", error);
    throw new Error("Failed to encrypt message");
  }
};

/**
 * Decrypt message using AES-256-GCM
 * @param encryptedHex - Encrypted message (hex string)
 * @param sharedSecret - Shared secret (hex string)
 * @returns Decrypted message or null if decryption fails
 */
export const decryptMessage = async (
  encryptedHex: string,
  sharedSecret: string
): Promise<string | null> => {
  try {
    // Convert shared secret to Uint8Array
    const cleanSecret = sharedSecret.startsWith("0x")
      ? sharedSecret.slice(2)
      : sharedSecret;
    const secretBytes = new Uint8Array(
      cleanSecret.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // Convert encrypted data to Uint8Array
    const cleanEncrypted = encryptedHex.startsWith("0x")
      ? encryptedHex.slice(2)
      : encryptedHex;
    const encryptedBytes = new Uint8Array(
      cleanEncrypted.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // Extract IV (first 12 bytes) and encrypted data
    const iv = encryptedBytes.slice(0, 12);
    const encryptedData = encryptedBytes.slice(12);

    // Import key
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // Decrypt message
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    // Convert to string
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Error decrypting message:", error);
    return null; // Return null for decryption failures (wrong key, corrupted data, etc.)
  }
};

/**
 * Prepare metadata for announcement
 * Combines view tag and encrypted message
 * @param message - Plain text message
 * @param sharedSecret - Shared secret (hex string)
 * @returns Metadata string: 0x + viewTag + encryptedMessage
 */
export const prepareMetadata = async (
  message: string | object,
  sharedSecret: string
): Promise<string> => {
  try {
    // Extract view tag
    const viewTag = extractViewTag(sharedSecret);

    // Convert message to string if it's an object
    const messageStr =
      typeof message === "object" ? JSON.stringify(message) : message;

    // Encrypt message
    const encryptedMessage = await encryptMessage(messageStr, sharedSecret);

    // Combine: 0x + viewTag (without 0x) + encryptedMessage (without 0x)
    const viewTagHex = viewTag.startsWith("0x") ? viewTag.slice(2) : viewTag;
    const encryptedHex = encryptedMessage.startsWith("0x")
      ? encryptedMessage.slice(2)
      : encryptedMessage;

    return "0x" + viewTagHex + encryptedHex;
  } catch (error) {
    console.error("Error preparing metadata:", error);
    throw new Error("Failed to prepare metadata");
  }
};

/**
 * Parse metadata to extract view tag and encrypted message
 * @param metadata - Metadata string from announcement
 * @returns Object with view tag and encrypted message
 */
export const parseMetadata = (
  metadata: string
): { viewTag: string; encryptedMessage: string } => {
  try {
    const cleanMetadata = metadata.startsWith("0x")
      ? metadata.slice(2)
      : metadata;

    // First 2 characters are view tag
    const viewTag = "0x" + cleanMetadata.slice(0, 2);

    // Rest is encrypted message
    const encryptedMessage = "0x" + cleanMetadata.slice(2);

    return { viewTag, encryptedMessage };
  } catch (error) {
    console.error("Error parsing metadata:", error);
    throw new Error("Failed to parse metadata");
  }
};

/**
 * Decrypt metadata using shared secret
 * @param metadata - Metadata string from announcement
 * @param sharedSecret - Shared secret (hex string)
 * @returns Decrypted message or null if decryption fails
 */
export const decryptMetadata = async (
  metadata: string,
  sharedSecret: string
): Promise<string | object | null> => {
  try {
    const { encryptedMessage } = parseMetadata(metadata);
    const decrypted = await decryptMessage(encryptedMessage, sharedSecret);

    if (!decrypted) return null;

    // Try to parse as JSON in case it's a file metadata object
    try {
      return JSON.parse(decrypted);
    } catch {
      // If not JSON, return as string
      return decrypted;
    }
  } catch (error) {
    console.error("Error decrypting metadata:", error);
    return null;
  }
};

/**
 * Check if view tag matches (for efficient filtering)
 * @param metadata - Metadata string from announcement
 * @param expectedViewTag - Expected view tag
 * @returns True if view tag matches
 */
export const checkViewTagMatch = (
  metadata: string,
  expectedViewTag: string
): boolean => {
  try {
    const { viewTag } = parseMetadata(metadata);
    return viewTag.toLowerCase() === expectedViewTag.toLowerCase();
  } catch (error) {
    console.error("Error checking view tag:", error);
    return false;
  }
};

/**
 * Generate encryption key from shared secret
 * @param sharedSecret - Shared secret (hex string)
 * @returns Encryption key for AES-256-GCM
 */
export const generateEncryptionKey = async (
  sharedSecret: string
): Promise<CryptoKey> => {
  try {
    const cleanSecret = sharedSecret.startsWith("0x")
      ? sharedSecret.slice(2)
      : sharedSecret;
    const secretBytes = new Uint8Array(
      cleanSecret.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
    );

    return await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Error generating encryption key:", error);
    throw new Error("Failed to generate encryption key");
  }
};