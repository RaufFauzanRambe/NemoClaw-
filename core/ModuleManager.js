const Logger = require("./Logger");

class ModuleManager {
  constructor({ eventBus = null } = {}) {
    this.modules = new Map();
    this.cache = new Map();
    this.eventBus = eventBus;

    this.hooks = {
      beforeRegister: [],
      afterRegister: [],
      beforeRun: [],
      afterRun: [],
      onError: []
    };
  }

  // ==============================
  // REGISTER MODULE
  // ==============================
  register(name, moduleDef) {
    if (this.modules.has(name)) {
      Logger.warn(`Module "${name}" already exists. Overwriting...`);
    }

    let fn, meta = {}, dependencies = [];

    // Support function OR object-style modules
    if (typeof moduleDef === "function") {
      fn = moduleDef;
    } else if (typeof moduleDef === "object") {
      fn = moduleDef.run;
      meta = moduleDef.meta || {};
      dependencies = moduleDef.dependencies || [];
    }

    if (typeof fn !== "function") {
      Logger.error(`Invalid module "${name}" (missing run function)`);
      return;
    }

    const module = {
      name,
      fn,
      dependencies,
      meta: {
        version: meta.version || "1.0.0",
        description: meta.description || "",
        author: meta.author || "unknown",
        cache: meta.cache || false,
        createdAt: new Date().toISOString()
      }
    };

    this.runHooks("beforeRegister", module);

    this.modules.set(name, module);

    this.runHooks("afterRegister", module);

    Logger.info(`Module registered: ${name}`);
  }

  // ==============================
  // DEPENDENCY CHECK
  // ==============================
  checkDependencies(module) {
    for (const dep of module.dependencies) {
      if (!this.modules.has(dep)) {
        throw new Error(
          `Missing dependency "${dep}" for module "${module.name}"`
        );
      }
    }
  }

  // ==============================
  // RUN MODULE
  // ==============================
  async run(name, ...args) {
    const module = this.modules.get(name);

    if (!module) {
      Logger.error(`Module not found: ${name}`);
      return null;
    }

    const start = performance.now();

    try {
      this.checkDependencies(module);

      // cache check
      if (module.meta.cache && this.cache.has(name)) {
        Logger.debug(`Cache hit: ${name}`);
        return this.cache.get(name);
      }

      await this.runHooks("beforeRun", { name, args });

      // dependency injection (basic)
      const context = {
        modules: this,
        eventBus: this.eventBus,
        logger: Logger
      };

      const result = await module.fn(context, ...args);

      if (module.meta.cache) {
        this.cache.set(name, result);
      }

      await this.runHooks("afterRun", { name, result });

      const duration = (performance.now() - start).toFixed(2);

      Logger.info(`Module "${name}" executed in ${duration}ms`);

      // emit event
      if (this.eventBus) {
        this.eventBus.emit("module:run", { name, duration });
      }

      return result;
    } catch (err) {
      Logger.error(`Module "${name}" failed: ${err.message}`);

      await this.runHooks("onError", { name, error: err });

      if (this.eventBus) {
        this.eventBus.emit("module:error", { name, error: err });
      }

      return null;
    }
  }

  // ==============================
  // HOOK SYSTEM
  // ==============================
  hook(type, fn) {
    if (!this.hooks[type]) {
      Logger.error(`Invalid hook type: ${type}`);
      return;
    }

    this.hooks[type].push(fn);
  }

  async runHooks(type, payload) {
    for (const fn of this.hooks[type]) {
      try {
        await fn(payload);
      } catch (err) {
        Logger.error(`Hook error (${type}): ${err.message}`);
      }
    }
  }

  // ==============================
  // CACHE CONTROL
  // ==============================
  clearCache(name = null) {
    if (name) {
      this.cache.delete(name);
      Logger.debug(`Cache cleared for ${name}`);
    } else {
      this.cache.clear();
      Logger.debug("All cache cleared");
    }
  }

  // ==============================
  // MODULE CONTROL
  // ==============================
  unregister(name) {
    if (!this.modules.has(name)) {
      Logger.warn(`Module "${name}" not found`);
      return;
    }

    this.modules.delete(name);
    this.cache.delete(name);

    Logger.info(`Module removed: ${name}`);
  }

  has(name) {
    return this.modules.has(name);
  }

  get(name) {
    return this.modules.get(name);
  }

  list() {
    return [...this.modules.values()].map(m => ({
      name: m.name,
      version: m.meta.version,
      dependencies: m.dependencies
    }));
  }
}

module.exports = ModuleManager;
