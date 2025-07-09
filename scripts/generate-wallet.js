const { ethers } = require('ethers');

console.log('🔑 Generating new wallet for Base Sepolia testnet...\n');

// Generate a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log('✅ New wallet generated successfully!');
console.log('=====================================');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('=====================================');
console.log('');
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. This is a TESTNET wallet - do not use for mainnet!');
console.log('2. Never share your private key with anyone');
console.log('3. Store your private key securely');
console.log('4. This wallet has 0 balance - you need to get testnet tokens');
console.log('');
console.log('📋 Next steps:');
console.log('1. Copy the private key and address above');
console.log('2. Add to your .env file');
console.log('3. Get testnet ETH from faucet');
console.log('4. Get testnet USDC');
console.log('');
console.log('🔗 Useful links:');
console.log('- Base Sepolia Faucet: https://coinbase.com/faucets/base-ethereum-sepolia-faucet');
console.log('- Base Sepolia Explorer: https://sepolia.basescan.org');
console.log('- Add to MetaMask: https://chainlist.org/chain/84532');