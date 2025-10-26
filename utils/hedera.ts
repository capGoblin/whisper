import { DAppConnector, DAppSigner } from "@hashgraph/hedera-wallet-connect";
import { UserKeys, DecryptedMessage } from "../types";
import { scanForSimpleMessages } from "./scan-simple";
import { scanForMessagesOfficial } from "./stealth-sdk-official";
import { HashinalsWalletConnectSDK } from "@hashgraphonline/hashinal-wc";
import { inscribeWithSigner } from "@hashgraphonline/standards-sdk";
import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  AccountId,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
} from "@hashgraph/sdk";
import { REGISTRY_ADDRESS, ANNOUNCE_CONTRACT_ADDRESS } from "../constants/contracts";

/**
 * Scan for messages using Hashinal WC SDK
 * Based on the Hashinal WC implementation from the gist
 */
export const scanMessages = async (
  userKeys: UserKeys,
  sdk: HashinalsWalletConnectSDK
): Promise<DecryptedMessage[]> => {
  try {
    if (!sdk) {
      throw new Error("Hashinal WC SDK not initialized");
    }

    // Use Hashinal WC SDK's executeTransaction method for scanning
    // This follows the pattern from the gist for client-side operations
    console.log("Scanning for messages using Hashinal WC SDK...");

    // Get account info to ensure we're connected
    const accountInfo = await sdk.getAccountInfo();
    if (!accountInfo) {
      throw new Error("No account connected");
    }

    // Use the official SDK implementation for scanning announcements
    const messages = await scanForMessagesOfficial(userKeys);

    // Convert to DecryptedMessage format expected by the dashboard
    const decryptedMessages: DecryptedMessage[] = messages.map(
      (message, index) => ({
        from: message.from,
        content: message.content,
        timestamp: message.timestamp,
        stealthAddress: message.stealthAddress,
        decryptionSuccess: true,
        sharedSecret: "",
        viewTag: "",
      })
    );

    console.log(
      `Found ${decryptedMessages.length} messages using Hashinal WC SDK`
    );
    return decryptedMessages;
  } catch (error) {
    console.error("Error scanning messages with Hashinal WC SDK:", error);
    throw error;
  }
};

/**
 * Send message using Hashinal WC SDK
 * Calls the ERC5564Announcer contract to announce stealth message
 */
export const sendMessage = async (
  sdk: HashinalsWalletConnectSDK,
  messageData: {
    recipient: string;
    content: string;
    stealthAddress: string;
    ephemeralPubKey: string;
    metadata: string;
  }
): Promise<{ transactionId: string; success: boolean }> => {
  try {
    if (!sdk) {
      throw new Error("Hashinal WC SDK not initialized");
    }

    console.log("Announcing stealth message to contract 0.0.7130322...");

    // Get account info to ensure we're connected and get account details
    const accountInfo = await sdk.getAccountInfo();
    if (!accountInfo) {
      throw new Error("No account connected");
    }

    console.log(`Connected account: ${accountInfo.accountId}`);

    // Create contract execute transaction for the announce function
    const contractTx = new ContractExecuteTransaction()
      .setContractId("0.0.7130322") // ERC5564Announcer on Hedera Testnet
      .setGas(100000)
      .setTransactionValidDuration(120) // Maximum allowed: 120 seconds
      .setNodeAccountIds([new AccountId(3)]) // Required for transaction execution
      .setFunction(
        "announce",
        new ContractFunctionParameters()
          .addUint256(1) // schemeId = 1 (ERC-5564)
          .addAddress(messageData.stealthAddress)
          .addBytes(new Uint8Array(Buffer.from(messageData.ephemeralPubKey.replace('0x', ''), 'hex')))
          .addBytes(new Uint8Array(Buffer.from(messageData.metadata.replace('0x', ''), 'hex')))
      );

    // Execute the contract transaction
    const receipt = await sdk.executeTransaction(contractTx);

    console.log(`Stealth message announced to contract 0.0.7130322`);

    return {
      transactionId: receipt.status?.toString() || "unknown",
      success: true,
    };
  } catch (error) {
    console.error("Error announcing stealth message:", error);
    throw error;
  }
};

