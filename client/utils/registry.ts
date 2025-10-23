/**
 * Registry utilities for ERC-6538 Registry contract
 * Handles registration and lookup of stealth meta-addresses
 */

import { useWriteContract, useReadContract } from 'wagmi';
import { REGISTRY_ADDRESS } from '../constants/contracts';
import registryAbi from '../constants/abi/registry.json';
import { isValidEthAddress } from './validation';

/**
 * Hook to register a stealth meta-address to the registry
 * @param metaAddress - Stealth meta-address to register
 * @returns Write contract function and transaction state
 */
export const useRegisterMetaAddress = () => {
  const { writeContract, isPending, error, data: hash } = useWriteContract();
  
  const registerMetaAddress = async (metaAddress: string) => {
    if (!metaAddress) {
      throw new Error('Meta address is required');
    }
    
    if (!metaAddress.startsWith('st:eth:0x')) {
      throw new Error('Invalid meta address format');
    }
    
    try {
      // Extract just the public keys portion (remove 'st:eth:' prefix)
      // Input format: st:eth:0x[spendingPubKey][viewingPubKey]
      // Registry expects: 0x[spendingPubKey][viewingPubKey]
      const publicKeysHex = metaAddress.slice(7); // Remove 'st:eth:' -> '0x[keys]'
      
      await writeContract({
        address: REGISTRY_ADDRESS,
        abi: registryAbi,
        functionName: 'registerKeys',
        args: [BigInt(1), publicKeysHex], // Pass as-is: 0x[keys]
      });
    } catch (error) {
      console.error('Error registering meta address:', error);
      throw error;
    }
  };
  
  return {
    registerMetaAddress,
    isPending,
    error,
    hash,
  };
};

/**
 * Hook to get meta-address from registry for a given Ethereum address
 * @param address - Ethereum address to lookup
 * @returns Meta-address from registry or null if not found
 */
export const useGetMetaAddressFromRegistry = (address: string) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: registryAbi,
    functionName: 'stealthMetaAddressOf',
    args: [address as `0x${string}`, BigInt(1)], // schemeId = 1 for ERC-5564
    query: {
      enabled: !!address && isValidEthAddress(address),
      staleTime: 30000, // Cache for 30 seconds
    },
  });
  
  // Convert bytes result to meta-address format
  const metaAddress = data && data !== '0x' 
    ? `st:eth:${data}` 
    : null;
  
  return {
    metaAddress,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook to check if an address is registered in the registry
 * @param address - Ethereum address to check
 * @returns Boolean indicating if address is registered
 */
export const useIsAddressRegistered = (address: string) => {
  const { metaAddress, isLoading, error } = useGetMetaAddressFromRegistry(address);
  
  return {
    isRegistered: !!metaAddress && metaAddress !== 'st:eth:0x',
    isLoading,
    error,
  };
};

/**
 * Utility function to register meta-address (for use outside React components)
 * @param metaAddress - Stealth meta-address to register
 * @param writeContract - Write contract function from wagmi
 */
export const registerMetaAddress = async (
  metaAddress: string,
  writeContract: any
): Promise<string> => {
  if (!metaAddress) {
    throw new Error('Meta address is required');
  }
  
  if (!metaAddress.startsWith('st:eth:0x')) {
    throw new Error('Invalid meta address format');
  }
  
  try {
    // Extract just the public keys portion (remove 'st:eth:' prefix)
    // Input format: st:eth:0x[spendingPubKey][viewingPubKey]
    // Registry expects: 0x[spendingPubKey][viewingPubKey]
    const publicKeysHex = metaAddress.slice(7); // Remove 'st:eth:' -> '0x[keys]'
    
    const hash = await writeContract({
      address: REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: 'registerKeys',
      args: [BigInt(1), publicKeysHex], // Pass as-is: 0x[keys]
    });
    
    return hash;
  } catch (error) {
    console.error('Error registering meta address:', error);
    throw error;
  }
};

/**
 * Utility function to get meta-address from registry (for use outside React components)
 * @param address - Ethereum address to lookup
 * @param readContract - Read contract function from wagmi
 * @returns Meta-address from registry or null if not found
 */
export const getMetaAddressFromRegistry = async (
  address: string,
  readContract: any
): Promise<string | null> => {
  if (!address || !isValidEthAddress(address)) {
    return null;
  }
  
  try {
    const data = await readContract({
      address: REGISTRY_ADDRESS,
      abi: registryAbi,
      functionName: 'stealthMetaAddressOf',
      args: [address, BigInt(1)], // schemeId = 1 for ERC-5564
    });
    
    // Convert bytes result to meta-address format
    return data && data !== '0x' ? `st:eth:${data}` : null;
  } catch (error) {
    console.error('Error getting meta address from registry:', error);
    return null;
  }
};

/**
 * Utility function to check if address is registered (for use outside React components)
 * @param address - Ethereum address to check
 * @param readContract - Read contract function from wagmi
 * @returns Boolean indicating if address is registered
 */
export const isAddressRegistered = async (
  address: string,
  readContract: any
): Promise<boolean> => {
  const metaAddress = await getMetaAddressFromRegistry(address, readContract);
  return !!metaAddress && metaAddress !== 'st:eth:0x';
};

/**
 * Registry status interface
 */
export interface RegistryStatus {
  isRegistered: boolean;
  metaAddress?: string;
  registrationTx?: string;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Hook to get comprehensive registry status for an address
 * @param address - Ethereum address to check
 * @returns Complete registry status
 */
export const useRegistryStatus = (address: string): RegistryStatus => {
  const { metaAddress, isLoading, error } = useGetMetaAddressFromRegistry(address);
  
  return {
    isRegistered: !!metaAddress && metaAddress !== 'st:eth:0x',
    metaAddress: metaAddress || undefined,
    isLoading,
    error: error as Error | null,
  };
};
