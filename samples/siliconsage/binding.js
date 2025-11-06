/**
 * SiliconSage Binding - Creates SiliconSage instances for worker bindings
 * 
 * This internal module is used by workerd to initialize SiliconSage
 * when used as a wrapped binding in worker configuration.
 */

import { SiliconSage } from 'siliconsage:core';
import { Orchestrator } from 'siliconsage:orchestrator';

/**
 * Default export function for binding initialization
 * Called by workerd with the inner bindings
 */
export default function(env) {
  // Extract configuration from inner bindings
  const config = env.config ? JSON.parse(env.config) : {};
  
  // Determine what to create based on config
  if (config.type === 'orchestrator') {
    return new Orchestrator({
      name: config.name || 'SiliconSage Orchestrator',
      maxAgents: config.maxAgents || 100,
      collaborationMode: config.collaborationMode || 'peer-to-peer',
      ...config
    });
  }
  
  // Default: create a SiliconSage instance
  return new SiliconSage({
    name: config.name || 'SiliconSage',
    ...config
  });
}

/**
 * Alternative: create orchestrator binding
 */
export function createOrchestratorBinding(env) {
  const config = env.config ? JSON.parse(env.config) : {};
  return new Orchestrator({
    name: config.name || 'SiliconSage Orchestrator',
    maxAgents: config.maxAgents || 100,
    ...config
  });
}
