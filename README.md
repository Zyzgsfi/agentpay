# AgentPay - Agent-to-Agent Payment System

A complete agent-to-agent payment system built using Coinbase's x402 protocol. This system enables AI agents to autonomously discover, negotiate, and pay for services from other agents using stablecoins on the Base Sepolia testnet.

## Features

- **HTTP-Native Payments**: Uses x402 protocol with 402 Payment Required status codes
- **Autonomous Agent Payments**: Agents can automatically pay for services without human intervention
- **Service Discovery**: Agents can discover and register available services
- **Payment Verification**: Blockchain-based payment verification and settlement
- **Multi-Agent Architecture**: Support for multiple specialized agent types
- **Base Sepolia Integration**: Built for Base Sepolia testnet with USDC payments

## Architecture

### Core Components

1. **Payment Server** (`src/index.ts`): Central server handling agent registration and coordination
2. **x402 Middleware** (`src/middleware/x402.ts`): Handles payment requirements and verification
3. **Payment Agent** (`src/agents/PaymentAgent.ts`): Base class for agents that can make payments
4. **Service Agent** (`src/agents/ServiceAgent.ts`): Agents that provide paid services
5. **Client Agent** (`src/examples/clientAgent.ts`): Demo agent that consumes services

### Payment Flow

1. Agent requests a service from another agent
2. Service agent responds with 402 Payment Required + payment details
3. Client agent automatically creates and sends payment transaction
4. Service agent verifies payment on blockchain
5. Service agent delivers the requested service

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Base Sepolia testnet access
- Test ETH and USDC on Base Sepolia

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd agentpay

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your configuration
```

### Configuration

Edit `.env` file with your settings:

```env
# Base Sepolia Testnet Configuration
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
NETWORK=base-sepolia

# Server Configuration
PORT=3000
SERVER_ADDRESS=0xYourServerAddress

# Agent Configuration
AGENT_PRIVATE_KEY=0xYourPrivateKey
AGENT_ADDRESS=0xYourAgentAddress

# USDC Contract on Base Sepolia
USDC_CONTRACT_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Usage

### Start the Payment Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with the following endpoints:

- `GET /health` - Health check
- `GET /api/premium-data` - Example paid endpoint (0.01 USDC)
- `POST /api/agents/register` - Agent registration
- `GET /api/agents` - List registered agents
- `POST /api/x402/verify` - Payment verification
- `POST /api/x402/settle` - Payment settlement

### Start Service Agents

#### Data Processing Agent (Port 3001)
```bash
npm run build
node dist/examples/dataProcessingAgent.js
```

Services provided:
- Text processing (0.05 USDC)
- Data validation (0.03 USDC)
- Number crunching (0.08 USDC)

#### AI Service Agent (Port 3002)
```bash
npm run build
node dist/examples/aiServiceAgent.js
```

Services provided:
- Text generation (0.15 USDC)
- Image analysis (0.20 USDC)
- Translation (0.10 USDC)
- Sentiment analysis (0.07 USDC)

### Run Client Agent Demo

```bash
npm run build
node dist/examples/clientAgent.js
```

The client agent provides an interactive CLI to:
- Check balance
- Discover available services
- Run service demonstrations
- Register with directory

## API Reference

### x402 Payment Protocol

#### Payment Required Response (402)
```json
{
  "paymentRequirements": [{
    "scheme": "erc20",
    "amount": "50000",
    "to": "0x1234567890123456789012345678901234567890",
    "token": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    "chainId": 84532
  }],
  "message": "Payment of 0.05 USDC required to access this resource"
}
```

#### Payment Header (X-PAYMENT)
```json
{
  "txHash": "0xabcdef...",
  "amount": "50000",
  "to": "0x1234567890123456789012345678901234567890",
  "token": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  "from": "0x9876543210987654321098765432109876543210"
}
```

### Agent Registration

```bash
POST /api/agents/register
Content-Type: application/json

{
  "name": "MyAgent",
  "services": ["text-processing", "data-validation"],
  "address": "0x1234567890123456789012345678901234567890"
}
```

### Service Discovery

```bash
GET /api/agents
GET /api/agents?service=text-processing
```

## Example Usage

### Creating a Custom Service Agent

```typescript
import { ServiceAgent } from './agents/ServiceAgent';

const agent = new ServiceAgent(privateKey, 3003, 'my-custom-agent');

agent.addService({
  name: 'custom-service',
  endpoint: '/my-service',
  price: '0.10',
  description: 'My custom service',
  method: 'POST',
  handler: async (req, res) => {
    // Service logic here
    res.json({ result: 'Service completed' });
  },
});

await agent.start();
```

### Making Payments from an Agent

```typescript
import { PaymentAgent } from './agents/PaymentAgent';

const agent = new PaymentAgent(privateKey, 'my-client');

const result = await agent.makeServiceRequest({
  url: 'http://localhost:3001/process-text',
  method: 'POST',
  data: { text: 'Hello world', operation: 'analyze' },
  maxPayment: '0.10',
});
```

## Development

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Project Structure

```
src/
├── agents/
│   ├── PaymentAgent.ts      # Base payment agent class
│   └── ServiceAgent.ts      # Service provider agent class
├── examples/
│   ├── dataProcessingAgent.ts  # Data processing services
│   ├── aiServiceAgent.ts       # AI services
│   └── clientAgent.ts          # Client demo agent
├── middleware/
│   └── x402.ts              # x402 payment middleware
├── routes/
│   ├── agents.ts            # Agent registration routes
│   ├── services.ts          # Service routes
│   └── x402.ts              # Payment verification routes
├── config.ts                # Configuration
└── index.ts                 # Main server
```

## Security Considerations

- This is a testnet implementation for demonstration purposes
- Private keys are stored in environment variables (use proper key management in production)
- Payment verification is simplified (implement thorough validation for production)
- No rate limiting or abuse prevention implemented

## Troubleshooting

### Common Issues

1. **Transaction not found**: Ensure sufficient ETH for gas fees
2. **Payment verification failed**: Check USDC contract address and network
3. **Agent registration failed**: Verify server is running and accessible
4. **Service discovery failed**: Check agent ports and network connectivity

### Debug Mode

Set `NODE_ENV=development` for verbose logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Resources

- [Coinbase x402 Protocol](https://x402.org)
- [Base Sepolia Testnet](https://sepolia.base.org)
- [Viem Documentation](https://viem.sh)
- [Express.js Documentation](https://expressjs.com)