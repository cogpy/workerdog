using Workerd = import "/workerd/workerd.capnp";

# SiliconSage Extension - An autonomous multi-agent orchestration workbench
# Integrates OpenCog Prime, OpenCog Hyperon, and Vervaeke's wisdom framework

const extension :Workerd.Extension = (
  modules = [
    # Public API modules - importable by users
    ( name = "siliconsage:core", esModule = embed "core.js" ),
    ( name = "siliconsage:agent", esModule = embed "agent.js" ),
    ( name = "siliconsage:orchestrator", esModule = embed "orchestrator.js" ),
    ( name = "siliconsage:cognitive-framework", esModule = embed "cognitive-framework.js" ),
    
    # Internal modules - used for bindings and implementation
    ( name = "siliconsage-internal:relevance-realization", esModule = embed "relevance-realization.js", internal = true ),
    ( name = "siliconsage-internal:four-e-cognition", esModule = embed "four-e-cognition.js", internal = true ),
    ( name = "siliconsage-internal:ways-of-knowing", esModule = embed "ways-of-knowing.js", internal = true ),
    ( name = "siliconsage-internal:wisdom-cultivation", esModule = embed "wisdom-cultivation.js", internal = true ),
    ( name = "siliconsage-internal:binding", esModule = embed "binding.js", internal = true ),
  ]
);
