import { Request, Response, NextFunction } from 'express';
import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { config } from '../config';

interface PaymentRequirement {
  scheme: string;
  amount: string;
  to: string;
  token?: string;
  chainId?: number;
}

interface X402Response {
  paymentRequirements: PaymentRequirement[];
  message: string;
}

export interface X402Request extends Request {
  payment?: {
    amount: string;
    from: string;
    to: string;
    token?: string;
    txHash?: string;
  };
}

export class X402Middleware {
  private publicClient;

  constructor() {
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(config.blockchain.rpcUrl),
    });
  }

  createPaymentRequired(amount: string, to: string = config.server.address) {
    return (req: Request, res: Response, next: NextFunction) => {
      const paymentHeader = req.headers['x-payment'];
      
      if (!paymentHeader) {
        const response: X402Response = {
          paymentRequirements: [{
            scheme: 'erc20',
            amount: parseUnits(amount, 6).toString(), // USDC has 6 decimals
            to,
            token: config.blockchain.usdcContractAddress,
            chainId: config.blockchain.chainId,
          }],
          message: `Payment of ${amount} USDC required to access this resource`,
        };

        return res.status(402).json(response);
      }

      // Parse payment header
      try {
        const paymentData = JSON.parse(paymentHeader as string);
        (req as X402Request).payment = paymentData;
        next();
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid payment header format' 
        });
      }
    };
  }

  async verifyPayment(req: X402Request, res: Response, next: NextFunction) {
    if (!req.payment) {
      return res.status(400).json({ error: 'Payment data missing' });
    }

    try {
      const { txHash, amount, to } = req.payment;
      
      if (!txHash) {
        return res.status(400).json({ error: 'Transaction hash required' });
      }

      // Verify transaction on blockchain
      const receipt = await this.publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (!receipt || receipt.status !== 'success') {
        return res.status(400).json({ error: 'Transaction not found or failed' });
      }

      // Additional verification logic would go here
      // For now, we'll assume the payment is valid if the transaction exists

      res.setHeader('x-payment-response', JSON.stringify({
        status: 'verified',
        txHash,
        amount: formatUnits(BigInt(amount), 6),
        timestamp: new Date().toISOString(),
      }));

      next();
    } catch (error) {
      console.error('Payment verification error:', error);
      return res.status(500).json({ error: 'Payment verification failed' });
    }
  }
}

export const x402 = new X402Middleware();