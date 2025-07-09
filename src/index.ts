import express from 'express';
import cors from 'cors';
import { config } from './config';
import { x402 } from './middleware/x402';
import { serviceRoutes } from './routes/services';
import { agentRoutes } from './routes/agents';
import { x402Routes } from './routes/x402';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    network: config.blockchain.network,
    chainId: config.blockchain.chainId,
  });
});

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/x402', x402Routes);

// Example paid endpoint
app.get('/api/premium-data', 
  x402.createPaymentRequired('0.01'), // Require 0.01 USDC
  x402.verifyPayment,
  (req, res) => {
    res.json({
      message: 'Premium data accessed successfully',
      data: {
        timestamp: new Date().toISOString(),
        premium: true,
        content: 'This is premium content that requires payment',
      },
    });
  }
);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`🚀 Agent Payment Server running on port ${PORT}`);
  console.log(`📡 Network: ${config.blockchain.network} (Chain ID: ${config.blockchain.chainId})`);
  console.log(`💳 Server Address: ${config.server.address}`);
  console.log(`🔗 RPC URL: ${config.blockchain.rpcUrl}`);
});