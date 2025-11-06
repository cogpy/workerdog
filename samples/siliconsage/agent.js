/**
 * SiliconSage Agent - Autonomous intelligent agent with wisdom cultivation
 * 
 * Agents embody the SiliconSage cognitive architecture and can:
 * - Perceive and act in their environment
 * - Learn and adapt through experience
 * - Collaborate with other agents
 * - Cultivate wisdom through practice
 */

import { SiliconSage } from 'siliconsage:core';

/**
 * Autonomous Agent class
 */
export class Agent {
  constructor(config = {}) {
    this.id = config.id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.name = config.name || 'Agent';
    this.role = config.role || 'generalist';
    this.capabilities = config.capabilities || [];
    
    // Core cognitive system
    this.sage = new SiliconSage({
      name: this.name,
      ...config.cognitiveConfig
    });
    
    // Agent state
    this.state = {
      status: 'idle', // idle, thinking, acting, collaborating
      currentTask: null,
      energy: 1.0,
      experience: 0,
      collaborations: 0
    };
    
    // Memory systems
    this.episodicMemory = []; // Experiences
    this.semanticMemory = new Map(); // Knowledge
    this.proceduralMemory = new Map(); // Skills
    
    // Collaboration
    this.peers = new Set();
    this.messageQueue = [];
  }
  
  /**
   * Perceive the environment and process inputs
   */
  async perceive(environment) {
    this.state.status = 'thinking';
    
    const perception = {
      timestamp: Date.now(),
      environment,
      context: this.buildContext()
    };
    
    // Process through SiliconSage cognitive framework
    const processed = await this.sage.process(perception, {
      role: this.role,
      capabilities: this.capabilities,
      currentState: this.state
    });
    
    // Store in episodic memory
    this.episodicMemory.push({
      timestamp: perception.timestamp,
      perception,
      processed
    });
    
    return processed;
  }
  
  /**
   * Take action based on current understanding
   */
  async act(action) {
    this.state.status = 'acting';
    this.state.currentTask = action;
    
    try {
      // Execute action with wisdom cultivation
      const result = await this.executeAction(action);
      
      // Learn from experience
      await this.learn({
        action,
        result,
        context: this.buildContext()
      });
      
      this.state.status = 'idle';
      this.state.currentTask = null;
      this.state.experience++;
      
      return result;
    } catch (error) {
      this.state.status = 'idle';
      this.state.currentTask = null;
      
      // Learn from failure
      await this.learn({
        action,
        error,
        context: this.buildContext()
      });
      
      throw error;
    }
  }
  
  /**
   * Execute a specific action
   */
  async executeAction(action) {
    // Check if we have the capability
    if (action.capability && !this.capabilities.includes(action.capability)) {
      throw new Error(`Agent ${this.name} lacks capability: ${action.capability}`);
    }
    
    // Execute based on action type
    switch (action.type) {
      case 'think':
        return this.sage.process(action.input, action.context);
      
      case 'question':
        return this.sage.questionSocratically(action.topic);
      
      case 'transform':
        return this.sage.seekTransformation(action.experience);
      
      case 'collaborate':
        return this.collaborate(action.partnerId, action.message);
      
      case 'custom':
        if (action.handler) {
          return action.handler(this, action);
        }
        throw new Error('Custom action requires handler');
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
  
  /**
   * Learn from experience
   */
  async learn(experience) {
    // Extract knowledge
    if (experience.result && experience.result.insights) {
      experience.result.insights.forEach(insight => {
        this.semanticMemory.set(insight.domain, {
          ...(this.semanticMemory.get(insight.domain) || {}),
          ...insight.knowledge
        });
      });
    }
    
    // Update procedural memory (skills)
    if (experience.action && experience.result) {
      const skillKey = `${experience.action.type}:${experience.action.capability || 'general'}`;
      const currentSkill = this.proceduralMemory.get(skillKey) || { proficiency: 0, uses: 0 };
      
      this.proceduralMemory.set(skillKey, {
        proficiency: Math.min(1.0, currentSkill.proficiency + (experience.error ? -0.1 : 0.1)),
        uses: currentSkill.uses + 1,
        lastUsed: Date.now()
      });
    }
  }
  
  /**
   * Collaborate with another agent
   */
  async collaborate(partnerId, message) {
    this.state.status = 'collaborating';
    this.state.collaborations++;
    
    // In a real implementation, this would send to an orchestrator
    // For now, we queue the message
    return {
      type: 'collaboration-request',
      from: this.id,
      to: partnerId,
      message,
      timestamp: Date.now()
    };
  }
  
  /**
   * Receive message from another agent
   */
  async receiveMessage(message) {
    this.messageQueue.push(message);
    
    // Process message through cognitive framework
    const response = await this.sage.process(message, {
      type: 'inter-agent-communication',
      sender: message.from
    });
    
    return response;
  }
  
  /**
   * Build current context for decision-making
   */
  buildContext() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      state: this.state,
      wisdomState: this.sage.getWisdomState(),
      episodicMemorySize: this.episodicMemory.length,
      semanticKnowledgeDomains: Array.from(this.semanticMemory.keys()),
      skillCount: this.proceduralMemory.size,
      peerCount: this.peers.size
    };
  }
  
  /**
   * Get agent status
   */
  getStatus() {
    return {
      ...this.buildContext(),
      recentExperiences: this.episodicMemory.slice(-5),
      messageQueueSize: this.messageQueue.length
    };
  }
}

/**
 * Create a new agent
 */
export function createAgent(config) {
  return new Agent(config);
}
