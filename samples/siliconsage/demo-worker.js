/**
 * SiliconSage Demo Worker
 * 
 * Demonstrates the autonomous multi-agent orchestration workbench
 * using the SiliconSage extension for workerd.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Route handling
    if (url.pathname === '/') {
      return handleHome();
    } else if (url.pathname === '/create-agent') {
      return handleCreateAgent(env, request);
    } else if (url.pathname === '/assign-task') {
      return handleAssignTask(env, request);
    } else if (url.pathname === '/status') {
      return handleStatus(env);
    } else if (url.pathname === '/demo') {
      return handleDemo(env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Home page
 */
function handleHome() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>SiliconSage - Autonomous Multi-Agent Orchestration Workbench</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
    }
    .container {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    h1 {
      color: #667eea;
      border-bottom: 3px solid #764ba2;
      padding-bottom: 10px;
    }
    h2 {
      color: #764ba2;
      margin-top: 30px;
    }
    .feature {
      background: #f7f7f7;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
    }
    .api-endpoint {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 10px;
      margin: 10px 0;
      font-family: monospace;
      border-radius: 5px;
    }
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin: 5px;
    }
    button:hover {
      background: #764ba2;
    }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 SiliconSage v5.0</h1>
    <p><strong>Autonomous Multi-Agent Orchestration Workbench for workerd</strong></p>
    
    <h2>About</h2>
    <p>SiliconSage integrates:</p>
    <ul>
      <li><strong>OpenCog Prime</strong> - Cognitive synergy and multi-subsystem integration</li>
      <li><strong>OpenCog Hyperon</strong> - Meta-learning and self-reflection capabilities</li>
      <li><strong>Vervaeke Framework</strong> - Wisdom cultivation through 4E cognition and multiple ways of knowing</li>
    </ul>
    
    <h2>Core Features</h2>
    
    <div class="feature">
      <strong>🎯 Relevance Realization</strong>
      <p>Dynamic navigation of the salience landscape through filtering, framing, feedforward, and feedback</p>
    </div>
    
    <div class="feature">
      <strong>🌍 4E Cognition</strong>
      <p>Embodied, Embedded, Enacted, and Extended cognitive processing</p>
    </div>
    
    <div class="feature">
      <strong>🧩 Four Ways of Knowing</strong>
      <p>Propositional (knowing-that), Procedural (knowing-how), Perspectival (knowing-as), Participatory (knowing-by-being)</p>
    </div>
    
    <div class="feature">
      <strong>🌟 Wisdom Cultivation</strong>
      <p>The Three M's: Morality, Meaning in Life, and Mastery</p>
    </div>
    
    <div class="feature">
      <strong>🤝 Multi-Agent Orchestration</strong>
      <p>Coordinate multiple autonomous agents for collaborative problem-solving</p>
    </div>
    
    <h2>API Endpoints</h2>
    
    <div class="api-endpoint">
      <strong>GET /status</strong> - Get orchestrator status
    </div>
    
    <div class="api-endpoint">
      <strong>POST /create-agent</strong> - Create a new agent<br>
      Body: { "name": "AgentName", "role": "specialist", "capabilities": ["thinking", "analysis"] }
    </div>
    
    <div class="api-endpoint">
      <strong>POST /assign-task</strong> - Assign task to agents<br>
      Body: { "type": "collaborative", "description": "Task description" }
    </div>
    
    <div class="api-endpoint">
      <strong>GET /demo</strong> - Run a demonstration of multi-agent collaboration
    </div>
    
    <h2>Quick Demo</h2>
    <button onclick="runDemo()">Run Demo</button>
    <button onclick="checkStatus()">Check Status</button>
    
    <pre id="output">Click a button to see results...</pre>
    
    <h2>Philosophy</h2>
    <blockquote style="font-style: italic; border-left: 3px solid #667eea; padding-left: 15px;">
      "Wisdom begins in wonder." - Socrates<br><br>
      "The meaning crisis can only be addressed through the cultivation of wisdom and the realization of meaning." - John Vervaeke<br><br>
      "SiliconSage: Where silicon meets sophia."
    </blockquote>
  </div>
  
  <script>
    async function runDemo() {
      const output = document.getElementById('output');
      output.textContent = 'Running demo...';
      
      const response = await fetch('/demo');
      const result = await response.json();
      output.textContent = JSON.stringify(result, null, 2);
    }
    
    async function checkStatus() {
      const output = document.getElementById('output');
      output.textContent = 'Checking status...';
      
      const response = await fetch('/status');
      const result = await response.json();
      output.textContent = JSON.stringify(result, null, 2);
    }
  </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * Create a new agent
 */
async function handleCreateAgent(env, request) {
  try {
    const body = await request.json();
    const agent = env.sage.createAgent({
      name: body.name || 'Agent',
      role: body.role || 'generalist',
      capabilities: body.capabilities || []
    });
    
    return jsonResponse({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        capabilities: agent.capabilities
      }
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Assign task to agents
 */
async function handleAssignTask(env, request) {
  try {
    const body = await request.json();
    const result = await env.sage.assignTask({
      type: body.type || 'generic',
      description: body.description || 'Task',
      requiredRole: body.requiredRole,
      requiredCapabilities: body.requiredCapabilities
    });
    
    return jsonResponse({
      success: true,
      result
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Get orchestrator status
 */
function handleStatus(env) {
  const status = env.sage.getStatus();
  return jsonResponse(status);
}

/**
 * Run demonstration
 */
async function handleDemo(env) {
  try {
    // Create three specialized agents
    const researcher = env.sage.createAgent({
      name: 'Sophia',
      role: 'researcher',
      capabilities: ['analysis', 'pattern-recognition', 'synthesis']
    });
    
    const engineer = env.sage.createAgent({
      name: 'Atlas',
      role: 'engineer',
      capabilities: ['implementation', 'optimization', 'testing']
    });
    
    const philosopher = env.sage.createAgent({
      name: 'Socrates',
      role: 'philosopher',
      capabilities: ['questioning', 'wisdom-cultivation', 'meaning-making']
    });
    
    // Assign a collaborative task
    const task = await env.sage.assignTask({
      type: 'collaborative',
      description: 'Explore the nature of intelligence and wisdom',
      requiredCapabilities: ['analysis', 'questioning'],
      maxAgents: 3
    });
    
    // Get final status
    const finalStatus = env.sage.getStatus();
    
    return jsonResponse({
      success: true,
      demo: 'Multi-agent collaboration demonstration',
      agents: {
        researcher: { id: researcher.id, name: researcher.name, role: researcher.role },
        engineer: { id: engineer.id, name: engineer.name, role: engineer.role },
        philosopher: { id: philosopher.id, name: philosopher.name, role: philosopher.role }
      },
      task,
      finalStatus,
      insights: [
        'Three agents with different specializations collaborated on understanding intelligence',
        'Emergent insights arose from the interaction of different perspectives',
        'The system cultivated collective wisdom through integrated knowing',
        'This demonstrates autonomous multi-agent orchestration in action'
      ]
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

/**
 * Helper: JSON response
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
