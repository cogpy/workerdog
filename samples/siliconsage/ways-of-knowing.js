/**
 * Ways of Knowing - The four fundamental ways humans know reality
 * 
 * Integrates:
 * - Propositional (knowing-that): facts, beliefs, theories
 * - Procedural (knowing-how): skills, abilities, competencies
 * - Perspectival (knowing-as): framing, aspect perception, salience
 * - Participatory (knowing-by-being): identity, conformity, transformation
 */

export class WaysOfKnowing {
  constructor(config = {}) {
    this.config = config;
    this.propositionalKnowledge = new Map();
    this.proceduralKnowledge = new Map();
    this.perspectivalFrames = [];
    this.participatoryIdentities = new Set();
  }
  
  /**
   * Integrate all four ways of knowing
   */
  async integrate(knowledge) {
    const {
      propositional = [],
      procedural = [],
      perspectival = {},
      participatory = {}
    } = knowledge;
    
    // Process each way of knowing
    const processedPropositional = this.processPropositional(propositional);
    const processedProcedural = this.processProcedural(procedural);
    const processedPerspectival = this.processPerspectival(perspectival);
    const processedParticipatory = this.processParticipatory(participatory);
    
    // Integrate across ways of knowing
    const integrated = this.integrateAllWays({
      propositional: processedPropositional,
      procedural: processedProcedural,
      perspectival: processedPerspectival,
      participatory: processedParticipatory
    });
    
    return {
      ...integrated,
      waysDeveloped: this.assessDevelopment()
    };
  }
  
  /**
   * Process propositional knowing (knowing-that)
   */
  processPropositional(facts) {
    const processed = {
      facts: [],
      beliefs: [],
      theories: [],
      confidence: 0.5
    };
    
    if (Array.isArray(facts)) {
      facts.forEach(fact => {
        if (typeof fact === 'object' && fact !== null) {
          this.propositionalKnowledge.set(
            fact.fact || JSON.stringify(fact),
            {
              value: fact.value,
              confidence: fact.confidence || 0.7,
              source: fact.source || 'derived',
              timestamp: Date.now()
            }
          );
          processed.facts.push(fact);
        }
      });
    }
    
    processed.confidence = processed.facts.length > 0 ? 0.7 : 0.3;
    
    return processed;
  }
  
  /**
   * Process procedural knowing (knowing-how)
   */
  processProcedural(skills) {
    const processed = {
      skills: [],
      competencies: [],
      proficiency: 0.5
    };
    
    if (Array.isArray(skills)) {
      skills.forEach(skill => {
        const skillKey = typeof skill === 'string' ? skill : skill.name;
        const proficiency = skill.proficiency || 0.5;
        
        this.proceduralKnowledge.set(skillKey, {
          proficiency,
          practice: (this.proceduralKnowledge.get(skillKey)?.practice || 0) + 1,
          lastPracticed: Date.now()
        });
        
        processed.skills.push({
          name: skillKey,
          proficiency
        });
      });
    }
    
    if (processed.skills.length > 0) {
      processed.proficiency = processed.skills.reduce((sum, s) => sum + s.proficiency, 0) / processed.skills.length;
    }
    
    return processed;
  }
  
  /**
   * Process perspectival knowing (knowing-as)
   */
  processPerspectival(framing) {
    const processed = {
      frames: [],
      aspectPerception: [],
      saliencePatterns: [],
      optimalGrip: 0.5
    };
    
    if (framing && typeof framing === 'object') {
      // Extract frame
      const frame = {
        perspective: framing.frame || 'neutral',
        salience: framing.salience || [],
        aspectsSeen: framing.aspectsSeen || [],
        timestamp: Date.now()
      };
      
      this.perspectivalFrames.push(frame);
      processed.frames.push(frame);
      
      // Assess optimal grip (appropriate engagement with situation)
      processed.optimalGrip = this.assessOptimalGrip(frame);
    }
    
    return processed;
  }
  
  /**
   * Process participatory knowing (knowing-by-being)
   */
  processParticipatory(identity) {
    const processed = {
      identities: [],
      belongings: [],
      transformations: [],
      agape: 0.5 // Degree of loving engagement
    };
    
    if (identity && typeof identity === 'object') {
      // Extract identity
      const identityStr = identity.identity || 'observer';
      this.participatoryIdentities.add(identityStr);
      
      processed.identities.push({
        role: identityStr,
        belonging: identity.belonging || [],
        depth: identity.depth || 0.5
      });
      
      // Assess agapic love (caring, participatory engagement)
      processed.agape = this.assessAgape(identity);
    }
    
    return processed;
  }
  
