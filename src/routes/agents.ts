import express from 'express';

const router = express.Router();

// Agent registry
const agents = new Map<string, {
  id: string;
  name: string;
  services: string[];
  address: string;
  reputation: number;
  lastSeen: Date;
}>();

// Register agent
router.post('/register', (req, res) => {
  const { name, services, address } = req.body;
  
  if (!name || !services || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const agentId = `agent-${Date.now()}`;
  const agent = {
    id: agentId,
    name,
    services,
    address,
    reputation: 100, // Starting reputation
    lastSeen: new Date(),
  };

  agents.set(agentId, agent);

  res.json({
    success: true,
    agent,
    message: 'Agent registered successfully',
  });
});

// Get agent info
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const agent = agents.get(id);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  res.json(agent);
});

// List all agents
router.get('/', (req, res) => {
  const { service } = req.query;
  
  let agentList = Array.from(agents.values());
  
  if (service) {
    agentList = agentList.filter(agent => 
      agent.services.includes(service as string)
    );
  }

  res.json({
    agents: agentList,
    total: agentList.length,
  });
});

// Update agent heartbeat
router.post('/:id/heartbeat', (req, res) => {
  const { id } = req.params;
  const agent = agents.get(id);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  agent.lastSeen = new Date();
  agents.set(id, agent);

  res.json({
    success: true,
    message: 'Heartbeat updated',
    lastSeen: agent.lastSeen,
  });
});

// Update agent reputation
router.post('/:id/reputation', (req, res) => {
  const { id } = req.params;
  const { change, reason } = req.body;
  const agent = agents.get(id);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  agent.reputation = Math.max(0, Math.min(1000, agent.reputation + change));
  agents.set(id, agent);

  res.json({
    success: true,
    agent,
    reason,
    message: 'Reputation updated',
  });
});

export { router as agentRoutes };