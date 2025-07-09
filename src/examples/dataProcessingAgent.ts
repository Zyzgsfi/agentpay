import { ServiceAgent } from '../agents/ServiceAgent';
import { config } from '../config';

async function createDataProcessingAgent() {
  const agent = new ServiceAgent(
    config.agent.privateKey,
    3001,
    'data-processing-agent'
  );

  // Add text processing service
  agent.addService({
    name: 'text-processing',
    endpoint: '/process-text',
    price: '0.05',
    description: 'Process and analyze text data',
    method: 'POST',
    handler: async (req, res) => {
      const { text, operation = 'analyze' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text input required' });
      }

      let result;
      switch (operation) {
        case 'analyze':
          result = {
            wordCount: text.split(/\s+/).length,
            charCount: text.length,
            sentences: text.split(/[.!?]+/).filter(Boolean).length,
            sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
          };
          break;
        case 'uppercase':
          result = { processed: text.toUpperCase() };
          break;
        case 'lowercase':
          result = { processed: text.toLowerCase() };
          break;
        case 'reverse':
          result = { processed: text.split('').reverse().join('') };
          break;
        default:
          return res.status(400).json({ error: 'Invalid operation' });
      }

      res.json({
        success: true,
        operation,
        input: text,
        result,
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Add data validation service
  agent.addService({
    name: 'data-validation',
    endpoint: '/validate-data',
    price: '0.03',
    description: 'Validate data structures and formats',
    method: 'POST',
    handler: async (req, res) => {
      const { data, schema } = req.body;
      
      if (!data) {
        return res.status(400).json({ error: 'Data input required' });
      }

      // Simple validation logic
      const validation = {
        isValid: true,
        errors: [],
        dataType: Array.isArray(data) ? 'array' : typeof data,
        itemCount: Array.isArray(data) ? data.length : 1,
      };

      if (schema) {
        // Basic schema validation
        if (schema.required && !data) {
          validation.isValid = false;
          validation.errors.push('Required data is missing');
        }
        
        if (schema.type && typeof data !== schema.type) {
          validation.isValid = false;
          validation.errors.push(`Expected ${schema.type}, got ${typeof data}`);
        }
      }

      res.json({
        success: true,
        validation,
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Add number crunching service
  agent.addService({
    name: 'number-crunching',
    endpoint: '/crunch-numbers',
    price: '0.08',
    description: 'Perform statistical analysis on numerical data',
    method: 'POST',
    handler: async (req, res) => {
      const { numbers, operation = 'stats' } = req.body;
      
      if (!Array.isArray(numbers) || numbers.length === 0) {
        return res.status(400).json({ error: 'Array of numbers required' });
      }

      if (!numbers.every(n => typeof n === 'number')) {
        return res.status(400).json({ error: 'All items must be numbers' });
      }

      let result;
      switch (operation) {
        case 'stats':
          const sum = numbers.reduce((a, b) => a + b, 0);
          const mean = sum / numbers.length;
          const sortedNumbers = [...numbers].sort((a, b) => a - b);
          
          result = {
            count: numbers.length,
            sum,
            mean,
            median: sortedNumbers[Math.floor(sortedNumbers.length / 2)],
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            standardDeviation: Math.sqrt(
              numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length
            ),
          };
          break;
        case 'fibonacci':
          const fibCount = Math.min(numbers[0] || 10, 100);
          const fib = [0, 1];
          for (let i = 2; i < fibCount; i++) {
            fib[i] = fib[i - 1] + fib[i - 2];
          }
          result = { sequence: fib };
          break;
        case 'prime':
          const limit = Math.min(numbers[0] || 100, 1000);
          const primes = [];
          for (let i = 2; i <= limit; i++) {
            if (isPrime(i)) primes.push(i);
          }
          result = { primes };
          break;
        default:
          return res.status(400).json({ error: 'Invalid operation' });
      }

      res.json({
        success: true,
        operation,
        result,
        timestamp: new Date().toISOString(),
      });
    },
  });

  return agent;
}

function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  
  return true;
}

// Run the agent if this file is executed directly
if (require.main === module) {
  createDataProcessingAgent().then(async agent => {
    await agent.start();
    
    // Register with the main server
    try {
      await agent.registerWithDirectory('http://localhost:3000', [
        'text-processing',
        'data-validation',
        'number-crunching'
      ]);
      console.log('✅ Registered with directory');
    } catch (error) {
      console.error('❌ Failed to register with directory:', error);
    }
  });
}

export { createDataProcessingAgent };