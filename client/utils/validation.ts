/**
 * Validation utilities for stealth messaging
 */

/**
 * Validates stealth meta-address format
 * Format: st:eth:0x[66 hex chars for spending][66 hex chars for viewing]
 */
export const isValidMetaAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") return false;

  // Check format: st:eth:0x[132 hex chars total]
  const metaAddressRegex = /^st:eth:0x[a-fA-F0-9]{132}$/;
  return metaAddressRegex.test(address);
};

/**
 * Validates Ethereum address format
 * Format: 0x[40 hex chars]
 */
export const isValidEthAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") return false;

  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
};

/**
 * Validates ENS name format
 * Format: *.eth (basic validation)
 */
export const isValidENS = (name: string): boolean => {
  if (!name || typeof name !== "string") return false;

  // Basic ENS validation - must end with .eth and be reasonable length
  const ensRegex = /^[a-zA-Z0-9-]+\.eth$/;
  return ensRegex.test(name) && name.length <= 255;
};

/**
 * Validates message length with encryption overhead
 * AES-256-GCM adds ~28 bytes overhead
 */
export const validateMessageLength = (
  message: string
): {
  valid: boolean;
  maxLength: number;
  currentLength: number;
  remainingChars: number;
} => {
  const maxLength = 250; // Conservative limit for encryption overhead
  const currentLength = message.length;
  const remainingChars = maxLength - currentLength;

  return {
    valid: currentLength <= maxLength,
    maxLength,
    currentLength,
    remainingChars: Math.max(0, remainingChars),
  };
};

/**
 * Validates that a string is a valid hex string
 */
export const isValidHex = (hex: string): boolean => {
  if (!hex || typeof hex !== "string") return false;

  const hexRegex = /^0x[a-fA-F0-9]+$/;
  return hexRegex.test(hex);
};

/**
 * Validates view tag format (2 hex characters)
 */
export const isValidViewTag = (viewTag: string): boolean => {
  if (!viewTag || typeof viewTag !== "string") return false;

  const viewTagRegex = /^0x[a-fA-F0-9]{2}$/;
  return viewTagRegex.test(viewTag);
};

/**
 * Validates ephemeral public key format (33 or 65 bytes)
 */
export const isValidEphemeralPubKey = (pubKey: string): boolean => {
  if (!pubKey || typeof pubKey !== "string") return false;

  // Compressed: 0x + 66 hex chars (33 bytes)
  // Uncompressed: 0x + 130 hex chars (65 bytes)
  const compressedRegex = /^0x[a-fA-F0-9]{66}$/;
  const uncompressedRegex = /^0x[a-fA-F0-9]{130}$/;

  return compressedRegex.test(pubKey) || uncompressedRegex.test(pubKey);
};

/**
 * Validates stealth address format (42 hex chars)
 */
export const isValidStealthAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") return false;

  const stealthAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return stealthAddressRegex.test(address);
};

/**
 * Comprehensive validation for message input
 */
export const validateMessageInput = (
  message: string
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!message || message.trim().length === 0) {
    errors.push("Message cannot be empty");
    return { valid: false, errors, warnings };
  }

  const lengthCheck = validateMessageLength(message);
  if (!lengthCheck.valid) {
    errors.push(
      `Message too long. Maximum ${lengthCheck.maxLength} characters allowed.`
    );
  } else if (lengthCheck.remainingChars < 20) {
    warnings.push(`Only ${lengthCheck.remainingChars} characters remaining.`);
  }

  // Check for potentially problematic characters
  if (message.includes("\0")) {
    errors.push("Message contains null characters");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates recipient input (meta-address, ETH address, or ENS)
 */
export const validateRecipientInput = (
  input: string
): {
  type: "meta-address" | "eth-address" | "ens";
  valid: boolean;
  error?: string;
} => {
  if (!input || typeof input !== "string") {
    return { type: "meta-address", valid: false, error: "Input is required" };
  }

  const trimmed = input.trim();

  if (isValidMetaAddress(trimmed)) {
    return { type: "meta-address", valid: true };
  }

  if (isValidEthAddress(trimmed)) {
    return { type: "eth-address", valid: true };
  }

  if (isValidENS(trimmed)) {
    return { type: "ens", valid: true };
  }

  return {
    type: "meta-address",
    valid: false,
    error:
      "Invalid format. Enter a stealth meta-address (st:eth:0x...), Ethereum address (0x...), or ENS name (...eth)",
  };
};
