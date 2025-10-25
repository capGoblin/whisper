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
} from "@hashgraph/sdk";

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
      transactionId: submitMessageReceipt.status?.toString() || "unknown",
      success: true,
    };
  } catch (error) {
    console.error("Error sending message with Hashinal WC SDK:", error);
    throw error;
  }
};

/**
 * Register meta-address using Hashinal WC SDK
 * Based on the Hashinal WC implementation from the gist
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

    // Create a topic for meta-address registration
    const createTopicTx = new TopicCreateTransaction()
      .setTopicMemo(`Meta-address registration: ${metaAddress}`)
      .setAutoRenewAccountId(accountInfo.accountId);

    // Execute topic creation for registration
    const createTopicReceipt = await sdk.executeTransaction(createTopicTx);
    const topicId = createTopicReceipt.topicId;

    if (!topicId) {
      throw new Error("Failed to create registration topic");
    }

    // Submit meta-address to the topic
    const registrationContent = {
      type: "meta-address-registration",
      metaAddress: metaAddress,
      accountId: accountInfo.accountId,
      timestamp: Date.now(),
    };

    const submitRegistrationTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(registrationContent));

    const submitReceipt = await sdk.executeTransaction(submitRegistrationTx);

    console.log(`Meta-address registered in topic ${topicId}`);

    return {
      transactionId: submitReceipt.status?.toString() || "unknown",
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
