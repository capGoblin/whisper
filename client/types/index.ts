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

// New types for production-ready implementation

export interface RegistryStatus {
  isRegistered: boolean;
  metaAddress?: string;
  registrationTx?: string;
  isLoading?: boolean;
  error?: Error | null;
}

export interface EncryptedMessage {
  viewTag: string;
  encryptedContent: string;
  metadata: string; // Combined: viewTag + encryptedContent
}

export interface DecryptedMessage extends Message {
  decryptionSuccess: boolean;
  sharedSecret?: string;
  viewTag?: string;
}

export interface TransactionState {
  status: 'idle' | 'preparing' | 'pending' | 'confirming' | 'confirmed' | 'failed';
  hash?: string;
  error?: string;
  blockNumber?: number;
}

export interface MessageInput {
  recipient: string; // Meta-address, ETH address, or ENS
  message: string;
  recipientType: 'meta-address' | 'eth-address' | 'ens' | 'invalid';
}

export interface RecipientInfo {
  address: string;
  metaAddress?: string;
  type: 'meta-address' | 'eth-address' | 'ens';
  isRegistered: boolean;
  isLoading: boolean;
  error?: string;
}

export interface StealthAddressWithEncryption extends StealthAddressResult {
  sharedSecret: string;
  viewTag: string;
  encryptedMetadata: string;
}

export interface MessageHistory {
  sent: Message[];
  received: DecryptedMessage[];
  lastScanned: number;
}

export interface UserProfile {
  keys: UserKeys | null;
  metaAddress: StealthMetaAddress | null;
  isRegistered: boolean;
  registrationTx?: string;
  messageHistory: MessageHistory;
}


