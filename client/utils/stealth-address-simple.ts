import * as secp from '@noble/secp256k1';
import { keccak256 } from 'viem';

// Helper functions - using correct @noble/secp256k1 API
export function randomPrivateKey() {
    const randPrivateKey = secp.utils.randomSecretKey();
    return randPrivateKey; // Return Uint8Array directly, not BigInt
}

export function toEthAddress(PublicKey: string) {
    const hash = keccak256(Buffer.from(PublicKey, 'hex').slice(1));
    return "0x" + hash.slice(-40);
}

/**
 * Generate stealth address - exact copy from working @app/ implementation
 * Borrowed from https://github.dev/nerolation/stealth-utils
 */
export const generateStealthAddress = async (stealthMetaAddress: string) => {
  const USER = stealthMetaAddress;
  if (!USER.startsWith("st:eth:0x")){
    throw "Wrong address format; Address must start with `st:eth:0x...`";
  }

  const R_pubkey_spend = secp.Point.fromHex(USER.slice(9,75));
  const R_pubkey_view = secp.Point.fromHex(USER.slice(75,));

  const ephemeralPrivateKey = randomPrivateKey();
  const ephemeralPublicKey = secp.getPublicKey(ephemeralPrivateKey, true);

  const sharedSecret = secp.getSharedSecret(ephemeralPrivateKey, R_pubkey_view);

  // sharedSecret is a Uint8Array, skip the first byte (0x04 prefix for uncompressed point)
  const hashedSharedSecret = keccak256(sharedSecret.slice(1));

  // ViewTag should be first byte of the hash (after 0x prefix)
  const ViewTag = hashedSharedSecret.slice(2, 4); // Get first byte as hex string
  
  // Remove 0x prefix and convert to proper format for Point creation
  const hashedSharedSecretHex = hashedSharedSecret.slice(2); // Remove 0x prefix
  const hashedSharedSecretPoint = secp.Point.fromPrivateKey(hashedSharedSecretHex);
  const stealthPublicKey = R_pubkey_spend.add(hashedSharedSecretPoint);
  const stealthAddress = toEthAddress(stealthPublicKey.toHex());
  
  return {
    "stealthAddress": stealthAddress, 
    "ephemeralPublicKey": "0x" + Buffer.from(ephemeralPublicKey).toString('hex'), 
    "viewTag": "0x" + ViewTag
  };
};