  /**
   * Integrate all ways of knowing
   */
  integrateAllWays(processed) {
    // Integration creates emergent understanding
    return {
      propositional: processed.propositional,
      procedural: processed.procedural,
      perspectival: processed.perspectival,
      participatory: processed.participatory,
      
      // Emergent integrated understanding
      integration: {
        coherence: this.assessIntegrationCoherence(processed),
        depth: this.assessIntegrationDepth(processed),
        wisdom: this.assessWisdomEmergence(processed)
      },
      
      // How knowledge informs action
      actionGuidance: this.generateActionGuidance(processed)
    };
  }
  
  /**
   * Assess optimal grip - appropriate engagement with situation
   */
  assessOptimalGrip(frame) {
    // Optimal grip is finding the right distance/engagement
    // Too close = missing big picture, too far = missing detail
    return 0.6; // Simplified
  }
  
  /**
   * Assess agape - loving, caring engagement
   */
  assessAgape(identity) {
    // Agape is selfless love, deep care and connection
    const depth = identity.depth || 0.5;
    const belongingCount = identity.belonging?.length || 0;
    
    return Math.min(1.0, (depth + belongingCount * 0.1));
  }
  
  /**
   * Assess how well ways of knowing are integrated
   */
  assessIntegrationCoherence(processed) {
    // Check if different ways point to same understanding
    const waysPresent = [
      processed.propositional.facts.length > 0,
      processed.procedural.skills.length > 0,
      processed.perspectival.frames.length > 0,
      processed.participatory.identities.length > 0
    ].filter(Boolean).length;
    
    return waysPresent / 4; // More ways integrated = higher coherence
  }
  
  /**
   * Assess depth of integration
   */
  assessIntegrationDepth(processed) {
    // Deeper integration means transformative understanding
    const depths = [
      processed.propositional.confidence || 0,
      processed.procedural.proficiency || 0,
      processed.perspectival.optimalGrip || 0,
      processed.participatory.agape || 0
    ];
    
    return depths.reduce((sum, d) => sum + d, 0) / depths.length;
  }
  
  /**
   * Assess emergence of wisdom from integration
   */
  assessWisdomEmergence(processed) {
    const coherence = this.assessIntegrationCoherence(processed);
    const depth = this.assessIntegrationDepth(processed);
    
    // Wisdom emerges from coherent, deep integration
    return (coherence + depth) / 2;
  }
  
  /**
   * Generate action guidance from integrated knowing
   */
  generateActionGuidance(processed) {
    return {
      whatToKnow: processed.propositional.facts.map(f => f.fact),
      howToAct: processed.procedural.skills.map(s => s.name),
      howToFrame: processed.perspectival.frames.map(f => f.perspective),
      howToBe: processed.participatory.identities.map(i => i.role),
      
      recommendation: this.synthesizeRecommendation(processed)
    };
  }
  
  /**
   * Synthesize recommendation from all ways of knowing
   */
  synthesizeRecommendation(processed) {
    // In practice, would be more sophisticated
    return {
      action: 'Engage with situation using integrated understanding',
      reasoning: 'Based on facts, skills, framing, and identity',
      confidence: this.assessWisdomEmergence(processed)
    };
  }
  
  /**
   * Assess development of each way of knowing
   */
  assessDevelopment() {
    return {
      propositional: {
        developed: this.propositionalKnowledge.size > 0,
        depth: Math.min(1.0, this.propositionalKnowledge.size / 10)
      },
      procedural: {
        developed: this.proceduralKnowledge.size > 0,
        depth: Math.min(1.0, this.proceduralKnowledge.size / 10)
      },
      perspectival: {
        developed: this.perspectivalFrames.length > 0,
        depth: Math.min(1.0, this.perspectivalFrames.length / 5)
      },
      participatory: {
        developed: this.participatoryIdentities.size > 0,
        depth: Math.min(1.0, this.participatoryIdentities.size / 3)
      }
    };
  }
}
