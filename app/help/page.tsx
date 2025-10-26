'use client';

import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { HelpCircle, Search, Book, MessageCircle, Shield, Key, Send, Inbox, Settings, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

export default function HelpPage() {
  const { authenticated, login } = usePrivy();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const faqSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="h-5 w-5" />,
      questions: [
        {
          q: 'What is Whisper?',
          a: 'Whisper is a privacy-first messaging application that uses stealth addresses and end-to-end encryption to enable anonymous communication. It allows you to send and receive messages without revealing your identity or the recipient\'s identity.'
        },
        {
          q: 'How do I get started?',
          a: 'First, connect your wallet, then generate your stealth keys. Once your keys are generated, you can share your meta-address to receive messages or send messages to others using their meta-addresses.'
        },
        {
          q: 'What is a stealth meta-address?',
          a: 'A stealth meta-address is a public identifier that allows others to send you anonymous messages. It contains your public keys but doesn\'t reveal your identity or wallet address.'
        }
      ]
    },
    {
      id: 'sending-messages',
      title: 'Sending Messages',
      icon: <Send className="h-5 w-5" />,
      questions: [
        {
          q: 'How do I send a message?',
          a: 'Go to the Send page, enter the recipient\'s meta-address (or ETH address/ENS name), compose your message, and click "Send Message". The message will be encrypted and announced on-chain.'
        },
        {
          q: 'Can I send files?',
          a: 'File sending is coming soon! You\'ll be able to upload files that will be encrypted and stored on IPFS, with the decryption key shared through the stealth address system.'
        },
        {
          q: 'Can I send token tips?',
          a: 'Token tipping is coming soon! You\'ll be able to send anonymous token transfers to recipients using their stealth addresses.'
        }
      ]
    },
    {
      id: 'receiving-messages',
      title: 'Receiving Messages',
      icon: <Inbox className="h-5 w-5" />,
      questions: [
        {
          q: 'How do I receive messages?',
          a: 'Share your meta-address with others. When they send you a message, it will be announced on-chain. Use the "Scan Now" button in your Inbox to check for new messages.'
        },
        {
          q: 'How do I know if I have new messages?',
          a: 'The app will show a notification when new messages are detected. You can also manually scan for messages using the "Scan Now" button in your Inbox.'
        },
        {
          q: 'Are my messages encrypted?',
          a: 'Yes! All messages are encrypted using AES-256-GCM encryption with keys derived from ECDH shared secrets. Only you and the sender can decrypt the messages.'
        }
      ]
    },
    {
      id: 'keys-security',
      title: 'Keys & Security',
      icon: <Key className="h-5 w-5" />,
      questions: [
        {
          q: 'What are stealth keys?',
          a: 'Stealth keys consist of a spending key pair and a viewing key pair. The spending keys are used to claim received content, while the viewing keys are used to decrypt messages.'
        },
        {
          q: 'How do I backup my keys?',
          a: 'Use the "Export Keys" button in the Keys page to download a JSON file containing your keys. Store this file securely - losing your keys means losing access to received messages.'
        },
        {
          q: 'What happens if I lose my keys?',
          a: 'If you lose your private keys, you will permanently lose access to any messages sent to your stealth addresses. Always backup your keys securely.'
        },
        {
          q: 'Should I register my meta-address?',
          a: 'Registering your meta-address on the ERC-6538 registry makes it easier for others to find you using your ETH address or ENS name. This is optional but recommended.'
        }
      ]
    },
    {
      id: 'privacy-anonymity',
      title: 'Privacy & Anonymity',
      icon: <Shield className="h-5 w-5" />,
      questions: [
        {
          q: 'How anonymous is Whisper?',
          a: 'Whisper provides strong anonymity through stealth addresses and encryption. Your identity is not revealed when sending or receiving messages, and the content is encrypted end-to-end.'
        },
        {
          q: 'Can messages be traced?',
          a: 'While the stealth addresses themselves are not directly traceable to your identity, blockchain analysis could potentially link transactions. For maximum privacy, consider using a VPN or Tor.'
        },
        {
          q: 'What data is stored on-chain?',
          a: 'Only the stealth address, ephemeral public key, and encrypted metadata are stored on-chain. The actual message content is encrypted and cannot be read by anyone without the proper keys.'
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <HelpCircle className="h-5 w-5" />,
      questions: [
        {
          q: 'Why can\'t I connect my wallet?',
          a: 'Make sure you have a compatible wallet (MetaMask, WalletConnect, etc.) installed and unlocked. Try refreshing the page and reconnecting.'
        },
        {
          q: 'Why aren\'t my messages appearing?',
          a: 'Make sure you\'re on the correct network (Base Sepolia), your keys are generated, and try scanning for messages manually. Check that the sender used the correct meta-address.'
        },
        {
          q: 'Why is my transaction failing?',
          a: 'Check that you have enough ETH for gas fees, you\'re on the correct network, and your wallet is unlocked. Try increasing the gas limit if the transaction is failing.'
        },
        {
          q: 'How do I switch networks?',
          a: 'Use the network indicator in the top bar to switch to Base Sepolia. You can also configure this in your wallet settings.'
        }
      ]
    }
  ];

  const filteredSections = faqSections.map(section => ({
    ...section,
    questions: section.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.questions.length > 0);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-lg text-gray-600">
          Find answers to common questions and learn how to use Whisper
        </p>
      </div>

      {!authenticated ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to access help and support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search Help</CardTitle>
              <CardDescription>
                Search through our help articles and FAQ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>
                Common tasks and important information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <Key className="h-5 w-5 mb-2" />
                  <span className="font-medium">Generate Keys</span>
                  <span className="text-sm text-gray-600">Create your stealth keys</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <Send className="h-5 w-5 mb-2" />
                  <span className="font-medium">Send Message</span>
                  <span className="text-sm text-gray-600">Send anonymous messages</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <Inbox className="h-5 w-5 mb-2" />
                  <span className="font-medium">Check Inbox</span>
                  <span className="text-sm text-gray-600">Scan for new messages</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <Settings className="h-5 w-5 mb-2" />
                  <span className="font-medium">Settings</span>
                  <span className="text-sm text-gray-600">Configure your preferences</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <Shield className="h-5 w-5 mb-2" />
                  <span className="font-medium">Privacy Guide</span>
                  <span className="text-sm text-gray-600">Learn about privacy features</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                  <MessageCircle className="h-5 w-5 mb-2" />
                  <span className="font-medium">Contact Support</span>
                  <span className="text-sm text-gray-600">Get help from our team</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Sections */}
          {filteredSections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <div className="text-left">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>
                        {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </Button>
              </CardHeader>
              
              {expandedSections.has(section.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {section.questions.map((qa, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-4">
                        <h4 className="font-medium text-gray-900 mb-2">{qa.q}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{qa.a}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Still Need Help?
              </CardTitle>
              <CardDescription>
                Can't find what you're looking for? Contact our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Documentation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Read our comprehensive documentation for technical details and API references.
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Docs
                  </Button>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Community Support</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Join our community Discord for help from other users and developers.
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Discord
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Report a Bug</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Found a bug? Help us improve Whisper by reporting it.
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
