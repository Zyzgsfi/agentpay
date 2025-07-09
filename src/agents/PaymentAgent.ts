import { createWalletClient, http, createPublicClient, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { config } from '../config';

export interface PaymentOptions {
  amount: string;
  to: string;
  token?: string;
  gas?: bigint;
}

export interface ServiceRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  data?: any;
  maxPayment?: string;
}

export class PaymentAgent {
  private walletClient;
  private publicClient;
  private account;
  private agentId: string;

  constructor(privateKey: string, agentId?: string) {
    this.account = privateKeyToAccount(privateKey as `0x${string}`);
    this.agentId = agentId || `agent-${Date.now()}`;
    
    this.walletClient = createWalletClient({
      account: this.account,
      chain: baseSepolia,
      transport: http(config.blockchain.rpcUrl),
    });

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(config.blockchain.rpcUrl),
    });
  }

  async makePayment(options: PaymentOptions): Promise<string> {
    const { amount, to, token = config.blockchain.usdcContractAddress } = options;
    
    try {
      // In a real implementation, this would use ERC-20 transfer
      // For demo purposes, we'll simulate a payment transaction
      const value = parseUnits(amount, 6); // USDC has 6 decimals
      
      // This is a simplified example - in production you'd use proper ERC-20 transfer
      const hash = await this.walletClient.sendTransaction({
        to: to as `0x${string}`,
        value: parseUnits('0.001', 18), // Small ETH amount for gas
        data: '0x', // In real implementation, this would be ERC-20 transfer calldata
      });

      return hash;
    } catch (error) {
      console.error('Payment failed:', error);
      throw new Error('Payment transaction failed');
    }
  }

  async makeServiceRequest(request: ServiceRequest): Promise<any> {
    const { url, method, headers = {}, data, maxPayment = '1.0' } = request;

    try {
      // First, make the request to check if payment is required
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      // If payment is required (402 status)
      if (response.status === 402) {
        const paymentInfo: any = await response.json();
        console.log('Payment required:', paymentInfo);

        // Check if payment amount is within our limit
        const requirement = paymentInfo.paymentRequirements[0];
        const requiredAmount = formatUnits(BigInt(requirement.amount), 6);
        
        if (parseFloat(requiredAmount) > parseFloat(maxPayment)) {
          throw new Error(`Payment amount ${requiredAmount} exceeds maximum ${maxPayment}`);
        }

        // Make payment
        const txHash = await this.makePayment({
          amount: requiredAmount,
          to: requirement.to,
          token: requirement.token,
        });

        console.log('Payment completed:', txHash);

        // Wait for transaction confirmation
        await this.waitForTransaction(txHash);

        // Retry request with payment proof
        const paymentHeader = JSON.stringify({
          txHash,
          amount: requirement.amount,
          to: requirement.to,
          token: requirement.token,
          from: this.account.address,
        });

        const paidResponse = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-payment': paymentHeader,
            ...headers,
          },
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!paidResponse.ok) {
          throw new Error(`Service request failed: ${paidResponse.status}`);
        }

        return await paidResponse.json();
      }

      // No payment required, return response directly
      if (!response.ok) {
        throw new Error(`Service request failed: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Service request failed:', error);
      throw error;
    }
  }

  private async waitForTransaction(hash: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const receipt = await this.publicClient.getTransactionReceipt({
          hash: hash as `0x${string}`,
        });

        if (receipt && receipt.status === 'success') {
          return;
        }

        if (receipt && receipt.status === 'reverted') {
          throw new Error('Transaction reverted');
        }
      } catch (error) {
        // Transaction might not be mined yet
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Transaction confirmation timeout');
  }

  async getBalance(): Promise<string> {
    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });

    return formatUnits(balance, 18);
  }

  getAddress(): string {
    return this.account.address;
  }

  getId(): string {
    return this.agentId;
  }

  async registerWithDirectory(serverUrl: string, services: string[]): Promise<void> {
    try {
      const response = await fetch(`${serverUrl}/api/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `PaymentAgent_${this.agentId}`,
          services,
          address: this.account.address,
        }),
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Agent registered:', result);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }
}