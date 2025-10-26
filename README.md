# Whisper - Anonymous Stealth Messaging on Hedera

![Whisper Logo](https://via.placeholder.com/400x200/1a1a1a/ffffff?text=Whisper)

**Send encrypted messages and files anonymously using EIP-5564 Stealth Addresses on Hedera Testnet**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13.5.1-black)](https://nextjs.org/)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-green)](https://hedera.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)](https://www.typescriptlang.org/)

## 🔐 Overview

Whisper is a **privacy-first messaging application** that enables truly anonymous communication using **EIP-5564 Stealth Addresses** and **EIP-6538 Stealth Meta-Address Registry** standards. Built on **Hedera Testnet**, it provides **end-to-end encrypted messaging** and **file sharing** without revealing sender or recipient identities.

### ✨ Key Features

- 🔒 **Anonymous Messaging**: Send messages without revealing your identity
- 📁 **Encrypted File Sharing**: Upload and share files securely via Hedera Consensus Service
- 🎭 **Stealth Addresses**: One-time addresses for each message (EIP-5564 compliant)
- 🔑 **WebAuthn Security**: Biometric authentication for key generation
- 📱 **Modern UI**: Clean, responsive interface built with Next.js 14
- ⛓️ **Hedera Integration**: Low-cost, fast transactions on Hedera Testnet
- 🔍 **Registry Lookup**: Find recipients by their public address
- 🛡️ **End-to-End Encryption**: AES-256-GCM encryption with ECDH shared secrets

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** 
- **npm** or **yarn**
- **Hedera Testnet** wallet (HashPack, Blade, etc.)
- **WebAuthn-compatible device** (fingerprint/face ID)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whisper.git
   cd whisper/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your environment variables:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Frontend Stack
- **Next.js 13.5.1** with App Router
- **TypeScript 5.2.2** for type safety
- **Tailwind CSS 3.3.3** for styling
- **Radix UI** for accessible components
- **React Query** for state management

### Blockchain & Cryptography
- **Hedera Testnet** - Primary blockchain network
- **@hashgraph/sdk** - Official Hedera SDK
- **@hashgraphonline/hashinal-wc** - Hedera WalletConnect
- **@noble/secp256k1** - Elliptic curve cryptography
- **WebAuthn** - Biometric authentication
- **AES-256-GCM** - End-to-end encryption

### Smart Contracts
- **ERC-5564Announcer** (`0x55649E01B5Df198D18D95b5cc5051630cfD45564`) - Announces stealth transactions
- **ERC-6538Registry** (`0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538`) - Maps addresses to stealth meta-addresses

## 📖 How It Works

### 1. **Recipient Setup**
- Generate stealth keys using **WebAuthn** (biometric authentication)
- Create a **stealth meta-address** (public, safe to share)
- Register meta-address to **ERC-6538Registry** contract
- Store private keys securely in browser

### 2. **Sender Flow**
- Enter recipient's **stealth meta-address** or lookup by public address
- Generate **ephemeral keypair** for this transaction
- Compute **shared secret** using ECDH
- Derive **stealth address** for the recipient
- Encrypt message/file with **AES-256-GCM**
- Announce encrypted content on-chain via **ERC-5564Announcer**

### 3. **Recipient Discovery**
- Scan blockchain for announcements using **view tags**
- Check view tags for efficient prefiltering
- Decrypt messages using private keys
- View decrypted content in inbox

## 🎯 Usage Guide

### For Recipients (Inbox)

1. **Setup Stealth Keys**
   - Go to `/keys` page
   - Click "Generate Keys" 
   - Use WebAuthn (biometric authentication)
   - Copy your stealth meta-address

2. **Register Meta-Address**
   - Click "Register to Registry"
   - Confirm transaction in wallet
   - Meta-address is now publicly discoverable

3. **Share Your Meta-Address**
   - Share the generated stealth meta-address with potential senders
   - Format: `st:eth:0x<spendingPubKey><viewingPubKey>`
   - This address is public and safe to share

4. **Check for Messages**
   - Go to `/inbox` page
   - Click "Scan Now" to check for new announcements
   - View decrypted messages and files

### For Senders (Send)

1. **Connect Wallet**
   - Click "Connect Wallet" on any page
   - Use Hedera WalletConnect to connect your wallet

2. **Enter Recipient**
   - **Option A**: Enter stealth meta-address directly
   - **Option B**: Click "Lookup by Address" and enter public address
   - System queries registry and retrieves meta-address

3. **Compose Message**
   - Choose "Message" or "File" tab
   - Enter your content
   - Click "Send Anonymously"

4. **Transaction Confirmation**
   - Confirm transaction in wallet
   - Message is encrypted and announced on-chain

## 🔧 API Reference

### Core Functions

#### `generateStealthKeys()`
Generates stealth keys using WebAuthn authentication.

```typescript
const keys = await generateStealthKeys();
// Returns: { spendingPrivateKey, viewingPrivateKey, spendingPublicKey, viewingPublicKey }
```

#### `sendMessage(sdk, messageData)`
Sends an encrypted message via ERC-5564Announcer contract.

```typescript
const result = await sendMessage(sdk, {
  recipient: "st:eth:0x...",
  content: "Hello World",
  stealthAddress: "0x...",
  ephemeralPubKey: "0x...",
  metadata: "0x..."
});
```

#### `scanMessages(sdk, userKeys)`
Scans blockchain for messages addressed to user's stealth address.

```typescript
const messages = await scanMessages(sdk, userKeys);
// Returns: Array of decrypted messages
```

#### `getMetaAddressFromRegistry(sdk, address)`
Queries ERC-6538Registry for a public address's stealth meta-address.

```typescript
const metaAddress = await getMetaAddressFromRegistry(sdk, "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
// Returns: "st:eth:0x..." or null
```

### File Operations

#### `sendFile(sdk, fileData)`
Uploads file to Hedera Consensus Service and sends metadata via stealth message.

```typescript
const result = await sendFile(sdk, {
  file: File,
  recipient: "st:eth:0x...",
  stealthAddress: "0x...",
  ephemeralPubKey: "0x..."
});
// Returns: { transactionId, topicId, fileName, mimeType, fileSize }
```

#### `downloadFileFromTopic(topicId, fileName, mimeType)`
Downloads and reconstructs file from Hedera Consensus Service topic.

```typescript
const blob = await downloadFileFromTopic("0.0.123456", "document.pdf", "application/pdf");
// Returns: Blob ready for download
```

## 🔒 Security Features

### Cryptographic Security
- **Perfect Forward Secrecy**: Each message uses unique ephemeral keys
- **ECDH Shared Secrets**: Elliptic Curve Diffie-Hellman for key agreement
- **AES-256-GCM Encryption**: Authenticated encryption with random IVs
- **View Tags**: Efficient message discovery without compromising privacy

### Privacy Protection
- **Stealth Addresses**: Unlinkable one-time addresses for each message
- **Anonymous Sending**: No sender identity revealed on-chain
- **Biometric Authentication**: WebAuthn for secure key generation
- **Local Key Storage**: Private keys never leave user's device

### Network Security
- **Hedera Consensus**: Byzantine fault-tolerant consensus mechanism
- **Low-Cost Transactions**: ~$0.0001 per transaction
- **Fast Finality**: 3-5 second transaction confirmation
- **EVM Compatibility**: Standard Ethereum security model

## 🌐 Network Information

### Hedera Testnet
- **RPC URL**: `https://testnet.hashio.io/api`
- **Chain ID**: `296`
- **Native Token**: HBAR
- **Block Explorer**: [HashScan Testnet](https://hashscan.io/testnet)

### Contract Addresses
- **ERC-5564Announcer**: `0x55649E01B5Df198D18D95b5cc5051630cfD45564`
- **ERC-6538Registry**: `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538`

## 🛠️ Development

### Project Structure
```
client/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── inbox/            # Message inbox
│   ├── send/             # Send messages/files
│   └── keys/             # Key management
├── components/           # Reusable UI components
├── utils/               # Utility functions
│   ├── hedera.ts        # Hedera SDK integration
│   ├── encryption.ts    # Cryptographic functions
│   └── stealth-sdk-official.ts # Stealth address operations
├── providers/           # React context providers
└── types/              # TypeScript type definitions
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler
```

### Environment Variables
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ScopeLift** for the ERC-5564 and ERC-6538 contract implementations
- **Hedera Hashgraph** for the low-cost, high-performance blockchain
- **WalletConnect** for seamless wallet integration
- **WebAuthn** for secure biometric authentication

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/whisper/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/whisper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/whisper/discussions)
- **Discord**: [Join our Discord](https://discord.gg/your-discord)

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic stealth messaging
- ✅ File sharing via HCS
- ✅ Registry integration
- ✅ WebAuthn authentication

### Phase 2 (Q2 2024)
- 🔄 Multi-network support (Ethereum, Polygon)
- 🔄 Group messaging
- 🔄 Message threading
- 🔄 Mobile app (React Native)

### Phase 3 (Q3 2024)
- 📋 Advanced encryption (post-quantum)
- 📋 IPFS integration
- 📋 Cross-chain messaging
- 📋 Zero-knowledge proofs

---

**Built with ❤️ using Next.js, Hedera Hashgraph, and cutting-edge cryptography.**

*Send messages anonymously. Stay private. Stay secure.*