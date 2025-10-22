import { StealthMetaAddress } from '../types';

// Your actual stealth meta-address for POC testing
// This is your real meta-address generated from your WebAuthn keys
export const RECIPIENT_META_ADDRESS: StealthMetaAddress = {
  spendingPubKey: "0x020941cc2ac565d256c52288c27e9f24a759ecdc5631d0c6f26739282e7da81b4",
  viewingPubKey: "0x3033b97b7d3f9edaf9a01f0ae5097cb5fba5ee8ec66fe47cc33f3676a7e73bcd292",
  formatted: "st:eth:0x020941cc2ac565d256c52288c27e9f24a759ecdc5631d0c6f26739282e7da81b43033b97b7d3f9edaf9a01f0ae5097cb5fba5ee8ec66fe47cc33f3676a7e73bcd292"
};

// Your actual private keys (for recipient testing only - never expose in production)
// These are stored in your browser localStorage and used for scanning
export const RECIPIENT_PRIVATE_KEYS = {
  spendingPrivateKey: "0x[YOUR_SPENDING_PRIVATE_KEY]", // This comes from your WebAuthn keys
  viewingPrivateKey: "0x[YOUR_VIEWING_PRIVATE_KEY]"   // This comes from your WebAuthn keys
};

// Test message for POC
export const DEFAULT_MESSAGE = "hi";

// POC configuration
export const POC_CONFIG = {
  schemeId: 1,
  maxMessageLength: 100,
  networkName: "Base Sepolia",
  explorerUrl: "https://sepolia.basescan.org"
};
