import { PublicClient } from 'viem';
import { getAnnouncementsForUserOfficial } from './stealth-sdk-official';
import { UserKeys, DecryptedMessage } from '../types';
import { computeSharedSecret, decryptMetadata, checkViewTagMatch, extractViewTag } from './encryption';

/**
 * Scan for encrypted messages using official SDK and decrypt them
 */
export const scanForSimpleMessages = async (
  publicClient: PublicClient,
  userKeys: UserKeys
): Promise<DecryptedMessage[]> => {
  try {
    console.log('Scanning for encrypted messages...');
    
    // Use official SDK to get announcements for this user
    const announcements = await getAnnouncementsForUserOfficial(userKeys);
    console.log(`Found ${announcements.length} announcements for user`);
    
    const messages: DecryptedMessage[] = [];
    
    for (const announcement of announcements) {
      try {
        const { stealthAddress, ephemeralPubKey, metadata } = announcement;
        
        // Compute shared secret for this announcement
        const sharedSecret = computeSharedSecret(
          userKeys.viewingPrivateKey,
          ephemeralPubKey
        );
        
        // Extract view tag for quick filtering
        const expectedViewTag = extractViewTag(sharedSecret);
        
        // Check if view tag matches (quick filter)
        if (!checkViewTagMatch(metadata, expectedViewTag)) {
          console.log('View tag mismatch, skipping announcement');
          continue;
        }
        
        // Attempt to decrypt the message
        const decryptedContent = await decryptMetadata(metadata, sharedSecret);
        
        if (decryptedContent) {
          const message: DecryptedMessage = {
            from: 'Anonymous',
            content: decryptedContent,
            timestamp: Date.now(),
            stealthAddress: stealthAddress,
            decryptionSuccess: true,
            sharedSecret: sharedSecret,
            viewTag: expectedViewTag
          };
          
          messages.push(message);
          console.log('Successfully decrypted message:', decryptedContent);
        } else {
          console.log('Failed to decrypt message, skipping');
        }
        
      } catch (error) {
        console.error('Error processing announcement:', error);
        // Continue with next announcement
      }
    }
    
    console.log(`Successfully decrypted ${messages.length} messages for user`);
    return messages;
    
  } catch (error) {
    console.error('Error scanning for encrypted messages:', error);
    throw new Error(`Failed to scan for messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get user's stored keys from localStorage
 */
export const getUserKeys = (): UserKeys | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('whisper-user-keys');
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting user keys:', error);
    return null;
  }
};

/**
 * Store user's keys in localStorage
 */
export const storeUserKeys = (userKeys: UserKeys): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('whisper-user-keys', JSON.stringify(userKeys));
  } catch (error) {
    console.error('Error storing user keys:', error);
  }
};

/**
 * Clear user's keys from localStorage
 */
export const clearUserKeys = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('whisper-user-keys');
  } catch (error) {
    console.error('Error clearing user keys:', error);
  }
};


