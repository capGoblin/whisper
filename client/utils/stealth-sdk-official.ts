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
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { UserKeys, StealthMetaAddress, Message } from '../types';
import { ANNOUNCE_CONTRACT_ADDRESS } from '../constants/contracts';

// Base Sepolia configuration
const CHAIN_ID = 84532; // Base Sepolia
const RPC_URL = 'https://84532.rpc.thirdweb.com/0146d9ba634727cd97f136a39c52afe1';

// Initialize stealth client (for stealth address operations)
const stealthClient = createStealthClient({
  chainId: CHAIN_ID,
  rpcUrl: RPC_URL,
});

// Initialize Viem public client (for blockchain operations like getBlockNumber)
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
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
      schemeId: 1 // ERC-5564 scheme ID
    };
  } catch (error) {
    console.error('Error generating stealth address:', error);
    throw error;
  }
};

/**
 * Get recent announcements using direct blockchain query (last 1000 blocks only)
 */
export const getAnnouncementsOfficial = async () => {
  try {
    // Get current block number using Viem public client
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = Math.max(0, Number(currentBlock) - 1000); // Only scan last 1000 blocks
    
    // Query announcements directly from blockchain
    const logs = await publicClient.getLogs({
      address: ANNOUNCE_CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'Announcement', 
        inputs: [
          { type: 'uint256', indexed: true, name: 'schemeId' },
          { type: 'address', indexed: true, name: 'stealthAddress' },
          { type: 'address', indexed: true, name: 'caller' },
          { type: 'bytes', indexed: false, name: 'ephemeralPubKey' },
          { type: 'bytes', indexed: false, name: 'metadata' },
        ]
      },
      strict: false,
      fromBlock: BigInt(fromBlock),
      toBlock: 'latest'
    });
    
    // Convert logs to announcement format
    const announcements = logs.map(log => ({
      schemeId: log.args.schemeId,
      stealthAddress: log.args.stealthAddress,
      caller: log.args.caller,
      ephemeralPubKey: log.args.ephemeralPubKey,
      metadata: log.args.metadata,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
    
    console.log(`Scanned recent blocks ${fromBlock}-${currentBlock}, found ${announcements.length} announcements`);
    return announcements;
  } catch (error) {
    console.error('Error getting announcements:', error);
    throw error;
  }
};

/**
 * Get recent announcements for specific user using direct blockchain query (last 1000 blocks only)
 * Based on working @app/ implementation
 */
export const getAnnouncementsForUserOfficial = async (
  userKeys: UserKeys
) => {
  try {
    // Get current block number using Viem public client
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = Math.max(0, Number(currentBlock) - 1000); // Only scan last 1000 blocks
    
    // Query announcements directly from blockchain (like @app/ does)
    const logs = await publicClient.getLogs({
      address: ANNOUNCE_CONTRACT_ADDRESS, // ERC-5564 Announcer contract on Base Sepolia
      event: {
        type: 'event',
        name: 'Announcement', 
        inputs: [
          { type: 'uint256', indexed: true, name: 'schemeId' },
          { type: 'address', indexed: true, name: 'stealthAddress' },
          { type: 'address', indexed: true, name: 'caller' },
          { type: 'bytes', indexed: false, name: 'ephemeralPubKey' },
          { type: 'bytes', indexed: false, name: 'metadata' },
        ]
      },
      strict: false,
      fromBlock: BigInt(fromBlock),
      toBlock: 'latest'
    });
    
    // Convert logs to announcement format
    const announcements = logs.map(log => ({
      schemeId: log.args.schemeId,
      stealthAddress: log.args.stealthAddress,
      caller: log.args.caller,
      ephemeralPubKey: log.args.ephemeralPubKey,
      metadata: log.args.metadata,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
    
    console.log(`Scanned recent blocks ${fromBlock}-${currentBlock} for user, found ${announcements.length} announcements`);
    return announcements;
  } catch (error) {
    console.error('Error getting announcements for user:', error);
    throw error;
  }
};

/**
 * Prepare announcement transaction using direct contract interaction
 * This will be handled by the main app using useWriteContract
 */
export const prepareAnnouncementOfficial = async (
  stealthAddress: string,
  ephemeralPubKey: string,
  metadata: string,
  schemeId: number = 1 // ERC-5564 scheme ID
) => {
  try {
    // Return the parameters for useWriteContract
    return {
      schemeId: BigInt(schemeId),
      stealthAddress,
      ephemeralPubKey,
      metadata
    };
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
      content: announcement.metadata || '', // Plain text message, fallback to empty string
      timestamp: Date.now(),
      stealthAddress: announcement.stealthAddress || ''
    }));
    
    return messages;
  } catch (error) {
    console.error('Error scanning for messages:', error);
    throw error;
  }
};

/**
 * Watch announcements for user (real-time monitoring)
 * Note: This would require implementing a polling mechanism or WebSocket connection
 * For now, users can manually scan for new messages
 */
export const watchAnnouncementsForUserOfficial = async (
  userKeys: UserKeys,
  callback: (announcement: any) => void
) => {
  try {
    // For now, just scan once and call the callback
    const announcements = await getAnnouncementsForUserOfficial(userKeys);
    announcements.forEach(callback);
    
    // Return a no-op unwatch function
    return () => {};
  } catch (error) {
    console.error('Error watching announcements:', error);
    throw error;
  }
};
