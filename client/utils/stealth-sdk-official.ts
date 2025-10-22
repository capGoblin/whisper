// Official Stealth Address SDK implementation
// Based on https://stealthaddress.dev/SDK/overview

import { 
  createStealthClient, 
  generateStealthAddress,
  getAnnouncements,
  getAnnouncementsForUser,
  prepareAnnounce,
  VALID_SCHEME_ID
} from '@scopelift/stealth-address-sdk';
import { UserKeys, StealthMetaAddress, Message } from '../types';

// Base Sepolia configuration
const CHAIN_ID = 84532; // Base Sepolia
const RPC_URL = 'https://84532.rpc.thirdweb.com/0146d9ba634727cd97f136a39c52afe1';

// Initialize stealth client
const stealthClient = createStealthClient({
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
});

/**
 * Generate stealth address using official SDK
 */
export const generateStealthAddressOfficial = async (
  stealthMetaAddressURI: string
) => {
  try {
    const result = await generateStealthAddress({ 
      stealthMetaAddressURI 
    });
    
    return {
      stealthAddress: result.stealthAddress,
      ephemeralPubKey: result.ephemeralPublicKey,
      viewTag: result.viewTag,
      schemeId: result.schemeId
    };
  } catch (error) {
    console.error('Error generating stealth address:', error);
    throw error;
  }
};

/**
 * Get recent announcements using official SDK (last 1000 blocks only)
 */
export const getAnnouncementsOfficial = async () => {
  try {
    // Get current block number
    const currentBlock = await stealthClient.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000); // Only scan last 1000 blocks
    
    const announcements = await stealthClient.getAnnouncements({
      fromBlock: fromBlock,
      toBlock: 'latest'
    });
    
    console.log(`Scanned recent blocks ${fromBlock}-${currentBlock}, found ${announcements.length} announcements`);
    return announcements;
  } catch (error) {
    console.error('Error getting announcements:', error);
    throw error;
  }
};

/**
 * Get recent announcements for specific user using official SDK (last 1000 blocks only)
 */
export const getAnnouncementsForUserOfficial = async (
  userKeys: UserKeys
) => {
  try {
    // Convert user keys to stealth meta-address format
    const stealthMetaAddress = `st:eth:0x${userKeys.spendingPublicKey.slice(2)}${userKeys.viewingPublicKey.slice(2)}`;
    
    // Get current block number
    const currentBlock = await stealthClient.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000); // Only scan last 1000 blocks
    
    const announcements = await stealthClient.getAnnouncementsForUser({
      stealthMetaAddress,
      fromBlock: fromBlock,
      toBlock: 'latest'
    });
    
    console.log(`Scanned recent blocks ${fromBlock}-${currentBlock} for user, found ${announcements.length} announcements`);
    return announcements;
  } catch (error) {
    console.error('Error getting announcements for user:', error);
    throw error;
  }
};

/**
 * Prepare announcement transaction using official SDK
 */
export const prepareAnnouncementOfficial = async (
  stealthAddress: string,
  ephemeralPubKey: string,
  metadata: string,
  schemeId: number = VALID_SCHEME_ID.SCHEME_ID_1
) => {
  try {
    const result = await stealthClient.prepareAnnounce({
      schemeId,
      stealthAddress,
      ephemeralPublicKey: ephemeralPubKey,
      metadata
    });
    
    return result;
  } catch (error) {
    console.error('Error preparing announcement:', error);
    throw error;
  }
};

/**
 * Scan for messages using official SDK
 */
export const scanForMessagesOfficial = async (
  userKeys: UserKeys
): Promise<Message[]> => {
  try {
    const announcements = await getAnnouncementsForUserOfficial(userKeys);
    
    const messages: Message[] = announcements.map((announcement, index) => ({
      from: 'Anonymous',
      content: announcement.metadata, // Plain text message
      timestamp: Date.now(),
      stealthAddress: announcement.stealthAddress
    }));
    
    return messages;
  } catch (error) {
    console.error('Error scanning for messages:', error);
    throw error;
  }
};

/**
 * Watch announcements for user (real-time monitoring)
 */
export const watchAnnouncementsForUserOfficial = async (
  userKeys: UserKeys,
  callback: (announcement: any) => void
) => {
  try {
    const stealthMetaAddress = `st:eth:0x${userKeys.spendingPublicKey.slice(2)}${userKeys.viewingPublicKey.slice(2)}`;
    
    const unwatch = await stealthClient.watchAnnouncementsForUser({
      stealthMetaAddress,
      onAnnouncement: callback
    });
    
    return unwatch;
  } catch (error) {
    console.error('Error watching announcements:', error);
    throw error;
  }
};
