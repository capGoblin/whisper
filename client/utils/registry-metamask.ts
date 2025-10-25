/**
 * MetaMask integration for ERC-6538 Registry contract
 * Provides direct MetaMask wallet integration for registry operations
 */

import { REGISTRY_ADDRESS } from '../constants/contracts';
import registryAbi from '../constants/abi/registry.json';

export interface MetaMaskTransactionResult {
  hash: string;
  success: boolean;
  error?: string;
}

export interface MetaMaskRegistryStatus {
  isRegistered: boolean;
  metaAddress?: string;
  isLoading: boolean;
  error?: string;
}

/**
 * Check if MetaMask is available
 */
export function isMetaMaskAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

/**
 * Request account access from MetaMask
 */
export async function requestAccountAccess(): Promise<string> {
  if (!isMetaMaskAvailable()) {
    throw new Error('MetaMask not available');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    return accounts[0];
  } catch (error) {
    console.error('Error requesting account access:', error);
    throw new Error(`Failed to connect to MetaMask: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current account from MetaMask
 */
export async function getCurrentAccount(): Promise<string | null> {
  if (!isMetaMaskAvailable()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });

    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
}

/**
 * Register meta-address using MetaMask
 * @param metaAddress - Stealth meta-address to register
 * @returns Transaction hash
 */
export async function registerMetaAddressWithMetaMask(
  metaAddress: string
): Promise<MetaMaskTransactionResult> {
  try {
    console.log('Registering meta-address with MetaMask...');
    
    if (!isMetaMaskAvailable()) {
      throw new Error('MetaMask not available');
    }

    if (!metaAddress) {
      throw new Error('Meta address is required');
    }
    
    if (!metaAddress.startsWith('st:eth:0x')) {
      throw new Error('Invalid meta address format');
    }

    // Get current account
    const account = await getCurrentAccount();
    if (!account) {
      throw new Error('No account connected');
    }

    // Extract just the public keys portion (remove 'st:eth:' prefix)
    const publicKeysHex = metaAddress.slice(7); // Remove 'st:eth:' -> '0x[keys]'

    // Create contract instance
    const contract = new window.ethereum.Contract(
      registryAbi,
      REGISTRY_ADDRESS
    );

    // Call registerKeys function
    const tx = await contract.registerKeys(
      1, // schemeId for ERC-5564
      publicKeysHex,
      {
        from: account,
        gas: '200000' // Estimated gas limit
      }
    );

    console.log('Transaction submitted:', tx.hash);
    
    return {
      hash: tx.hash,
      success: true
    };
  } catch (error) {
    console.error('Error registering meta-address:', error);
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get meta-address from registry using MetaMask
 * @param address - Ethereum address to lookup
 * @returns Meta-address if found, null otherwise
 */
export async function getMetaAddressWithMetaMask(
  address: string
): Promise<string | null> {
  try {
    console.log(`Getting meta-address for: ${address}`);
    
    if (!isMetaMaskAvailable()) {
      throw new Error('MetaMask not available');
    }

    if (!address) {
      throw new Error('Address is required');
    }

    // Create contract instance
    const contract = new window.ethereum.Contract(
      registryAbi,
      REGISTRY_ADDRESS
    );

    // Call stealthMetaAddressOf function
    const result = await contract.stealthMetaAddressOf(address, 1); // schemeId = 1

    // Convert bytes result to meta-address format
    return result && result !== '0x' ? `st:eth:${result}` : null;
  } catch (error) {
    console.error('Error getting meta-address:', error);
    return null;
  }
}

/**
 * Check if address is registered in registry using MetaMask
 * @param address - Ethereum address to check
 * @returns True if registered, false otherwise
 */
export async function isAddressRegisteredWithMetaMask(
  address: string
): Promise<boolean> {
  try {
    const metaAddress = await getMetaAddressWithMetaMask(address);
    return metaAddress !== null && metaAddress !== 'st:eth:0x';
  } catch (error) {
    console.error('Error checking registration status:', error);
    return false;
  }
}

/**
 * Get comprehensive registry status using MetaMask
 * @param address - Ethereum address to check
 * @returns Complete registry status
 */
export async function getRegistryStatusWithMetaMask(
  address: string
): Promise<MetaMaskRegistryStatus> {
  try {
    if (!address) {
      return {
        isRegistered: false,
        isLoading: false,
        error: 'Address is required'
      };
    }

    const metaAddress = await getMetaAddressWithMetaMask(address);
    
    return {
      isRegistered: metaAddress !== null && metaAddress !== 'st:eth:0x',
      metaAddress: metaAddress || undefined,
      isLoading: false,
      error: undefined
    };
  } catch (error) {
    console.error('Error getting registry status:', error);
    return {
      isRegistered: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Wait for transaction confirmation
 * @param txHash - Transaction hash
 * @param confirmations - Number of confirmations to wait for
 * @returns True if confirmed, false if failed
 */
export async function waitForTransactionConfirmation(
  txHash: string,
  confirmations: number = 1
): Promise<boolean> {
  try {
    console.log(`Waiting for transaction confirmation: ${txHash}`);
    
    if (!isMetaMaskAvailable()) {
      throw new Error('MetaMask not available');
    }

    // Wait for transaction receipt
    const receipt = await window.ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    });

    if (!receipt) {
      // Transaction not yet mined, wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return waitForTransactionConfirmation(txHash, confirmations);
    }

    // Check if transaction was successful
    if (receipt.status === '0x0') {
      console.error('Transaction failed');
      return false;
    }

    console.log('Transaction confirmed');
    return true;
  } catch (error) {
    console.error('Error waiting for transaction confirmation:', error);
    return false;
  }
}

/**
 * Get transaction details
 * @param txHash - Transaction hash
 * @returns Transaction details
 */
export async function getTransactionDetails(txHash: string): Promise<any> {
  try {
    if (!isMetaMaskAvailable()) {
      throw new Error('MetaMask not available');
    }

    const tx = await window.ethereum.request({
      method: 'eth_getTransactionByHash',
      params: [txHash]
    });

    const receipt = await window.ethereum.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash]
    });

    return {
      transaction: tx,
      receipt: receipt,
      confirmed: receipt !== null,
      success: receipt && receipt.status === '0x1'
    };
  } catch (error) {
    console.error('Error getting transaction details:', error);
    throw error;
  }
}

/**
 * Switch to Base Sepolia network
 */
export async function switchToBaseSepolia(): Promise<boolean> {
  try {
    if (!isMetaMaskAvailable()) {
      throw new Error('MetaMask not available');
    }

    const chainId = '0x14a34'; // Base Sepolia chain ID (84532 in decimal)
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId,
              chainName: 'Base Sepolia',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org']
            }]
          });
          return true;
        } catch (addError) {
          console.error('Error adding Base Sepolia network:', addError);
          return false;
        }
      }
      throw switchError;
    }
  } catch (error) {
    console.error('Error switching to Base Sepolia:', error);
    return false;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      Contract: any;
    };
  }
}
