// Fallback key generation for testing when WebAuthn fails
import * as secp from '@noble/secp256k1';
import { UserKeys, StealthMetaAddress } from '../types';

/**
 * Generate random keys for testing (fallback when WebAuthn fails)
 */
export const generateTestKeys = (): UserKeys => {
  console.log('Generating test keys (WebAuthn fallback)...');
  
  // Generate random private keys
  const spendingPrivateKey = secp.utils.randomSecretKey();
  const viewingPrivateKey = secp.utils.randomSecretKey();
  
  // Get public keys
  const spendingPublicKey = secp.getPublicKey(spendingPrivateKey, true);
  const viewingPublicKey = secp.getPublicKey(viewingPrivateKey, true);
  
  return {
    spendingPrivateKey: `0x${Buffer.from(spendingPrivateKey).toString('hex')}`,
    viewingPrivateKey: `0x${Buffer.from(viewingPrivateKey).toString('hex')}`,
    spendingPublicKey: `0x${Buffer.from(spendingPublicKey).toString('hex')}`,
    viewingPublicKey: `0x${Buffer.from(viewingPublicKey).toString('hex')}`,
  };
};

/**
 * Create stealth meta-address from test keys
 */
export const createTestStealthMetaAddress = (userKeys: UserKeys): StealthMetaAddress => {
  const formatted = `st:eth:0x${userKeys.spendingPublicKey.slice(2)}${userKeys.viewingPublicKey.slice(2)}`;
  
  return {
    spendingPubKey: userKeys.spendingPublicKey,
    viewingPubKey: userKeys.viewingPublicKey,
    formatted
  };
};

/**
 * Store test keys in localStorage
 */
export const storeTestKeys = (userKeys: UserKeys): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('whisper-test-keys', JSON.stringify(userKeys));
    console.log('Test keys stored successfully');
  } catch (error) {
    console.error('Error storing test keys:', error);
  }
};

/**
 * Get test keys from localStorage
 */
export const getTestKeys = (): UserKeys | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('whisper-test-keys');
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting test keys:', error);
    return null;
  }
};

/**
 * Clear test keys from localStorage
 */
export const clearTestKeys = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('whisper-test-keys');
    console.log('Test keys cleared');
  } catch (error) {
    console.error('Error clearing test keys:', error);
  }
};