/**
 * Send file using Hashinal WC SDK with HCS topic creation
 * Uploads file to Hedera topic and returns metadata for stealth message
 */
export const sendFile = async (
  sdk: HashinalsWalletConnectSDK,
  fileData: {
    file: File;
    recipient: string;
    stealthAddress: string;
    ephemeralPubKey: string;
  }
): Promise<{ 
  transactionId: string; 
  topicId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  success: boolean 
}> => {
  try {
    if (!sdk) {
      throw new Error("Hashinal WC SDK not initialized");
    }

    // Get account info to ensure we're connected
    const accountInfo = await sdk.getAccountInfo();
    if (!accountInfo) {
      throw new Error("No account connected");
    }

    console.log(`Uploading file: ${fileData.file.name} (${fileData.file.size} bytes)`);

    // Create a new topic for this file
    const createTopicTx = new TopicCreateTransaction()
      .setTopicMemo(`Stealth file: ${fileData.file.name} to ${fileData.stealthAddress}`)
      .setAutoRenewAccountId(accountInfo.accountId)
      .setNodeAccountIds([new AccountId(3)]);

    // Execute topic creation using Hashinal WC SDK
    const createTopicReceipt = await sdk.executeTransaction(createTopicTx);
    const topicId = createTopicReceipt.topicId;

    if (!topicId) {
      throw new Error("Failed to create topic for file");
    }

    console.log(`Created topic for file: ${topicId}`);

    // Read file as ArrayBuffer
    const fileArrayBuffer = await fileData.file.arrayBuffer();
    const fileBytes = new Uint8Array(fileArrayBuffer);

    console.log(`Uploading ${fileBytes.length} bytes to topic ${topicId}...`);

    // Submit file data to the topic
    const submitFileTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(fileBytes)
      .setNodeAccountIds([new AccountId(3)]);

    // Execute file submission using Hashinal WC SDK
    const submitFileReceipt = await sdk.executeTransaction(submitFileTx);

    console.log(`File uploaded to topic ${topicId}`);

    return {
      transactionId: submitFileReceipt.status?.toString() || "unknown",
      topicId: topicId.toString(),
      fileName: fileData.file.name,
      mimeType: fileData.file.type,
      fileSize: fileData.file.size,
      success: true,
    };
  } catch (error) {
    console.error("Error uploading file with Hashinal WC SDK:", error);
    throw error;
  }
};

/**
 * Download file from Hedera HCS topic using Mirror Node API
 * Retrieves file bytes from topic and reconstructs the original file
 */
export const downloadFileFromTopic = async (
  topicId: string,
  fileName: string,
  mimeType: string,
  fileSize?: number
): Promise<Blob> => {
  try {
    console.log(`Downloading file from topic: ${topicId}`);

    // Query Mirror Node API for topic messages
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;
    
    console.log(`Fetching from Mirror Node: ${mirrorNodeUrl}`);
    
    const response = await fetch(mirrorNodeUrl);
    
    if (!response.ok) {
      throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.messages || data.messages.length === 0) {
      throw new Error(`No messages found in topic ${topicId}`);
    }

    console.log(`Found ${data.messages.length} message(s) in topic`);

    // Get ALL messages and concatenate them to reconstruct the complete file
    let allFileBytes = new Uint8Array(0);

    // Sort messages by sequence number to ensure correct order
    const sortedMessages = data.messages.sort((a, b) => a.sequence_number - b.sequence_number);

    console.log(`Concatenating ${sortedMessages.length} message chunks...`);

    for (const message of sortedMessages) {
      // Decode base64 message content to get file bytes
      const base64Content = message.message;
      const binaryString = atob(base64Content);
      const messageBytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        messageBytes[i] = binaryString.charCodeAt(i);
      }
      
      // Concatenate with existing bytes
      const newArray = new Uint8Array(allFileBytes.length + messageBytes.length);
      newArray.set(allFileBytes);
      newArray.set(messageBytes, allFileBytes.length);
      allFileBytes = newArray;
      
      console.log(`Added ${messageBytes.length} bytes from sequence ${message.sequence_number}, total: ${allFileBytes.length} bytes`);
    }

    console.log(`Downloaded complete file: ${allFileBytes.length} bytes from topic (expected: ${fileSize || 'unknown'} bytes)`);

    // Create blob with correct MIME type
    const blob = new Blob([allFileBytes], { type: mimeType });
    
    return blob;
  } catch (error) {
    console.error(`Error downloading file from topic ${topicId}:`, error);
    throw error;
  }
};

