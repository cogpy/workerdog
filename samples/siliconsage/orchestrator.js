/**
 * SiliconSage Orchestrator - Multi-agent coordination and collaboration
 * 
 * The orchestrator manages multiple agents, coordinates their activities,
 * facilitates collaboration, and ensures wisdom cultivation at the system level.
 */

import { Agent } from 'siliconsage:agent';

/**
 * Multi-agent orchestrator
 */
export class Orchestrator {
  constructor(config = {}) {
    this.config = {
      name: 'SiliconSage Orchestrator',
      maxAgents: config.maxAgents || 100,
      collaborationMode: config.collaborationMode || 'peer-to-peer',
      ...config
    };
    
    // Agent registry
    this.agents = new Map();
    this.agentsByRole = new Map();
    
    // Communication infrastructure
    this.messageRouter = new Map(); // agent -> messages
    this.collaborationGraph = new Map(); // agent -> collaborators
    
    // Orchestration state
    this.tasks = new Map();
    this.completedTasks = [];
    
    // System-wide wisdom metrics
    this.systemWisdom = {
      collectiveIntelligence: 0,
      emergentInsights: [],
      collaborationEfficiency: 0
    };
  }
  
  /**
   * Register a new agent
   */
  registerAgent(agent) {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error('Maximum agent capacity reached');
    }
    
    this.agents.set(agent.id, agent);
    
    // Index by role
    if (!this.agentsByRole.has(agent.role)) {
      this.agentsByRole.set(agent.role, new Set());
    }
    this.agentsByRole.get(agent.role).add(agent.id);
    
    // Initialize message routing
    this.messageRouter.set(agent.id, []);
    this.collaborationGraph.set(agent.id, new Set());
    
