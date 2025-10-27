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
  decryptionSuccess?: boolean; // Whether the message was successfully decrypted
  type?: 'message' | 'file'; // Type of message content (Hedera Testnet)
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
  isRead?: boolean; // Track if message has been read
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

// Hedera-specific types

export interface HederaMessage {
  topicId: string;
  content: any;
  timestamp: number;
  sender: string;
  messageId: string;
}

export interface HederaTransactionState {
  status: 'idle' | 'preparing' | 'pending' | 'confirming' | 'confirmed' | 'failed';
  transactionId?: string;
  topicId?: string;
  error?: string;
  blockNumber?: number;
  // For file uploads - track multiple transaction IDs
  fileUploadTransactions?: {
    topicCreationTxId?: string;
    fileUploadTxId?: string;
    stealthAnnouncementTxId?: string;
  };
}

export interface HederaTransactionResult {
  transactionId: string;
  topicId?: string;
  success: boolean;
  error?: string;
}

export interface HederaScanResult {
  messages: DecryptedMessage[];
  totalScanned: number;
  newMessages: number;
}

export interface HederaFileData {
  fileName: string;
  mimeType: string;
  size: number;
  checksum: string;
  encryptedData: number[]; // Array of numbers for JSON serialization
  timestamp: number;
  version: string;
}

export interface HederaMessageContent {
  type: 'message' | 'file' | 'tip';
  content: string | HederaFileData;
  timestamp: number;
  sender?: string;
  recipient?: string;
  sharedSecret?: string;
  version: string;
}

// MetaMask integration types

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

// File processing types

export interface ProcessedFile {
  compressedData: Uint8Array;
  encryptedData: Uint8Array;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
}

// Enhanced message types for Hedera integration

export interface HederaDecryptedMessage extends DecryptedMessage {
  topicId?: string;
  messageId?: string;
  sender?: string;
  fileData?: HederaFileData;
}

export interface HederaMessageInput {
  recipient: string;
  content: string | HederaFileData;
  type: 'message' | 'file' | 'tip';
  sharedSecret?: string;
}

// Wallet connection types

export interface WalletConnectionState {
  isConnected: boolean;
  accountId: string | null;
  isConnecting: boolean;
  error?: string;
}

export interface HederaWalletState extends WalletConnectionState {
  sdk: any | null; // HashinalsWalletConnectSDK instance
  network: 'testnet' | 'mainnet';
  balance?: string;
}


