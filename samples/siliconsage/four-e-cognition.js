/**
 * 4E Cognition - Embodied, Embedded, Enacted, Extended cognition
 * 
 * Implements the 4E framework showing how cognition is not isolated
 * in a disembodied mind but distributed across body, environment, and action.
 */

export class FourECognition {
  constructor(config = {}) {
    this.config = config;
    this.bodySchema = this.initializeBodySchema();
    this.environmentalScaffolding = new Map();
    this.sensoriMotorPatterns = new Map();
    this.cognitiveExtensions = [];
  }
  
  /**
   * Process input through 4E cognitive framework
   */
  async process(options) {
    const { input, relevance, context } = options;
    
    // Embodied: Ground in sensorimotor contingencies
    const embodied = this.processEmbodied(input, relevance);
    
    // Embedded: Recognize environmental coupling
    const embedded = this.processEmbedded(embodied, context);
    
    // Enacted: Bring forth through interaction
    const enacted = this.processEnacted(embedded, context);
    
    // Extended: Recognize distributed cognition
    const extended = this.processExtended(enacted, context);
    
    return {
      facts: extended.propositionalKnowledge,
      skills: extended.proceduralKnowledge,
      framing: extended.perspectivalKnowledge,
      identity: extended.participatoryKnowledge,
      fourEAnalysis: {
        embodied: embodied.analysis,
        embedded: embedded.analysis,
        enacted: enacted.analysis,
        extended: extended.analysis
      }
    };
  }
  
  /**
   * Embodied processing - grounded in body and sensorimotor patterns
   */
  processEmbodied(input, relevance) {
    return {
      somaticMarkers: this.generateSomaticMarkers(input),
      sensoriMotorPatterns: this.activateSensoriMotorPatterns(relevance),
      bodySchemaIntegration: this.integrateWithBodySchema(input),
      propositionalKnowledge: this.extractPropositional(input),
      proceduralKnowledge: this.extractProcedural(input),
      perspectivalKnowledge: this.extractPerspectival(input),
      participatoryKnowledge: this.extractParticipatory(input),
      analysis: {
        embodimentLevel: 'abstract', // Would be richer in real implementation
        somaticInfluence: 0.3
      }
    };
  }
  
  /**
   * Embedded processing - shaped by environmental coupling
   */
  processEmbedded(embodied, context) {
    const affordances = this.detectAffordances(context);
    const scaffolding = this.identifyScaffolding(context);
    
    return {
      ...embodied,
      affordances,
      scaffolding,
      contextualModulation: this.modulateByContext(embodied, context),
      analysis: {
        affordancesDetected: affordances.length,
        scaffoldingAvailable: scaffolding.length,
        environmentalCoupling: 0.6
      }
    };
  }
  
  /**
   * Enacted processing - brought forth through interaction
   */
  processEnacted(embedded, context) {
    return {
      ...embedded,
      sensoriMotorPredictions: this.generatePredictions(embedded),
      activeExploration: this.planExploration(embedded, context),
      participatoryEngagement: this.assessEngagement(embedded),
      analysis: {
        enactmentLevel: 'moderate',
        predictionAccuracy: 0.7
      }
    };
  }
  
  /**
   * Extended processing - distributed beyond individual
   */
  processExtended(enacted, context) {
    const tools = this.identifyTools(context);
    const culturalResources = this.accessCulturalResources(context);
    const socialCognition = this.processSocialCognition(context);
    
    return {
      ...enacted,
      tools,
      culturalResources,
      socialCognition,
      distributedCognition: this.assessDistribution(tools, culturalResources, socialCognition),
      analysis: {
        toolsAvailable: tools.length,
        culturalResourcesAccessed: culturalResources.length,
        socialCouplingStrength: socialCognition.strength || 0.5
      }
    };
  }
  
  // Helper methods
  
  initializeBodySchema() {
    return {
      proprioception: 'neutral',
      interoception: 'neutral',
      exteroception: 'neutral'
    };
  }
  
  generateSomaticMarkers(input) {
    // In real implementation, would generate gut feelings, intuitions
    return {
      valence: 'neutral',
      arousal: 'moderate',
      confidence: 0.5
    };
  }
  
  activateSensoriMotorPatterns(relevance) {
    const patterns = [];
    if (relevance && relevance.relevant) {
      relevance.relevant.forEach(item => {
        patterns.push({
          stimulus: item.key || 'unknown',
          response: 'attend',
          strength: item.salience || 0.5
        });
      });
    }
    return patterns;
  }
  
  integrateWithBodySchema(input) {
    // Simple integration
    return { integrated: true, quality: 'abstract' };
  }
  
  extractPropositional(input) {
    // Extract factual, explicit knowledge
    return input && typeof input === 'object' 
      ? Object.entries(input).map(([k, v]) => ({ fact: k, value: v }))
      : [];
  }
  
  extractProcedural(input) {
    // Extract skill-based, implicit knowledge
    return [];
  }
  
  extractPerspectival(input) {
    // Extract framing and salience patterns
    return { frame: 'default', salience: [] };
  }
  
  extractParticipatory(input) {
    // Extract identity and belonging aspects
    return { identity: 'observer', belonging: [] };
  }
  
  detectAffordances(context) {
    // Detect what the environment affords (Gibson)
    const affordances = [];
    
    if (context && context.environment) {
      // Simple affordance detection
      affordances.push({
        type: 'information',
        action: 'process',
        quality: 'available'
      });
    }
    
    return affordances;
  }
  
  identifyScaffolding(context) {
    // Identify environmental support structures
    return context && context.support ? [context.support] : [];
  }
  
  modulateByContext(embodied, context) {
    // Context modulates processing
    return {
      ...embodied,
      contextModulation: context ? 'active' : 'inactive'
    };
  }
  
  generatePredictions(embedded) {
    // Generate sensorimotor predictions
    return [
      {
        prediction: 'continued processing',
        confidence: 0.7
      }
    ];
  }
  
  planExploration(embedded, context) {
    // Plan active exploration of environment
    return {
      strategy: 'systematic',
      targets: embedded.affordances || []
    };
  }
  
  assessEngagement(embedded) {
    // Assess level of participatory engagement
    return {
      level: 'moderate',
      quality: 'attentive'
    };
  }
  
  identifyTools(context) {
    // Identify cognitive tools being used
    return context && context.tools ? context.tools : [];
  }
  
  accessCulturalResources(context) {
    // Access cultural knowledge and practices
    return context && context.culture ? [context.culture] : [];
  }
  
  processSocialCognition(context) {
    // Process social aspects
    return {
      strength: context && context.social ? 0.7 : 0.3,
      type: context && context.social ? context.social : 'individual'
    };
  }
  
  assessDistribution(tools, culturalResources, socialCognition) {
    // Assess how cognition is distributed
    return {
      toolUse: tools.length > 0,
      culturalEmbedding: culturalResources.length > 0,
      socialDistribution: socialCognition.strength > 0.5,
      overallDistribution: (tools.length + culturalResources.length + (socialCognition.strength > 0.5 ? 1 : 0)) / 3
    };
  }
}
