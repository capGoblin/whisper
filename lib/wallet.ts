import { createConfig } from "@privy-io/wagmi";
import { baseSepolia } from "wagmi/chains";
import { http } from "viem";
import { createPublicClient } from "viem";

const ALCHEMY_RPC_KEY = process.env.NEXT_PUBLIC_ALCHEMY_RPC_KEY;
if (!ALCHEMY_RPC_KEY) {
  console.warn("NEXT_PUBLIC_ALCHEMY_RPC_KEY is not defined. Using default Base Sepolia RPC.");
}

export const CHAIN_ID = baseSepolia.id;

export const getAlchemyRpcUrl = (chainId: number) => {
  if (chainId === baseSepolia.id) {
    // Use ThirdWeb RPC that supports eth_getLogs
    return "https://84532.rpc.thirdweb.com/0146d9ba634727cd97f136a39c52afe1";
  }
  throw new Error(`No RPC URL found for chain ID: ${chainId}`);
}

export const configFront = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(getAlchemyRpcUrl(baseSepolia.id), {
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

export const getViemClient = () => {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(getAlchemyRpcUrl(baseSepolia.id), {
      retryCount: 3,
      retryDelay: 1000,
    }),
    batch: {
      multicall: !!baseSepolia.contracts?.multicall3?.address,
    },
  });

  return client;
};

export const fetchEventsViem = async ({
  client,
  address,
  event,
  args,
}: {
  client: any;
  address: string;
  event: string;
  args?: any[];
}) => {
  try {
    return await client.getLogs({
      address,
      event,
      args: args,
    });
  } catch (error) {
    console.error("Onchain event fetch failed", error);
    throw error;
  }
};
