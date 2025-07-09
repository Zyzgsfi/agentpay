import { PaymentAgent } from '../agents/PaymentAgent';
import { config } from '../config';

async function createClientAgent() {
  const agent = new PaymentAgent(
    config.agent.privateKey,
    'client-agent'
  );

  console.log(`🤖 Client Agent initialized`);
  console.log(`💳 Address: ${agent.getAddress()}`);
  console.log(`🆔 ID: ${agent.getId()}`);

  // Demonstrate various service purchases
  const demonstrations = [
    {
      name: 'Text Processing',
      url: 'http://localhost:3001/process-text',
      data: { text: 'Hello world! This is a test message.', operation: 'analyze' },
    },
    {
      name: 'Data Validation',
      url: 'http://localhost:3001/validate-data',
      data: { data: { name: 'John', age: 30 }, schema: { type: 'object', required: true } },
    },
    {
      name: 'Number Crunching',
      url: 'http://localhost:3001/crunch-numbers',
      data: { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], operation: 'stats' },
    },
    {
      name: 'AI Text Generation',
      url: 'http://localhost:3002/generate-text',
      data: { prompt: 'Write a short story about robots', maxTokens: 150 },
    },
    {
      name: 'Sentiment Analysis',
      url: 'http://localhost:3002/analyze-sentiment',
      data: { text: 'I love this new payment system! It works great.' },
    },
    {
      name: 'Translation',
      url: 'http://localhost:3002/translate',
      data: { text: 'hello', fromLang: 'en', toLang: 'es' },
    },
    {
      name: 'Premium Data (Main Server)',
      url: 'http://localhost:3000/api/premium-data',
      data: null,
    },
  ];

  // Function to demonstrate service usage
  async function demonstrateServices() {
    console.log('\\n🚀 Starting service demonstration...');
    
    for (const demo of demonstrations) {
      try {
        console.log(`\\n📋 Testing: ${demo.name}`);
        console.log(`🔗 URL: ${demo.url}`);
        
        const result = await agent.makeServiceRequest({
          url: demo.url,
          method: demo.data ? 'POST' : 'GET',
          data: demo.data,
          maxPayment: '0.5', // Maximum willing to pay
        });
        
        console.log(`✅ Success:`, JSON.stringify(result, null, 2));
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`❌ Failed to use ${demo.name}:`, error.message);
      }
    }
  }

  // Function to check balance
  async function checkBalance() {
    try {
      const balance = await agent.getBalance();
      console.log(`💰 Current balance: ${balance} ETH`);
    } catch (error: any) {
      console.error('❌ Failed to check balance:', error.message);
    }
  }

  // Function to discover available services
  async function discoverServices() {
    console.log('\\n🔍 Discovering available services...');
    
    const serviceEndpoints = [
      'http://localhost:3001/services',
      'http://localhost:3002/services',
    ];
    
    for (const endpoint of serviceEndpoints) {
      try {
        const response = await fetch(endpoint);
        const services: any = await response.json();
        
        console.log(`\\n🤖 Agent: ${services.agentId}`);
        console.log(`📦 Services available:`);
        
        services.services.forEach((service: any) => {
          console.log(`  - ${service.name}: ${service.price} USDC`);
          console.log(`    ${service.description}`);
        });
        
      } catch (error: any) {
        console.error(`❌ Failed to discover services at ${endpoint}:`, error.message);
      }
    }
  }

  // Function to register with directory
  async function registerWithDirectory() {
    try {
      await agent.registerWithDirectory('http://localhost:3000', ['client']);
      console.log('✅ Registered with directory');
    } catch (error: any) {
      console.error('❌ Failed to register with directory:', error.message);
    }
  }

  return {
    agent,
    demonstrateServices,
    checkBalance,
    discoverServices,
    registerWithDirectory,
  };
}

// Interactive CLI interface
async function runInteractiveDemo() {
  const { agent, demonstrateServices, checkBalance, discoverServices, registerWithDirectory } = await createClientAgent();
  
  console.log('\\n🎯 Client Agent Demo Started');
  console.log('Available commands:');
  console.log('  1. balance - Check current balance');
  console.log('  2. discover - Discover available services');
  console.log('  3. demo - Run service demonstration');
  console.log('  4. register - Register with directory');
  console.log('  5. exit - Exit the demo');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  function askCommand() {
    rl.question('\\nEnter command: ', async (command: any) => {
      switch (command.trim().toLowerCase()) {
        case '1':
        case 'balance':
          await checkBalance();
          break;
        case '2':
        case 'discover':
          await discoverServices();
          break;
        case '3':
        case 'demo':
          await demonstrateServices();
          break;
        case '4':
        case 'register':
          await registerWithDirectory();
          break;
        case '5':
        case 'exit':
          console.log('👋 Goodbye!');
          rl.close();
          return;
        default:
          console.log('❌ Unknown command. Try: balance, discover, demo, register, or exit');
      }
      askCommand();
    });
  }
  
  askCommand();
}

// Run the interactive demo if this file is executed directly
if (require.main === module) {
  runInteractiveDemo().catch(console.error);
}

export { createClientAgent };