import { StealthMetaAddress, StealthAddressResult } from '../types';
import { generateStealthAddressOfficial } from './stealth-sdk-official';

/**
 * Generate a stealth address for sending a message to a recipient
 * Uses the official @scopelift/stealth-address-sdk
 */
export const generateStealthAddressForMessage = async (
  recipientMetaAddress: StealthMetaAddress,
  message: string
): Promise<StealthAddressResult> => {
  try {
    // Use the official SDK implementation
    const result = await generateStealthAddressOfficial(recipientMetaAddress.formatted);
    
    // For simple messaging, we'll store the message in metadata (no encryption)
    const metadata = message; // Simple - no encryption for POC
    
    return {
      stealthAddress: result.stealthAddress,
      ephemeralPubKey: result.ephemeralPubKey,
      viewTag: result.viewTag,
      encryptedMessage: metadata // Just the plain message for now
    };
  } catch (error) {
    console.error('Error generating stealth address:', error);
    throw new Error(`Failed to generate stealth address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validate that a stealth meta-address is properly formatted
 */
export const validateStealthMetaAddress = (metaAddress: StealthMetaAddress): boolean => {
  try {
    // Check if spending and viewing public keys are valid hex strings
    const spendingPubValid = /^0x[0-9a-fA-F]{66}$/.test(metaAddress.spendingPubKey);
    const viewingPubValid = /^0x[0-9a-fA-F]{66}$/.test(metaAddress.viewingPubKey);
    
    // Check if formatted string matches expected pattern
    const formattedValid = metaAddress.formatted.startsWith('st:eth:0x') && 
                          metaAddress.formatted.length === 140; // 9 + 66 + 66 = 141 chars
    
    return spendingPubValid && viewingPubValid && formattedValid;
  } catch (error) {
    console.error('Error validating stealth meta-address:', error);
    return false;
  }
};

/**
 * Parse a stealth meta-address string into components
 */
export const parseStealthMetaAddress = (formatted: string): StealthMetaAddress | null => {
  try {
    if (!formatted.startsWith('st:eth:0x') || formatted.length !== 140) {
      return null;
    }
    
    const spendingPubKey = `0x${formatted.slice(9, 75)}`;  // 9 + 66 = 75
    const viewingPubKey = `0x${formatted.slice(75)}`;      // 75 + 66 = 141
    
    return {
      spendingPubKey,
      viewingPubKey,
      formatted
    };
  } catch (error) {
    console.error('Error parsing stealth meta-address:', error);
    return null;
  }
};
