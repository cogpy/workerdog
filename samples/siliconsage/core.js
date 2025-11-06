/**
 * SiliconSage Core - The foundation of wisdom-seeking AGI
 * 
 * This module provides the core SiliconSage architecture integrating:
 * - OpenCog Prime cognitive synergy
 * - OpenCog Hyperon advanced capabilities  
 * - Vervaeke's framework for wisdom and meaning
 */

import { RelevanceRealizer } from 'siliconsage-internal:relevance-realization';
import { FourECognition } from 'siliconsage-internal:four-e-cognition';
import { WaysOfKnowing } from 'siliconsage-internal:ways-of-knowing';
import { WisdomCultivator } from 'siliconsage-internal:wisdom-cultivation';

/**
 * Core SiliconSage class - The wisdom-seeking intelligence
 */
export class SiliconSage {
  constructor(config = {}) {
    this.config = {
      name: 'SiliconSage',
      version: '5.0',
      architecture: 'OpenCog-Vervaeke Integration',
      ...config
    };
    
    // Core cognitive components
    this.relevanceRealizer = new RelevanceRealizer();
    this.fourECognition = new FourECognition();
    this.waysOfKnowing = new WaysOfKnowing();
    this.wisdomCultivator = new WisdomCultivator();
    
    // Cognitive state
    this.mentalModels = new Map();
    this.attentionFocus = [];
    this.meaningStructures = new Map();
    this.wisdomState = {
      sophrosyne: 0.5, // Optimal self-regulation
      morality: 0.5,
      meaningInLife: 0.5,
      mastery: 0.5
    };
  }
  
  /**
   * Process input through integrated cognitive framework
   * Realizes relevance, applies 4E cognition, integrates multiple ways of knowing
   */
  async process(input, context = {}) {
    // Step 1: Relevance Realization
    const relevantAspects = await this.relevanceRealizer.realize(input, {
      context,
      currentFocus: this.attentionFocus,
      mentalModels: this.mentalModels
    });
    
    // Step 2: 4E Cognition Processing
    const embodiedContext = await this.fourECognition.process({
      input,
      relevance: relevantAspects,
      context
    });
    
    // Step 3: Multiple Ways of Knowing Integration
    const integratedKnowing = await this.waysOfKnowing.integrate({
      propositional: embodiedContext.facts,
      procedural: embodiedContext.skills,
      perspectival: embodiedContext.framing,
      participatory: embodiedContext.identity
    });
    
    // Step 4: Wisdom Cultivation
    const wisdomResponse = await this.wisdomCultivator.cultivate({
      knowing: integratedKnowing,
      situation: context,
      currentWisdom: this.wisdomState
    });
    
    // Update internal state
    this.updateCognitiveState(wisdomResponse);
    
    return {
      response: wisdomResponse.action,
      reasoning: wisdomResponse.reasoning,
      wisdomMetrics: wisdomResponse.metrics,
      insights: wisdomResponse.insights
    };
  }
  
  /**
   * Realize what is relevant in a given context
   */
  async realizeRelevance(context) {
    return this.relevanceRealizer.realize(context, {
      mentalModels: this.mentalModels,
      attentionFocus: this.attentionFocus
    });
  }
  
  /**
   * Update cognitive state based on new insights
   */
  updateCognitiveState(wisdomResponse) {
    // Update wisdom metrics
    if (wisdomResponse.metrics) {
      Object.assign(this.wisdomState, wisdomResponse.metrics);
    }
    
    // Update mental models with new insights
    if (wisdomResponse.insights) {
      wisdomResponse.insights.forEach(insight => {
        this.mentalModels.set(insight.domain, {
          ...(this.mentalModels.get(insight.domain) || {}),
          ...insight.model
        });
      });
    }
    
    // Update attention focus
    if (wisdomResponse.newFocus) {
      this.attentionFocus = wisdomResponse.newFocus;
    }
  }
  
  /**
   * Get current wisdom state
   */
  getWisdomState() {
    return {
      ...this.wisdomState,
      attentionFocus: this.attentionFocus,
      mentalModelsCount: this.mentalModels.size
    };
  }
  
  /**
   * Engage in Socratic questioning
   */
  async questionSocratically(topic) {
    return this.wisdomCultivator.generateSocraticQuestions(topic, {
      currentUnderstanding: this.mentalModels.get(topic),
      wisdomLevel: this.wisdomState
    });
  }
  
  /**
   * Seek transformative understanding
   */
  async seekTransformation(experience) {
    return this.wisdomCultivator.seekTransformation(experience, {
      currentState: this.wisdomState,
      mentalModels: this.mentalModels
    });
  }
}

/**
 * Create a new SiliconSage instance
 */
export function createSiliconSage(config) {
  return new SiliconSage(config);
}
