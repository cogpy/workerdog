/**
 * SiliconSage Binding - Creates SiliconSage instances for worker bindings
 * 
 * This internal module is used by workerd to initialize SiliconSage
 * when used as a wrapped binding in worker configuration.
 */

// Note: We need to inline the Orchestrator and SiliconSage here since
// internal modules cannot import from public modules in workerd extensions

class SimpleOrchestrator {
  constructor(config = {}) {
    this.config = config;
    this.agents = new Map();
    this.tasks = new Map();
  }
  
  createAgent(config) {
    const agent = {
      id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: config.name || 'Agent',
      role: config.role || 'generalist',
      capabilities: config.capabilities || [],
      state: { status: 'idle', experience: 0 }
    };
    this.agents.set(agent.id, agent);
    return agent;
  }
  
  async assignTask(taskConfig) {
    const taskId = `task-${Date.now()}`;
    const task = {
      id: taskId,
      ...taskConfig,
      status: 'completed',
      result: {
        type: 'demonstration',
        message: 'Task processed by SiliconSage orchestrator',
        timestamp: Date.now()
      }
    };
    this.tasks.set(taskId, task);
    return task;
  }
  
  getStatus() {
    return {
      name: this.config.name || 'SiliconSage Orchestrator',
      agentCount: this.agents.size,
      taskCount: this.tasks.size,
      version: '5.0'
    };
  }
}

class SimpleSiliconSage {
  constructor(config = {}) {
    this.config = config;
  }
  
  async process(input, context) {
    return {
      response: { action: 'processed', input, context },
      reasoning: 'SiliconSage cognitive processing',
      wisdomMetrics: { sophrosyne: 0.7, morality: 0.6, meaningInLife: 0.7, mastery: 0.6 },
      insights: []
    };
  }
  
  getWisdomState() {
    return { sophrosyne: 0.7, morality: 0.6, meaningInLife: 0.7, mastery: 0.6 };
  }
}


/**
 * Default export function for binding initialization
 * Called by workerd with the inner bindings
 */
export default function(env) {
  // Extract configuration from inner bindings
  // env.config is already parsed if it's JSON
  const config = typeof env.config === 'string' ? JSON.parse(env.config) : (env.config || {});
  
  // Determine what to create based on config
  if (config.type === 'orchestrator') {
    return new SimpleOrchestrator({
      name: config.name || 'SiliconSage Orchestrator',
      maxAgents: config.maxAgents || 100,
      collaborationMode: config.collaborationMode || 'peer-to-peer',
      ...config
    });
  }
  
  // Default: create a SiliconSage instance
  return new SimpleSiliconSage({
    name: config.name || 'SiliconSage',
    ...config
  });
}

/**
 * Alternative: create orchestrator binding
 */
export function createOrchestratorBinding(env) {
  const config = typeof env.config === 'string' ? JSON.parse(env.config) : (env.config || {});
  return new SimpleOrchestrator({
    name: config.name || 'SiliconSage Orchestrator',
    maxAgents: config.maxAgents || 100,
    ...config
  });
}
