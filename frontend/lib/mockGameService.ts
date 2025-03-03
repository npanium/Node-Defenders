import { GameData } from "./types/core";

// Enhanced mock data with more addresses
export const mockGameData: GameData[] = [
  { address: "0x67f1452b3099CfB27E708130421c98aD2319C0b7", score: 189 },
  { address: "0x8901DeFf3aEA8F06a842951a46D47adAc4176A05", score: 156 },
  { address: "0x2345677689CfB27E7081304929834aD2319C567c", score: 143 },
  { address: "0xAB45612389CfB27E708130421c98aD2319C789d", score: 121 },
  { address: "0xCD9087612389CfB27E7081304298aD2319C5678", score: 115 },
  { address: "0xEF2398572345CfB27E708130421c98aD2319C901", score: 102 },
  { address: "0x45AB788901CfB27E708130421c98aD2319C0213", score: 98 },
  { address: "0xBC3456DeCfB27E708130421c98aD2319C4578", score: 89 },
  { address: "0x1234567890CfB27E708130421c98aD2319C6789", score: 76 },
  { address: "0xA987654321CfB27E708130421c98aD2319C3456", score: 62 },
];

// Sample of selected addresses for the betting round
export const mockSelectedAddresses = [
  "0x67f1452b3099CfB27E708130421c98aD2319C0b7",
  "0x8901DeFf3aEA8F06a842951a46D47adAc4176A05",
  "0x2345677689CfB27E7081304929834aD2319C567c",
  "0xAB45612389CfB27E708130421c98aD2319C789d",
  "0xCD9087612389CfB27E7081304298aD2319C5678",
];

// Sample of bets that have been placed
export const mockBets: Record<string, "top" | "bottom"> = {
  "0x67f1452b3099CfB27E708130421c98aD2319C0b7": "top",
  "0x8901DeFf3aEA8F06a842951a46D47adAc4176A05": "bottom",
};

/**
 * Mock service for game actions
 */
export const mockGameService = {
  /**
   * Get all addresses
   */
  getAddresses: async (): Promise<GameData[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return [...mockGameData];
  },

  /**
   * Get hash and store on chain
   */
  getAndStoreHash: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      timestamp: Math.floor(Date.now() / 1000),
      record_count: mockGameData.length,
      transaction_hash:
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    };
  },

  /**
   * Start betting window
   */
  startBettingWindow: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return {
      count: 5,
      addresses: [...mockSelectedAddresses],
      eth_addresses: [...mockSelectedAddresses],
      transaction_hash:
        "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef",
    };
  },

  /**
   * Get window status
   */
  getWindowStatus: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { active: true };
  },

  /**
   * Place bet
   */
  placeBet: async (
    selectedAddress: string,
    position: boolean,
    amount: string
  ) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      transaction_hash:
        "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
    };
  },

  /**
   * Close betting window
   */
  closeBettingWindow: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      transaction_hash:
        "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
    };
  },

  /**
   * Verify and process payouts
   */
  verifyAndProcessPayouts: async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      status: "success",
      journal: "0x123456",
      zkVerifyAttestation: {
        attestationId: 42979,
        proofDetails: {
          root: "0x0b8861fd1226c0d08468e4053ae521253e8ac43a96cadbda47ab237f9d62870c",
          proof: [
            "0x9748d439df3f8a81c26cc6d1e6a20e29010e22771b7d1bd7cd9d0c567bbdf805",
            "0xaf46de19988962222e0831bd1b9ee91c18817fbf463130233890af69ad1b899d",
          ],
          numberOfLeaves: 4,
          leafIndex: 1,
          leaf: "0x6b34dab3f2bd512935146cc33f65d6f7f4015d4b1358b6940bf1765f60886f44",
        },
      },
      transaction_hash:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    };
  },

  /**
   * Get betting amounts for an address
   */
  getBettingAmounts: async (index: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      up_amount: (Math.random() * 5 + 1).toFixed(2) + "000000000000000000",
      down_amount: (Math.random() * 5 + 1).toFixed(2) + "000000000000000000",
    };
  },

  /**
   * Get total bet count
   */
  getBetCount: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { count: (Math.floor(Math.random() * 50) + 10).toString() };
  },
};
