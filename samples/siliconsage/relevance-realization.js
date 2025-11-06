/**
 * Relevance Realization - Core process of navigating the salience landscape
 * 
 * Realizes what is relevant moment by moment through filtering, framing,
 * feedforward, and feedback processes.
 */

export class RelevanceRealizer {
  constructor(config = {}) {
    this.config = config;
    this.salienceLandscape = new Map();
    this.attentionWeights = new Map();
  }
  
  /**
   * Realize what is relevant in a given context
   */
  async realize(input, options = {}) {
    const context = options.context || {};
    const mentalModels = options.mentalModels || new Map();
    const currentFocus = options.currentFocus || [];
    
    // Step 1: Filter - Reduce overwhelming complexity
    const filtered = this.filter(input, context);
    
    // Step 2: Frame - Structure attention to bring forth patterns
    const framed = this.frame(filtered, mentalModels);
    
    // Step 3: Feed Forward - Use current relevance to guide future processing
    const feedForward = this.feedForward(framed, currentFocus);
    
    // Step 4: Feed Back - Update based on outcomes
    const withFeedback = this.feedBack(feedForward, options.previousOutcomes);
    
    return {
      relevant: withFeedback.highSalience,
      framing: withFeedback.frame,
      attentionFocus: withFeedback.newFocus,
      filtered: withFeedback.filtered
    };
  }
  
  /**
   * Filter: Reduce complexity to manageable focus
   */
  filter(input, context) {
    // Simple filtering based on novelty and relevance to context
    const filtered = {
      novel: [],
      familiar: [],
      contextual: [],
      ignored: []
    };
    
    if (typeof input === 'object' && input !== null) {
      Object.entries(input).forEach(([key, value]) => {
        const salience = this.calculateBasicSalience(key, value, context);
        
        if (salience > 0.7) {
          filtered.novel.push({ key, value, salience });
        } else if (salience > 0.4) {
          filtered.familiar.push({ key, value, salience });
        } else if (this.isContextRelevant(key, context)) {
          filtered.contextual.push({ key, value, salience });
        } else {
          filtered.ignored.push({ key, value, salience });
        }
      });
    }
    
    return filtered;
  }
  
  /**
   * Frame: Structure attention to reveal meaningful patterns
   */
  frame(filtered, mentalModels) {
    const frames = [];
    
    // Generate potential frames based on mental models
    for (const [domain, model] of mentalModels.entries()) {
      const frame = {
        domain,
        perspective: model.perspective || 'neutral',
        patterns: this.detectPatterns(filtered, model),
        confidence: model.confidence || 0.5
      };
      frames.push(frame);
    }
    
    // Select most relevant frame
    const selectedFrame = frames.length > 0
      ? frames.reduce((best, frame) => 
          frame.confidence > best.confidence ? frame : best
        )
      : { domain: 'general', perspective: 'open', patterns: [], confidence: 0.5 };
    
    return {
      frame: selectedFrame,
      alternativeFrames: frames.filter(f => f !== selectedFrame),
      framedContent: this.applyFrame(filtered, selectedFrame)
    };
  }
  
  /**
   * Feed Forward: Guide future processing with current relevance
   */
  feedForward(framed, currentFocus) {
    const newFocus = [];
    
    // Maintain continuity with current focus
    currentFocus.forEach(focus => {
      if (this.isStillRelevant(focus, framed)) {
        newFocus.push({
          ...focus,
          persistence: (focus.persistence || 0) + 1
        });
      }
    });
    
    // Add new focal points from framed content
    if (framed.framedContent && framed.framedContent.novel) {
      framed.framedContent.novel.forEach(item => {
        newFocus.push({
          item,
          source: 'novel',
          persistence: 1
        });
      });
    }
    
    return {
      ...framed,
      newFocus,
      anticipations: this.generateAnticipations(newFocus)
    };
  }
  
