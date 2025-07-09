const { createPublicClient, http, formatEther, formatUnits } = require('viem');
const { baseSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();

const USDC_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];

async function verifySetup() {
  console.log('🔍 Verifying Base Sepolia setup...\n');
  
  // Check environment variables
  const requiredEnvVars = ['AGENT_PRIVATE_KEY', 'AGENT_ADDRESS', 'RPC_URL'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(v => console.log(`   - ${v}`));
    process.exit(1);
  }
  
  try {
    // Create clients
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.RPC_URL),
    });
    
    const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
    
    console.log('📍 Network Information:');
    console.log(`   Chain: ${baseSepolia.name} (${baseSepolia.id})`);
    console.log(`   RPC: ${process.env.RPC_URL}`);
    console.log(`   Account: ${account.address}\n`);
    
    // Check ETH balance
    console.log('💰 Checking balances...');
    const ethBalance = await publicClient.getBalance({
      address: account.address,
    });
    console.log(`   ETH Balance: ${formatEther(ethBalance)} ETH`);
    
    if (ethBalance === 0n) {
      console.log('   ⚠️  No ETH! Get testnet ETH from faucet');
    } else if (ethBalance < 10000000000000000n) { // 0.01 ETH
      console.log('   ⚠️  Low ETH balance. Consider getting more for gas fees');
    } else {
      console.log('   ✅ ETH balance sufficient');
    }
    
    // Check USDC balance
    try {
      const usdcBalance = await publicClient.readContract({
        address: process.env.USDC_CONTRACT_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [account.address],
      });
      
      console.log(`   USDC Balance: ${formatUnits(usdcBalance, 6)} USDC`);
      
      if (usdcBalance === 0n) {
        console.log('   ⚠️  No USDC! Swap some ETH for USDC on Uniswap');
      } else {
        console.log('   ✅ USDC balance available');
      }
    } catch (error) {
      console.log('   ❌ Could not check USDC balance:', error.message);
    }
    
    // Check network connectivity
    console.log('\n🌐 Network connectivity:');
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`   Latest block: ${blockNumber}`);
    console.log('   ✅ Successfully connected to Base Sepolia');
    
    console.log('\n🎯 Setup verification complete!');
    console.log('\nNext steps:');
    console.log('1. If you need testnet ETH: https://coinbase.com/faucets/base-ethereum-sepolia-faucet');
    console.log('2. If you need USDC: Swap ETH for USDC on Uniswap');
    console.log('3. Run the demo: ./scripts/demo.sh');
    
  } catch (error) {
    console.error('❌ Setup verification failed:', error.message);
    process.exit(1);
  }
}

verifySetup();