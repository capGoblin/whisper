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
import { baseSepolia, hederaTestnet } from 'viem/chains';
import { UserKeys, StealthMetaAddress, Message } from '../types';
import { ANNOUNCE_CONTRACT_ADDRESS } from '../constants/contracts';
import { computeSharedSecret, decryptMetadata } from './encryption';

// Hedera Testnet configuration
const CHAIN_ID = 296; // Hedera Testnet
const RPC_URL = 'https://testnet.hashio.io/api'; // Hedera Testnet JSON-RPC Relay

// Define Hedera Testnet chain configuration for Viem
// const hederaTestnet = {
//   id: 296,
//   name: 'Hedera Testnet',
//   network: 'hedera-testnet',
//   nativeCurrency: {
//     name: 'HBAR',
//     symbol: 'HBAR',
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: { http: [RPC_URL] },
//     public: { http: [RPC_URL] },
//   },
//   blockExplorers: {
//     default: {
//       name: 'HashScan',
//       url: 'https://hashscan.io/testnet',
//     },
//   },
// };

// Initialize stealth client (for stealth address operations)
// Note: Hedera Testnet (296) is not in the SDK's VALID_CHAIN_IDS, but we don't actually use this client
// All operations use publicClient instead
// const stealthClient = createStealthClient({
//   chainId: CHAIN_ID,
//   rpcUrl: RPC_URL,
// });

// Initialize Viem public client (for blockchain operations like getBlockNumber)
const publicClient = createPublicClient({
  chain: hederaTestnet,
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
 * Based on working implementation
 */
export const getAnnouncementsForUserOfficial = async (
  userKeys: UserKeys
) => {
  try {
    // Get current block number using Viem public client
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = Math.max(0, Number(currentBlock) - 1000); // Only scan last 1000 blocks
    
    // Query announcements directly from blockchain (like does)
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
    const allAnnouncements = logs.map(log => ({
      schemeId: log.args.schemeId,
      stealthAddress: log.args.stealthAddress,
      caller: log.args.caller,
      ephemeralPubKey: log.args.ephemeralPubKey,
      metadata: log.args.metadata,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
    
    // Filter announcements for this user by checking if we can decrypt them
    // This is the key fix - we need to test decryption to find messages meant for us
    const userAnnouncements = [];
    
    for (const announcement of allAnnouncements) {
      try {
        // Try to compute shared secret and decrypt
        const sharedSecret = computeSharedSecret(
          userKeys.viewingPrivateKey,
          announcement.ephemeralPubKey || ''
        );
        
        // Try to decrypt the metadata
        const decryptedContent = await decryptMetadata(
          announcement.metadata || '',
          sharedSecret
        );
        
        // If decryption succeeds, this message is for us
        if (decryptedContent) {
          userAnnouncements.push(announcement);
          console.log('Found message for user:', decryptedContent);
        }
      } catch (error) {
        // Decryption failed, this message is not for us
        // This is expected for most announcements
        continue;
      }
    }
    
    console.log(`Scanned recent blocks ${fromBlock}-${currentBlock}, found ${allAnnouncements.length} total announcements, ${userAnnouncements.length} for user`);
    return userAnnouncements;
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
    // Get announcements that are already filtered for this user
    const announcements = await getAnnouncementsForUserOfficial(userKeys);
    
    const messages: Message[] = [];
    
    for (const announcement of announcements) {
      try {
        // Compute shared secret for this announcement
        const sharedSecret = computeSharedSecret(
          userKeys.viewingPrivateKey,
          announcement.ephemeralPubKey || ''
        );
        
        // Decrypt the metadata
        const decryptedContent = await decryptMetadata(
          announcement.metadata || '',
          sharedSecret
        );
        
        if (decryptedContent) {
          // Determine message type based on content (only message or file for Hedera Testnet)
          let messageType: 'message' | 'file' = 'message';
          let displayContent: string;
          
          // Handle object with text field (standard message structure from Send page)
          if (typeof decryptedContent === 'object' && decryptedContent !== null) {
            // Check for explicit type field first (only file type supported)
            if ('type' in decryptedContent && decryptedContent.type === 'file') {
              messageType = 'file';
              // For file messages, keep the full JSON metadata as content
              displayContent = JSON.stringify(decryptedContent);
            } else {
              // For regular messages, extract text field if it exists
              if ('text' in decryptedContent) {
                displayContent = decryptedContent.text as string;
              } else if ('content' in decryptedContent && typeof decryptedContent.content === 'string') {
                // Fallback to content field
                displayContent = decryptedContent.content;
              } else {
                displayContent = JSON.stringify(decryptedContent);
              }
            }
          } else {
            // Handle plain string messages
            displayContent = decryptedContent as string;
          }
          
          messages.push({
            from: 'Anonymous',
            content: displayContent,
            timestamp: Date.now(),
            stealthAddress: announcement.stealthAddress || '',
            decryptionSuccess: true,
            type: messageType
          });
        }
      } catch (decryptError) {
        console.warn('Failed to decrypt message:', decryptError);
        // This shouldn't happen since we already filtered in getAnnouncementsForUserOfficial
        // But keep as fallback
        messages.push({
          from: 'Anonymous',
          content: 'Encrypted',
          timestamp: Date.now(),
          stealthAddress: announcement.stealthAddress || '',
          decryptionSuccess: false,
          type: 'message'
        });
      }
    }
    
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