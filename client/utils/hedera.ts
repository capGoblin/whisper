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
import { REGISTRY_ADDRESS } from "../constants/contracts";

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
 * Based on the Hashinal WC implementation from the gist
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

    // Get account info to ensure we're connected
    const accountInfo = await sdk.getAccountInfo();
    if (!accountInfo) {
      throw new Error("No account connected");
    }

    console.log("Sending message using Hashinal WC SDK with topic creation...");

    // Create a new topic for this message
    const createTopicTx = new TopicCreateTransaction()
      .setTopicMemo(`Stealth message to ${messageData.stealthAddress}`)
      .setAutoRenewAccountId(accountInfo.accountId)
      .setNodeAccountIds([new AccountId(3)]);

    // Execute topic creation using Hashinal WC SDK
    const createTopicReceipt = await sdk.executeTransaction(createTopicTx);
    const topicId = createTopicReceipt.topicId;

    if (!topicId) {
      throw new Error("Failed to create topic");
    }

    console.log(`Created topic: ${topicId}`);

    // Prepare the message content with stealth address metadata
    const messageContent = {
      type: "stealth-message",
      content: messageData.content,
      metadata: messageData.metadata,
      stealthAddress: messageData.stealthAddress,
      ephemeralPubKey: messageData.ephemeralPubKey,
      recipient: messageData.recipient,
      timestamp: Date.now(),
    };

    // Submit message to the topic
    const submitMessageTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(messageContent))
      .setNodeAccountIds([new AccountId(3)]);

    // Execute message submission using Hashinal WC SDK
    const submitMessageReceipt = await sdk.executeTransaction(submitMessageTx);

    console.log(`Message submitted to topic ${topicId}`);

    return {
      transactionId: submitMessageReceipt.status?.toString() || "PPunknown",
      success: true,
    };
  } catch (error) {
    console.error("Error sending message with Hashinal WC SDK:", error);
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
