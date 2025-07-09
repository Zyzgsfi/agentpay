import express from 'express';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { config } from '../config';

const router = express.Router();

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(config.blockchain.rpcUrl),
});

// Verify payment endpoint (facilitator interface)
router.post('/verify', async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;

    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({ 
        error: 'Missing paymentPayload or paymentRequirements' 
      });
    }

    // Parse payment payload
    const { txHash, amount, to, token } = paymentPayload;

    // Verify transaction exists and is successful
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (!receipt || receipt.status !== 'success') {
      return res.status(400).json({ 
        error: 'Transaction not found or failed',
        valid: false 
      });
    }

    // Basic validation - in production, you'd want more thorough checks
    const isValid = receipt.status === 'success';

    res.json({
      valid: isValid,
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      error: 'Payment verification failed',
      valid: false 
    });
  }
});

// Settlement endpoint (facilitator interface)
router.post('/settle', async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;

    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({ 
        error: 'Missing paymentPayload or paymentRequirements' 
      });
    }

    // In a real implementation, this would handle the settlement process
    // For now, we'll just return success if the payment was verified
    const { txHash } = paymentPayload;

    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (!receipt || receipt.status !== 'success') {
      return res.status(400).json({ 
        error: 'Cannot settle failed transaction',
        settled: false 
      });
    }

    res.json({
      settled: true,
      transactionHash: txHash,
      settlementTime: new Date().toISOString(),
      status: 'completed',
    });

  } catch (error) {
    console.error('Payment settlement error:', error);
    res.status(500).json({ 
      error: 'Payment settlement failed',
      settled: false 
    });
  }
});

// Get payment status
router.get('/payment/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    if (!receipt) {
      return res.status(404).json({ 
        error: 'Transaction not found' 
      });
    }

    res.json({
      transactionHash: txHash,
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ 
      error: 'Failed to get payment status' 
    });
  }
});

export { router as x402Routes };