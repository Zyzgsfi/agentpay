import { ServiceAgent } from '../agents/ServiceAgent';
import { config } from '../config';

async function createAIServiceAgent() {
  const agent = new ServiceAgent(
    config.agent.privateKey,
    3002,
    'ai-service-agent'
  );

  // Add text generation service
  agent.addService({
    name: 'text-generation',
    endpoint: '/generate-text',
    price: '0.15',
    description: 'Generate text using AI models',
    method: 'POST',
    handler: async (req, res) => {
      const { prompt, maxTokens = 100, temperature = 0.7 } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
      }

      // Simulate AI text generation
      const responses = [
        'This is a simulated AI response to your prompt.',
        'AI-generated content based on your input.',
        'Here is the AI-generated text you requested.',
        'The AI model has processed your prompt and generated this response.',
        'This response simulates what an AI would generate for your prompt.',
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      
      res.json({
        success: true,
        prompt,
        response: `${response} [Prompt: "${prompt}"]`,
        metadata: {
          model: 'simulated-gpt-4',
          tokens: Math.floor(Math.random() * maxTokens) + 10,
          temperature,
          processingTime: Math.random() * 2 + 0.5,
        },
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Add image analysis service
  agent.addService({
    name: 'image-analysis',
    endpoint: '/analyze-image',
    price: '0.20',
    description: 'Analyze images using computer vision',
    method: 'POST',
    handler: async (req, res) => {
      const { imageUrl, analysisType = 'general' } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL required' });
      }

      // Simulate image analysis
      const objects = ['person', 'car', 'tree', 'building', 'sky', 'road'];
      const colors = ['blue', 'red', 'green', 'yellow', 'black', 'white'];
      
      const analysis = {
        objects: objects.slice(0, Math.floor(Math.random() * 4) + 1),
        dominantColors: colors.slice(0, Math.floor(Math.random() * 3) + 1),
        confidence: Math.random() * 0.3 + 0.7,
        resolution: '1024x768',
        format: 'JPEG',
      };

      if (analysisType === 'detailed') {
        analysis.objects = objects.slice(0, Math.floor(Math.random() * 6) + 2);
        analysis.dominantColors = colors.slice(0, Math.floor(Math.random() * 5) + 2);
      }

      res.json({
        success: true,
        imageUrl,
        analysisType,
        analysis,
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Add translation service
  agent.addService({
    name: 'translation',
    endpoint: '/translate',
    price: '0.10',
    description: 'Translate text between languages',
    method: 'POST',
    handler: async (req, res) => {
      const { text, fromLang = 'auto', toLang = 'en' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text to translate required' });
      }

      // Simulate translation
      const translations = {
        'hello': { es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao' },
        'goodbye': { es: 'adiós', fr: 'au revoir', de: 'auf wiedersehen', it: 'ciao' },
        'thank you': { es: 'gracias', fr: 'merci', de: 'danke', it: 'grazie' },
      };

      const lowerText = text.toLowerCase();
      let translatedText = text;
      
      if (translations[lowerText] && translations[lowerText][toLang]) {
        translatedText = translations[lowerText][toLang];
      } else {
        translatedText = `[${toLang.toUpperCase()}] ${text}`;
      }

      res.json({
        success: true,
        original: text,
        translated: translatedText,
        fromLanguage: fromLang,
        toLanguage: toLang,
        confidence: Math.random() * 0.2 + 0.8,
        timestamp: new Date().toISOString(),
      });
    },
  });

  // Add sentiment analysis service
  agent.addService({
    name: 'sentiment-analysis',
    endpoint: '/analyze-sentiment',
    price: '0.07',
    description: 'Analyze sentiment of text',
    method: 'POST',
    handler: async (req, res) => {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text required for sentiment analysis' });
      }

      // Simple sentiment analysis simulation
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
      const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate'];
      
      const words = text.toLowerCase().split(/\s+/);
      const positiveCount = words.filter(word => positiveWords.includes(word)).length;
      const negativeCount = words.filter(word => negativeWords.includes(word)).length;
      
      let sentiment = 'neutral';
      let score = 0;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = Math.min(0.9, 0.5 + (positiveCount - negativeCount) * 0.1);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = Math.max(-0.9, -0.5 - (negativeCount - positiveCount) * 0.1);
      } else {
        score = (Math.random() - 0.5) * 0.2; // Small random variation around neutral
      }

      res.json({
        success: true,
        text,
        sentiment,
        score,
        confidence: Math.random() * 0.2 + 0.8,
        details: {
          positiveWords: positiveCount,
          negativeWords: negativeCount,
          totalWords: words.length,
        },
        timestamp: new Date().toISOString(),
      });
    },
  });

  return agent;
}

// Run the agent if this file is executed directly
if (require.main === module) {
  createAIServiceAgent().then(async agent => {
    await agent.start();
    
    // Register with the main server
    try {
      await agent.registerWithDirectory('http://localhost:3000', [
        'text-generation',
        'image-analysis',
        'translation',
        'sentiment-analysis'
      ]);
      console.log('✅ Registered with directory');
    } catch (error) {
      console.error('❌ Failed to register with directory:', error);
    }
  });
}

export { createAIServiceAgent };