export interface StealthMetaAddress {
  spendingPubKey: string; // 0x prefixed hex
  viewingPubKey: string;  // 0x prefixed hex
  formatted: string;      // st:eth:0x<spending><viewing>
}

export interface AnnouncementData {
  schemeId: number;
  stealthAddress: string;
  ephemeralPubKey: string;
  metadata: string; // Contains encrypted message
  viewTag: string;
}

export interface Message {
  from: string; // "Anonymous" for POC
  content: string;
  timestamp: number;
  stealthAddress: string;
}

export interface StealthAddressResult {
  stealthAddress: string;
  ephemeralPubKey: string;
  viewTag: string;
  encryptedMessage: string;
}

export interface UserKeys {
  viewingPrivateKey: string;
  spendingPrivateKey: string;
  spendingPublicKey: string;
  viewingPublicKey: string;
}

export interface StealthKeyPair {
  privateKey: string;
  publicKey: string;
}
