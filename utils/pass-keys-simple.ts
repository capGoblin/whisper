// Simplified pass-keys implementation for Whisper
// Based on working @app/ implementation but simplified for messaging

import * as secp from '@noble/secp256k1';
import { UserKeys, StealthMetaAddress } from '../types';

const CREDENTIAL_STORAGE_KEY = 'whisper-webauthn-credentials';
const STATIC_MESSAGE = 'whisper-stealth-messaging';

interface CredentialDescriptor {
  id: string;
  type: 'public-key';
  createdAt: string;
}

/**
 * Get stored credentials from localStorage
 */
function getStoredCredentials(): CredentialDescriptor[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Store credential in localStorage
 */
function storeCredential(credentialDescriptor: CredentialDescriptor): void {
  if (typeof window === 'undefined') return;
  const stored = getStoredCredentials();
  stored.push(credentialDescriptor);
  localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(stored));
}

/**
 * Convert hex string to Uint8Array
 */
function hexToArray(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function arrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Setup WebAuthn credentials for stealth address generation
 * With better error handling and fallback options
 */
export const setupPassKeys = async (): Promise<CredentialDescriptor> => {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const existingCredentials = getStoredCredentials();
    
    if (existingCredentials.length > 0) {
      console.log('WebAuthn credentials already exist, skipping setup');
      return existingCredentials[0]!;
    }

    console.log('Generating WebAuthn credential...');
    
    // Try with more permissive settings first
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: 'Whisper Stealth Messaging',
          id: window.location.hostname,
        },
        user: {
          id: crypto.getRandomValues(new Uint8Array(32)),
          name: 'whisper-user',
          displayName: 'Whisper User',
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256 (ECDSA with P-256 and SHA-256)
            type: 'public-key',
          },
          {
            alg: -257, // RS256 (RSA with SHA-256)
            type: 'public-key',
          },
        ],
        authenticatorSelection: {
          // Don't restrict to platform authenticators
          userVerification: 'discouraged', // Less strict
        },
        timeout: 30000, // Shorter timeout
        attestation: 'none', // Don't require attestation
      },
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create WebAuthn credential');
    }

    console.log('WebAuthn credential created successfully');
    
    const credentialDescriptor: CredentialDescriptor = {
      id: arrayToHex(new Uint8Array(credential.rawId)),
      type: 'public-key',
      createdAt: new Date().toISOString(),
    };
    
    storeCredential(credentialDescriptor);
    
    return credentialDescriptor;

  } catch (error) {
    console.error('Error setting up WebAuthn credentials:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('WebAuthn operation was cancelled or not allowed. Please try again and allow the operation when prompted.');
      } else if (error.name === 'TimeoutError') {
        throw new Error('WebAuthn operation timed out. Please try again.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('WebAuthn is not supported on this device. Please use a different browser or device.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Security error. Please ensure you are using HTTPS or localhost.');
      }
    }
    
    throw error instanceof Error ? error : new Error(String(error));
  }
};

/**
 * Generate stealth keys from WebAuthn credential
 */
export const generateStealthKeys = async (message: string = STATIC_MESSAGE): Promise<UserKeys> => {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const storedCredentials = getStoredCredentials();
    if (storedCredentials.length === 0) {
      throw new Error('No WebAuthn credentials found. Please run setupPassKeys() first.');
    }

    const allowCredentials = storedCredentials.map(cred => ({
      id: hexToArray(cred.id),
      type: 'public-key' as const
    }));

    const messageBuffer = new TextEncoder().encode(message);
    
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: messageBuffer,
        allowCredentials: allowCredentials,
        userVerification: 'preferred',
        timeout: 60000,
      },
    })) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Failed to get WebAuthn assertion');
    }

    // Derive key material from credential ID
    const keyMaterial = hexToArray(assertion.id);
    const keySeed = await crypto.subtle.digest("SHA-256", keyMaterial);

    // Derive spending and viewing keys using HKDF
    const { spendingKey, viewingKey } = await deriveStealthKeys(new Uint8Array(keySeed), message);
    
    const spendingPubKey = await getCompressedPublicKey(spendingKey);
    const viewingPubKey = await getCompressedPublicKey(viewingKey);

    return {
      spendingPrivateKey: `0x${arrayToHex(spendingKey)}`,
      viewingPrivateKey: `0x${arrayToHex(viewingKey)}`,
      spendingPublicKey: spendingPubKey,
      viewingPublicKey: viewingPubKey,
    };

  } catch (error) {
    console.error('Error generating stealth keys:', error);
    throw error;
  }
};

/**
 * Derive spending and viewing keys from WebAuthn signature using HKDF
 */
async function deriveStealthKeys(signature: Uint8Array, staticMessage: string): Promise<{spendingKey: Uint8Array, viewingKey: Uint8Array}> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    signature,
    'HKDF',
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive spending key using EIP-5564 compliant salt and info
  const spendingKeyMaterial = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('EIP-5564-spending-key'),
      info: new TextEncoder().encode(`${staticMessage}-spending`),
    },
    keyMaterial,
    256 // 32 bytes
  );

  // Derive viewing key using EIP-5564 compliant salt and info
  const viewingKeyMaterial = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('EIP-5564-viewing-key'),
      info: new TextEncoder().encode(`${staticMessage}-viewing`),
    },
    keyMaterial,
    256 // 32 bytes
  );

  // Ensure private keys are valid secp256k1 private keys
  const spendingKey = await normalizePrivateKey(new Uint8Array(spendingKeyMaterial));
  const viewingKey = await normalizePrivateKey(new Uint8Array(viewingKeyMaterial));

  return {
    spendingKey,
    viewingKey,
  };
}

/**
 * Normalize private key to ensure it's a valid secp256k1 private key
 */
async function normalizePrivateKey(keyMaterial: Uint8Array): Promise<Uint8Array> {
  // Ensure the key is within the valid range for secp256k1
  if (keyMaterial.length > 32) {
    keyMaterial = keyMaterial.slice(0, 32);
  }

  // Pad with zeros if too short
  if (keyMaterial.length < 32) {
    const padded = new Uint8Array(32);
    padded.set(keyMaterial);
    keyMaterial = padded;
  }

  // Ensure it's not zero
  if (keyMaterial.every(byte => byte === 0)) {
    keyMaterial[31] = 1; // Set last byte to 1
  }

  return keyMaterial;
}

/**
 * Get compressed public key from private key
 */
async function getCompressedPublicKey(privateKey: Uint8Array): Promise<string> {
  const publicKey = secp.getPublicKey(privateKey, true); // compressed
  return `0x${arrayToHex(publicKey)}`;
}

/**
 * Create stealth meta-address from user keys
 */
export const createStealthMetaAddress = (userKeys: UserKeys): StealthMetaAddress => {
  const formatted = `st:eth:0x${userKeys.spendingPublicKey.slice(2)}${userKeys.viewingPublicKey.slice(2)}`;
  
  return {
    spendingPubKey: userKeys.spendingPublicKey,
    viewingPubKey: userKeys.viewingPublicKey,
    formatted
  };
};

/**
 * Store user keys in localStorage
 */
export const storeUserKeys = (userKeys: UserKeys): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('whisper-user-keys', JSON.stringify(userKeys));
};

/**
 * Get user keys from localStorage
 */
export const getUserKeys = (): UserKeys | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('whisper-user-keys');
  return stored ? JSON.parse(stored) : null;
};

/**
 * Clear user keys from localStorage
 */
export const clearUserKeys = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('whisper-user-keys');
};