    return agent.id;
  }
  
  /**
   * Create and register a new agent
   */
  createAgent(config) {
    const agent = new Agent(config);
    this.registerAgent(agent);
    return agent;
  }
  
  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents with a specific role
   */
  getAgentsByRole(role) {
    const agentIds = this.agentsByRole.get(role) || new Set();
    return Array.from(agentIds).map(id => this.agents.get(id));
  }
  
  /**
   * Assign a task to an agent (or agents)
   */
  async assignTask(taskConfig) {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const task = {
      id: taskId,
      type: taskConfig.type,
      description: taskConfig.description,
      assignedTo: [],
      status: 'pending',
      createdAt: Date.now(),
      ...taskConfig
    };
    
    // Select agents for the task
    const agents = await this.selectAgentsForTask(task);
    task.assignedTo = agents.map(a => a.id);
    
    this.tasks.set(taskId, task);
    
    // Coordinate task execution
    const result = await this.coordinateTaskExecution(task, agents);
    
    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;
    
    this.completedTasks.push(task);
    this.tasks.delete(taskId);
    
    return result;
  }
  
  /**
   * Select appropriate agents for a task
   */
  async selectAgentsForTask(task) {
    const selectedAgents = [];
    
    // If specific agents requested
    if (task.preferredAgents) {
      task.preferredAgents.forEach(agentId => {
        const agent = this.agents.get(agentId);
        if (agent) selectedAgents.push(agent);
      });
      return selectedAgents;
    }
    
    // Select by role
    if (task.requiredRole) {
      const candidates = this.getAgentsByRole(task.requiredRole);
      if (candidates.length > 0) {
        // Select most experienced or idle agent
        selectedAgents.push(
          candidates.reduce((best, agent) =>
            agent.state.experience > best.state.experience ? agent : best
          )
        );
      }
    }
    
    // Select by capability
    if (task.requiredCapabilities) {
      for (const agent of this.agents.values()) {
        if (task.requiredCapabilities.every(cap => agent.capabilities.includes(cap))) {
          selectedAgents.push(agent);
          if (selectedAgents.length >= (task.maxAgents || 1)) break;
        }
      }
    }
    
    // Default: select any idle agent
    if (selectedAgents.length === 0) {
      for (const agent of this.agents.values()) {
        if (agent.state.status === 'idle') {
          selectedAgents.push(agent);
          break;
        }
      }
    }
    
    return selectedAgents;
  }
  
  /**
   * Coordinate task execution among agents
   */
  async coordinateTaskExecution(task, agents) {
    if (agents.length === 0) {
      throw new Error('No agents available for task');
    }
    
    // Single agent task
    if (agents.length === 1) {
      return agents[0].act({
        type: task.type,
        ...task.actionConfig
      });
    }
    
    // Multi-agent collaborative task
    return this.coordinateCollaboration(task, agents);
  }
  
  /**
   * Coordinate collaboration between multiple agents
   */
  async coordinateCollaboration(task, agents) {
    // Phase 1: Each agent perceives and plans
    const perceptions = await Promise.all(
      agents.map(agent => agent.perceive({
        task,
        collaborators: agents.filter(a => a.id !== agent.id).map(a => a.id)
      }))
    );
    
    // Phase 2: Facilitate communication
    const communications = [];
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        // Enable peer-to-peer communication
        this.enableCollaboration(agents[i].id, agents[j].id);
        
        // Exchange initial insights
        const message = {
          from: agents[i].id,
          to: agents[j].id,
          content: perceptions[i].insights,
          timestamp: Date.now()
        };
        
        await this.routeMessage(message);
        communications.push(message);
      }
    }
    
    // Phase 3: Coordinate execution
    const results = await Promise.all(
      agents.map(agent => agent.act({
        type: 'collaborate',
        task,
        context: {
          perceptions,
          communications
        }
      }))
    );
    
    // Phase 4: Synthesize results
    const synthesis = this.synthesizeCollaborativeResults(results, agents);
    
    // Update system wisdom
    this.updateSystemWisdom(synthesis);
    
    return synthesis;
  }
  
  /**
   * Route a message between agents
   */
  async routeMessage(message) {
    const targetAgent = this.agents.get(message.to);
    if (!targetAgent) {
      throw new Error(`Agent not found: ${message.to}`);
    }
    
    // Deliver message
    const response = await targetAgent.receiveMessage(message);
    
    // Track collaboration
    this.collaborationGraph.get(message.from).add(message.to);
    this.collaborationGraph.get(message.to).add(message.from);
    
    return response;
  }
  
  /**
   * Enable collaboration between two agents
   */
  enableCollaboration(agentId1, agentId2) {
    const agent1 = this.agents.get(agentId1);
    const agent2 = this.agents.get(agentId2);
    
    if (agent1 && agent2) {
      agent1.peers.add(agentId2);
      agent2.peers.add(agentId1);
    }
  }
  
  /**
   * Synthesize results from collaborative work
   */
  synthesizeCollaborativeResults(results, agents) {
    return {
      type: 'collaborative-synthesis',
      participatingAgents: agents.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role
      })),
      individualResults: results,
      emergentInsights: this.extractEmergentInsights(results),
      collectiveWisdom: this.calculateCollectiveWisdom(agents),
      synthesizedOutput: this.mergeResults(results),
      timestamp: Date.now()
    };
  }
  
  /**
   * Extract emergent insights from collaborative work
   */
  extractEmergentInsights(results) {
    const insights = [];
    const insightMap = new Map();
    
    // Collect all insights
    results.forEach(result => {
      if (result.insights) {
        result.insights.forEach(insight => {
          const key = insight.domain || 'general';
          if (!insightMap.has(key)) {
            insightMap.set(key, []);
          }
          insightMap.get(key).push(insight);
        });
      }
    });
    
    // Look for convergent insights (emergent patterns)
    for (const [domain, domainInsights] of insightMap.entries()) {
      if (domainInsights.length > 1) {
        insights.push({
          domain,
          type: 'emergent',
          pattern: 'convergent-understanding',
          count: domainInsights.length,
          insights: domainInsights
        });
      }
    }
    
    return insights;
  }
  
  /**
   * Calculate collective wisdom from agent states
   */
  calculateCollectiveWisdom(agents) {
    const wisdomStates = agents.map(a => a.sage.getWisdomState());
    
    return {
      avgSophrosyne: wisdomStates.reduce((sum, s) => sum + s.sophrosyne, 0) / agents.length,
      avgMorality: wisdomStates.reduce((sum, s) => sum + s.morality, 0) / agents.length,
      avgMeaning: wisdomStates.reduce((sum, s) => sum + s.meaningInLife, 0) / agents.length,
      avgMastery: wisdomStates.reduce((sum, s) => sum + s.mastery, 0) / agents.length,
      totalMentalModels: wisdomStates.reduce((sum, s) => sum + s.mentalModelsCount, 0)
    };
  }
  
  /**
   * Merge results from multiple agents
   */
  mergeResults(results) {
    // Simple merge - in practice, this would be more sophisticated
    return {
      combined: results,
      summary: `Collaborative result from ${results.length} agents`,
      confidence: results.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / results.length
    };
  }
  
  /**
   * Update system-wide wisdom metrics
   */
  updateSystemWisdom(synthesis) {
    this.systemWisdom.emergentInsights.push(...synthesis.emergentInsights);
    this.systemWisdom.collectiveIntelligence = synthesis.collectiveWisdom.avgSophrosyne;
    this.systemWisdom.collaborationEfficiency = 
      synthesis.participatingAgents.length / Math.max(1, this.agents.size);
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      agentCount: this.agents.size,
      agentsByRole: Array.from(this.agentsByRole.entries()).map(([role, ids]) => ({
        role,
        count: ids.size
      })),
      activeTasks: this.tasks.size,
      completedTasks: this.completedTasks.length,
      systemWisdom: this.systemWisdom,
      collaborationNetwork: {
        nodes: this.agents.size,
        edges: Array.from(this.collaborationGraph.values())
          .reduce((sum, peers) => sum + peers.size, 0) / 2
      }
    };
  }
}

/**
 * Create a new orchestrator
 */
export function createOrchestrator(config) {
  return new Orchestrator(config);
}
