const Logger = require("./Logger");
const EventBus = require("./EventBus");
const ModuleManager = require("./ModuleManager");

class NemoClaw {
  constructor(config = {}) {
    this.name = config.name || "NemoClaw-Core";
    this.version = config.version || "2.0.0";

    this.logger = Logger;
    this.events = new EventBus();
    this.modules = new ModuleManager({ eventBus: this.events });

    this.state = "idle";
    this.startTime = null;
    this.config = config;

    this._setupCoreHooks();
  }

  // ==============================
  // INTERNAL SETUP
  // ==============================
  _setupCoreHooks() {
    // Log all module executions
    this.modules.hook("afterRun", ({ name }) => {
      this.logger.debug(`[Module Completed] ${name}`);
    });

    // Event tracking
    this.events.on("module:run", ({ name, duration }) => {
      this.logger.info(`[Event] Module "${name}" ran in ${duration}ms`);
    });

    this.events.on("module:error", ({ name, error }) => {
      this.logger.error(`[Event] Module "${name}" failed: ${error.message}`);
    });
  }

  // ==============================
  // SYSTEM INIT
  // ==============================
  async init() {
    if (this.state !== "idle") {
      this.logger.warn("System already initialized or running");
      return this;
    }

    this.state = "starting";
    this.startTime = Date.now();

    this.logger.info(`${this.name} v${this.version} is starting...`);

    await this.events.emit("system:beforeStart", {
      name: this.name
    });

    this.state = "running";

    await this.events.emit("system:start", {
      status: "online",
      timestamp: this.startTime
    });

    this.logger.info("System is now running");

    return this;
  }

  // ==============================
  // SYSTEM SHUTDOWN
  // ==============================
  async shutdown() {
    if (this.state !== "running") {
      this.logger.warn("System is not running");
      return;
    }

    this.state = "stopping";

    await this.events.emit("system:shutdown");

    this.modules.clearCache();

    this.state = "stopped";

    this.logger.info("System has been shut down");
  }

  // ==============================
  // MODULE API
  // ==============================
  registerModule(name, moduleDef) {
    this.modules.register(name, moduleDef);
  }

  async runModule(name, ...args) {
    return await this.modules.run(name, ...args);
  }

  // ==============================
  // EVENT API
  // ==============================
  on(event, handler) {
    this.events.on(event, handler);
  }

  emit(event, payload) {
    return this.events.emit(event, payload);
  }

  // ==============================
  // SYSTEM STATUS
  // ==============================
  status() {
    const uptime = this.startTime
      ? `${((Date.now() - this.startTime) / 1000).toFixed(2)}s`
      : "0s";

    return {
      name: this.name,
      version: this.version,
      state: this.state,
      uptime,
      modules: this.modules.list(),
      memory: process.memoryUsage()
    };
  }

  // ==============================
  // HEALTH CHECK (important for AI systems)
  // ==============================
  health() {
    return {
      status: this.state === "running" ? "healthy" : "not_ready",
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      moduleCount: this.modules.list().length
    };
  }
}

module.exports = NemoClaw;