/**
 * Register meta-address using Hashinal WC SDK
 * Makes a direct transaction to the registry contract
 */
export const registerMetaAddress = async (
  sdk: HashinalsWalletConnectSDK,
  metaAddress: string
): Promise<{ transactionId: string; success: boolean }> => {
  try {
    if (!sdk) {
      throw new Error("Hashinal WC SDK not initialized");
    }

    // Get account info to ensure we're connected
    const accountInfo = await sdk.getAccountInfo();
    if (!accountInfo) {
      throw new Error("No account connected");
    }

    console.log("Registering meta-address using Hashinal WC SDK...");

    // Extract the public keys from the meta-address (remove 'st:eth:' prefix)
    const publicKeysHex = metaAddress.startsWith("st:eth:")
      ? metaAddress.slice(7) // Remove 'st:eth:' prefix
      : metaAddress;

    // Create contract function parameters for registerKeys
    console.log(
      `Registering meta-address to registry contract: ${REGISTRY_ADDRESS}`
    );
    console.log(`Public keys data: ${publicKeysHex}`);

    // The registry contract's registerKeys function signature is:
    // registerKeys(uint256 schemeId, bytes calldata stealthMetaAddress)
    const params = new ContractFunctionParameters()
      .addUint256(1) // schemeId = 1 for ERC-5564
      .addBytes(new Uint8Array(Buffer.from(publicKeysHex, "hex"))); // Convert hex string to Uint8Array

    // For Hedera, we need to use the contract ID format
    // The REGISTRY_ADDRESS is an Ethereum address, but Hedera needs a different format
    // We need to find the actual Hedera contract ID for the registry
    // For now, let's use a placeholder - in production, you'd need the real contract ID
    const hederaContractId = "0.0.123456"; // TODO: Replace with actual Hedera contract ID

    console.log(`Using Hedera contract ID: ${hederaContractId}`);
    console.log(`Original Ethereum address: ${REGISTRY_ADDRESS}`);

    // Execute the smart contract function using the SDK
    const result = await sdk.executeSmartContract(
      hederaContractId, // Hedera contract ID
      "registerKeys", // function name
      params, // parameters
      200000 // gas limit
    );

    console.log(
      `Meta-address registered with transaction: ${result.status || "unknown"}`
    );

    return {
      transactionId: result.status?.toString() || "unknown",
      success: true,
    };
  } catch (error) {
    console.error(
      "Error registering meta-address with Hashinal WC SDK:",
      error
    );
    throw error;
  }
};

/**
 * Alternative scanning method using the simple implementation
 * This provides more detailed decryption capabilities
 */
export const scanMessagesDetailed = async (
  userKeys: UserKeys,
  publicClient: any
): Promise<DecryptedMessage[]> => {
  try {
    return await scanForSimpleMessages(publicClient, userKeys);
  } catch (error) {
    console.error(
      "Error scanning messages with detailed implementation:",
      error
    );
    throw error;
  }
};
