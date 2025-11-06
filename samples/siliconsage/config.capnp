using Workerd = import "/workerd/workerd.capnp";
using SiliconSage = import "siliconsage.capnp";

# SiliconSage Demo Configuration
# Demonstrates the multi-agent orchestration workbench

const config :Workerd.Config = (
  services = [
    (name = "main", worker = .demoWorker),
  ],
  
  sockets = [
    ( name = "http",
      address = "*:8080",
      http = (),
      service = "main"
    ),
  ],
  
  extensions = [ SiliconSage.extension ],
);

const demoWorker :Workerd.Worker = (
  modules = [
    (name = "worker", esModule = embed "demo-worker.js")
  ],
  
  compatibilityDate = "2024-11-06",
  
  bindings = [
    # SiliconSage orchestrator as a wrapped binding
    (
      name = "sage",
      wrapped = (
        moduleName = "siliconsage-internal:binding",
        innerBindings = [(
          name = "config",
          json = embed "sage-config.json"
        )],
      )
    )
  ],
);
