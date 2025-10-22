import { PublicClient } from 'viem';
import { getAnnouncements, parseAnnouncementEvent } from './fetch-announcements';
import { UserKeys, Message } from '../types';

/**
 * Simple message scanning - no encryption, just read metadata directly
 */
export const scanForSimpleMessages = async (
  publicClient: PublicClient,
  userKeys: UserKeys
): Promise<Message[]> => {
  try {
    console.log('Scanning for simple messages...');
    
    // Fetch all announcements from the blockchain
    const announcements = await getAnnouncements(publicClient);
    console.log(`Found ${announcements.length} announcements`);
    
    const messages: Message[] = [];
    
    for (const announcement of announcements) {
      try {
        const parsedEvent = parseAnnouncementEvent(announcement);
        if (!parsedEvent) continue;
        
        const { stealthAddress, ephemeralPubKey, metadata } = parsedEvent;
        
        // For simple messaging, we just read the metadata directly
        // No encryption/decryption needed
        const messageContent = metadata; // This is just the plain message
        
        const message: Message = {
          from: 'Anonymous',
          content: messageContent,
          timestamp: Date.now(),
          stealthAddress: stealthAddress
        };
        
        messages.push(message);
        console.log('Found simple message:', messageContent);
        
      } catch (error) {
        console.error('Error processing announcement:', error);
        // Continue with next announcement
      }
    }
    
    console.log(`Found ${messages.length} simple messages for user`);
    return messages;
    
  } catch (error) {
    console.error('Error scanning for simple messages:', error);
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