  /**
   * Feed Back: Update based on outcomes and learning
   */
  feedBack(feedForward, previousOutcomes) {
    if (!previousOutcomes || previousOutcomes.length === 0) {
      return {
        ...feedForward,
        highSalience: feedForward.newFocus.map(f => f.item),
        filtered: feedForward.framedContent
      };
    }
    
    // Adjust salience based on outcomes
    const adjusted = this.adjustSalienceFromOutcomes(
      feedForward.newFocus,
      previousOutcomes
    );
    
    return {
      ...feedForward,
      newFocus: adjusted,
      highSalience: adjusted.filter(f => f.salience > 0.6).map(f => f.item),
      filtered: feedForward.framedContent
    };
  }
  
  /**
   * Calculate basic salience score
   */
  calculateBasicSalience(key, value, context) {
    let salience = 0.5; // Default neutral salience
    
    // Increase salience for novel information
    if (!this.salienceLandscape.has(key)) {
      salience += 0.3;
    }
    
    // Increase salience for context-relevant information
    if (context && this.isContextRelevant(key, context)) {
      salience += 0.2;
    }
    
    // Update landscape
    this.salienceLandscape.set(key, {
      lastSeen: Date.now(),
      frequency: (this.salienceLandscape.get(key)?.frequency || 0) + 1
    });
    
    return Math.min(1.0, salience);
  }
  
  /**
   * Check if key is relevant to context
   */
  isContextRelevant(key, context) {
    if (!context || typeof context !== 'object') return false;
    
    // Check if key appears in context values
    const contextStr = JSON.stringify(context).toLowerCase();
    return contextStr.includes(key.toLowerCase());
  }
  
  /**
   * Detect patterns in filtered content using mental model
   */
  detectPatterns(filtered, model) {
    const patterns = [];
    
    // Look for patterns in novel items
    if (filtered.novel && filtered.novel.length > 1) {
      patterns.push({
        type: 'cluster',
        items: filtered.novel.map(n => n.key),
        confidence: 0.6
      });
    }
    
    return patterns;
  }
  
  /**
   * Apply frame to filtered content
   */
  applyFrame(filtered, frame) {
    // Frame influences what we see
    return {
      ...filtered,
      perspective: frame.perspective,
      emphasized: this.emphasizeByFrame(filtered, frame)
    };
  }
  
  /**
   * Emphasize elements based on frame
   */
  emphasizeByFrame(filtered, frame) {
    // Simple implementation: boost salience of items matching frame domain
    return filtered.novel.map(item => ({
      ...item,
      salience: item.key.includes(frame.domain) 
        ? Math.min(1.0, item.salience + 0.2)
        : item.salience
    }));
  }
  
  /**
   * Check if focus item is still relevant
   */
  isStillRelevant(focus, framed) {
    // Persist focus items that appear in current frame
    if (!framed.framedContent) return false;
    
    const allItems = [
      ...(framed.framedContent.novel || []),
      ...(framed.framedContent.familiar || []),
      ...(framed.framedContent.contextual || [])
    ];
    
    return allItems.some(item => 
      item.key === focus.item?.key || 
      JSON.stringify(item) === JSON.stringify(focus.item)
    );
  }
  
  /**
   * Generate anticipations based on focus
   */
  generateAnticipations(focus) {
    // Predict what might be relevant next
    return focus.map(f => ({
      anticipated: `follow-up to ${f.item?.key || 'unknown'}`,
      confidence: 0.5
    }));
  }
  
  /**
   * Adjust salience based on outcomes
   */
  adjustSalienceFromOutcomes(focus, outcomes) {
    return focus.map(f => {
      // If item led to good outcomes, boost salience
      const relatedOutcome = outcomes.find(o => 
        o.focus === f.item?.key
      );
      
      if (relatedOutcome) {
        return {
          ...f,
          salience: relatedOutcome.success 
            ? Math.min(1.0, (f.item?.salience || 0.5) + 0.2)
            : Math.max(0.0, (f.item?.salience || 0.5) - 0.1)
        };
      }
      
      return f;
    });
  }
}
