# Whisper - Anonymous Messaging via Stealth Addresses 

**Solving the fundamental privacy crisis in digital communication**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13.5.1-black)](https://nextjs.org/)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-green)](https://hedera.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)](https://www.typescriptlang.org/)

## 🚨 The Problem

**Digital communication is fundamentally broken.** Every message you send, every file you share, every conversation you have is being monitored, stored, and analyzed.

### Current State of Privacy
- **Signal**: Requires phone numbers, centralized servers, government cooperation
- **Telegram**: Centralized, metadata collection, government backdoors
- **WhatsApp**: Owned by Meta, data sharing, surveillance
- **Email**: Completely transparent, stored forever, easily intercepted
- **Blockchain**: All transactions public, addresses linkable, permanent records

### The Real Cost
- **Journalists** can't protect sources
- **Activists** face government surveillance
- **Whistleblowers** risk their lives
- **Businesses** lose competitive advantage
- **Individuals** have no digital privacy

**The fundamental issue: There is no way to send a message without revealing who you are talking to.**

## 💡 Our Solution

**Send secret messages/files to any public address/ENS. The twist? The receiver won't know who sent it.**

### The Revolutionary Capability
- **Send to ANY public address**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- **Send to ANY ENS name**: `vitalik.eth`
- **Receiver gets the message**: But has no idea who sent it
- **Complete sender anonymity**: Zero traceability back to you

### How It Works
```
You (Anonymous) → Public Address → Secret Message Received
     ↓                    ↓                    ↓
   Unknown to          Looks like spam      "Who sent this?"
   recipient           or random message    "How did they get my address?"
```

### The Breakthrough
We've solved the **fundamental privacy paradox**:

**Traditional Problem**: To send a message, you must reveal who you are
**Our Solution**: Send messages to public addresses while staying completely anonymous

```
Traditional Messaging:
You → Recipient
(Recipient knows: "This came from John")

Whisper:
You → Recipient  
(Recipient knows: "This came from... someone?")
```

## 🎯 Why This Matters

### For Journalists
- **Anonymous tips to public figures**: Send sensitive information to `vitalik.eth` without revealing your identity
- **Whistleblower protection**: Contact any public address with evidence without fear of retribution
- **Source protection**: Communicate with sources who have public addresses without compromising them

### For Activists
- **Direct anonymous communication**: Send messages to government officials' public addresses
- **Covert coordination**: Organize with activists who only have public blockchain addresses
- **Safe information sharing**: Share sensitive intel with any public address holder

### For Businesses
- **Anonymous market intelligence**: Send competitive information to any public address
- **Covert negotiations**: Communicate with potential partners without revealing your identity
- **Anonymous feedback**: Send honest feedback to company founders' public addresses

### For Everyone
- **Anonymous fan mail**: Send messages to celebrities, influencers, or public figures
- **Secret admirer**: Send anonymous messages to anyone with a public address
- **Anonymous complaints**: Send feedback to companies or individuals without fear of retaliation
- **Mystery communication**: Send messages to friends, family, or colleagues as a surprise

## 💬 Real-World Use Cases

### Scenario 1: Anonymous Whistleblower
```
Situation: You discover corporate fraud at a major company
Problem: Company founder has public address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Solution: Send anonymous evidence via Whisper
Result: Founder receives encrypted evidence, has no idea who sent it
```

### Scenario 2: Secret Admirer
```
Situation: You want to send a message to someone you admire
Problem: They only have a public ENS name (e.g., vitalik.eth)
Solution: Send anonymous message via Whisper
Result: They receive your message, wonder who sent it
```

### Scenario 3: Anonymous Feedback
```
Situation: You want to give honest feedback to a company
Problem: Company founder's address is public, but you fear retaliation
Solution: Send anonymous feedback via Whisper
Result: Founder gets honest feedback without knowing the source
```

### Scenario 4: Covert Intelligence
```
Situation: You have sensitive market information
Problem: Target company's CEO has public address
Solution: Send anonymous intelligence via Whisper
Result: CEO receives valuable intel, can't trace it back to you
```

## 🏆 Why We're the Best Team

### Technical Excellence
- **Deep cryptography expertise** in elliptic curve cryptography
- **Blockchain architecture** experience with multiple networks
- **Security-first mindset** with WebAuthn and biometric authentication
- **Standards compliance** implementing EIP-5564 and EIP-6538

### Market Understanding
- **Privacy advocacy** background
- **Journalism and activism** connections
- **Enterprise security** experience
- **User experience** focus for mainstream adoption

### Execution Capability
- **Working prototype** deployed on Hedera Testnet
- **Production-ready** smart contracts
- **Scalable architecture** for millions of users
- **Clear roadmap** for multi-network deployment

## 🚀 The Technology

### Core Innovation: Stealth Addresses
```
Traditional: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Stealth:    0x8f4a9c2e1b7d5f3a6e8c9b2d4f7a1e5c8b3f6a9e
           (Generated uniquely for each message)
```

### How It Works
1. **Recipients register** a stealth meta-address (spendPub + viewPub) for their ENS name, using ERC‑6538 standards
2. **Senders generate** a one-time ephemeral key, derive a shared secret with the recipient's view key (ECDH), compute a stealth address, and encrypt the payload following ERC‑5564 stealth address standards
3. **Encrypted files** are uploaded to Hedera Consensus Service (HCS) topics, and a delivery announcement is posted via HCS. Each announcement contains the ephemeral public key, a one-byte viewTag for quick filtering, and a pointer to the HCS topic
4. **Recipients scan** HCS messages, filter by viewTag, reconstruct the shared secret, decrypt the payload, and derive the stealth private key to access files

### Hedera Integration
- **Hedera Consensus Service (HCS)**: Fast, low-fee messaging infrastructure for announcements
- **HCS Topics**: Decentralized file storage with automatic replication
- **Mirror Node API**: Efficient scanning and retrieval of messages
- **Low-Cost Transactions**: ~$0.0001 per message and file upload
- **Fast Finality**: 3-5 second transaction confirmation

### Technical Stack
- **EIP-5564 Stealth Addresses**: Industry standard for anonymous transactions
- **EIP-6538 Registry**: Maps public addresses to stealth meta-addresses
- **Hedera Hashgraph**: Low-cost, fast, EVM-compatible blockchain
- **WebAuthn**: Biometric authentication for key generation
- **AES-256-GCM**: Military-grade encryption

### Hedera File Upload Architecture
```
File Upload Flow:
1. Sender encrypts file with AES-256-GCM
2. File chunks uploaded to HCS Topic (Hedera Consensus Service)
3. File metadata encrypted and sent via stealth message
4. Recipient scans HCS for announcements
5. Recipient downloads file chunks from HCS Topic
6. File reconstructed and decrypted locally

Benefits:
- Decentralized file storage via HCS Topics
- Automatic replication across Hedera network
- Low-cost: ~$0.0001 per file upload
- Fast: 3-5 second upload confirmation
- Immutable: Files stored permanently on Hedera
```

### Architecture
```
User A (Sender)                    User B (Recipient)
     │                                    │
     │ 1. Generate ephemeral key          │
     │ 2. Compute shared secret          │
     │ 3. Derive stealth address         │
     │ 4. Encrypt message/file           │
     │                                    │
     └─────────── Hedera HCS ────────────┘
     │                                    │
     │ 5. Upload to HCS Topic             │
     │ 6. Announce via HCS               │
     │ 7. Scan HCS messages              │
     │ 8. Download from HCS Topic        │
     │ 9. Decrypt using private keys     │
```

## 🌐 Why Hedera?

### Perfect for Anonymous Messaging
- **Hedera Consensus Service (HCS)**: Built-in messaging infrastructure perfect for stealth announcements
- **HCS Topics**: Decentralized file storage with automatic replication
- **Low Fees**: ~$0.0001 per message and file upload (vs Ethereum's $10+)
- **Fast Finality**: 3-5 second confirmation (vs Ethereum's 12+ seconds)
- **EVM Compatible**: Works with existing Ethereum tooling and standards
- **Carbon Negative**: Environmentally sustainable blockchain

### Technical Advantages
- **Mirror Node API**: Efficient scanning and retrieval of HCS messages
- **Automatic Replication**: Files stored across multiple nodes automatically
- **Immutable Storage**: Messages and files stored permanently
- **High Throughput**: Handles thousands of transactions per second
- **Stable Fees**: Predictable costs unlike Ethereum's volatile gas prices

