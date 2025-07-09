import express from 'express';
import { PaymentAgent } from './PaymentAgent';
import { x402 } from '../middleware/x402';

export interface ServiceDefinition {
  name: string;
  endpoint: string;
  price: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: express.Request, res: express.Response) => any;
}

export class ServiceAgent extends PaymentAgent {
  private app: express.Application;
  private services: Map<string, ServiceDefinition>;
  private port: number;

  constructor(privateKey: string, port: number = 3001, agentId?: string) {
    super(privateKey, agentId);
    this.port = port;
    this.services = new Map();
    this.app = express();
    
    // Middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    this.setupDefaultRoutes();
  }

  private setupDefaultRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        agentId: this.getId(),
        address: this.getAddress(),
        services: Array.from(this.services.keys()),
        timestamp: new Date().toISOString(),
      });
    });

    // Service discovery
    this.app.get('/services', (req, res) => {
      const serviceList = Array.from(this.services.values()).map(service => ({
        name: service.name,
        endpoint: service.endpoint,
        price: service.price,
        description: service.description,
        method: service.method,
      }));

      res.json({
        agentId: this.getId(),
        services: serviceList,
        total: serviceList.length,
      });
    });
  }

  addService(service: ServiceDefinition): void {
    this.services.set(service.name, service);
    
    // Add route with payment middleware
    const middlewares = [
      x402.createPaymentRequired(service.price, this.getAddress()),
      x402.verifyPayment.bind(x402),
      service.handler,
    ];

    switch (service.method) {
      case 'GET':
        this.app.get(service.endpoint, ...middlewares);
        break;
      case 'POST':
        this.app.post(service.endpoint, ...middlewares);
        break;
      case 'PUT':
        this.app.put(service.endpoint, ...middlewares);
        break;
      case 'DELETE':
        this.app.delete(service.endpoint, ...middlewares);
        break;
    }

    console.log(`Service added: ${service.name} at ${service.endpoint} for ${service.price} USDC`);
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🤖 Service Agent ${this.getId()} running on port ${this.port}`);
        console.log(`💳 Agent Address: ${this.getAddress()}`);
        console.log(`🔧 Services: ${Array.from(this.services.keys()).join(', ')}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    // Implementation for graceful shutdown
    console.log(`Service Agent ${this.getId()} stopping...`);
  }

  // Method to make payments to other service agents
  async buyService(targetUrl: string, service: string, data?: any): Promise<any> {
    return this.makeServiceRequest({
      url: `${targetUrl}${service}`,
      method: data ? 'POST' : 'GET',
      data,
      maxPayment: '1.0', // Default max payment
    });
  }

  // Method to interact with other agents for collaborative work
  async collaborateWith(otherAgentUrl: string, task: string, data: any): Promise<any> {
    try {
      // First, discover what services the other agent offers
      const servicesResponse = await fetch(`${otherAgentUrl}/services`);
      const services: any = await servicesResponse.json();

      console.log(`Collaborating with agent at ${otherAgentUrl}`);
      console.log(`Available services:`, services.services.map((s: any) => s.name));

      // Find a suitable service for the task
      const suitableService = services.services.find((s: any) => 
        s.name.toLowerCase().includes(task.toLowerCase()) ||
        s.description.toLowerCase().includes(task.toLowerCase())
      );

      if (!suitableService) {
        throw new Error(`No suitable service found for task: ${task}`);
      }

      // Make payment and use the service
      return await this.buyService(otherAgentUrl, suitableService.endpoint, data);

    } catch (error) {
      console.error('Collaboration failed:', error);
      throw error;
    }
  }

  getServiceList(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }
}