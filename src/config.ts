import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    address: process.env.SERVER_ADDRESS || '0x1234567890123456789012345678901234567890',
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
    chainId: parseInt(process.env.CHAIN_ID || '84532'),
    network: process.env.NETWORK || 'base-sepolia',
    usdcContractAddress: process.env.USDC_CONTRACT_ADDRESS || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  agent: {
    privateKey: process.env.AGENT_PRIVATE_KEY || '0x1234567890123456789012345678901234567890123456789012345678901234',
    address: process.env.AGENT_ADDRESS || '0x1234567890123456789012345678901234567890',
  },
  x402: {
    facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://facilitator.x402.org',
  },
};