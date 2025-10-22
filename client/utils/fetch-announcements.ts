import { PublicClient } from 'viem';
import { ANNOUNCE_CONTRACT_ADDRESS } from '../constants/contracts';
import ANNOUNCER_ABI from '../constants/abi/announcer.json';

/**
 * Fetch Announcement events from the announcer contract (recent blocks only)
 */
export const getAnnouncements = async (
  publicClient: PublicClient,
  fromBlock?: bigint
): Promise<any[]> => {
  try {
    // If no fromBlock specified, scan only last 1000 blocks
    let startBlock = fromBlock;
    if (!startBlock) {
      const currentBlock = await publicClient.getBlockNumber();
      startBlock = BigInt(Math.max(0, Number(currentBlock) - 1000));
    }

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
      fromBlock: startBlock,
      toBlock: 'latest'
    });

    console.log(`Fetched ${logs.length} announcements from block ${startBlock} to latest`);
    return logs;
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw new Error(`Failed to fetch announcements: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Fetch announcements from a specific block range
 */
export const getAnnouncementsInRange = async (
  publicClient: PublicClient,
  fromBlock: bigint,
  toBlock: bigint
): Promise<any[]> => {
  try {
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
      fromBlock,
      toBlock
    });

    return logs;
  } catch (error) {
    console.error('Error fetching announcements in range:', error);
    throw new Error(`Failed to fetch announcements in range: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get the latest block number
 */
export const getLatestBlockNumber = async (publicClient: PublicClient): Promise<bigint> => {
  try {
    return await publicClient.getBlockNumber();
  } catch (error) {
    console.error('Error getting latest block number:', error);
    throw new Error(`Failed to get latest block number: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Parse announcement event data
 */
export const parseAnnouncementEvent = (log: any) => {
  try {
    const args = log.args;
    return {
      schemeId: Number(args.schemeId),
      stealthAddress: args.stealthAddress,
      caller: args.caller,
      ephemeralPubKey: args.ephemeralPubKey,
      metadata: args.metadata,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex
    };
  } catch (error) {
    console.error('Error parsing announcement event:', error);
    return null;
  }
};
