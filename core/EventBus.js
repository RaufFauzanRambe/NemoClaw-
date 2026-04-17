class EventBus {
  constructor() {
    this.events = new Map();
    this.middlewares = [];
  }

  // Register event listener
  on(event, callback) {
    if (typeof callback !== "function") {
      throw new Error(`Listener for "${event}" must be a function`);
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event).push({
      callback,
      once: false
    });
  }

  // One-time listener
  once(event, callback) {
    if (typeof callback !== "function") {
      throw new Error(`Listener for "${event}" must be a function`);
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event).push({
      callback,
      once: true
    });
  }

  // Remove listener
  off(event, callback) {
    if (!this.events.has(event)) return;

    const filtered = this.events
      .get(event)
      .filter(listener => listener.callback !== callback);

    this.events.set(event, filtered);
  }

  // Add middleware (runs before emit)
  use(fn) {
    if (typeof fn !== "function") {
      throw new Error("Middleware must be a function");
    }

    this.middlewares.push(fn);
  }

  // Internal: run middleware chain
  async runMiddlewares(event, data) {
    let payload = data;

    for (const fn of this.middlewares) {
      payload = await fn(event, payload);
    }

    return payload;
  }

  // Emit event (sync + async safe)
  async emit(event, data) {
    if (!this.events.has(event)) return;

    // Run middleware pipeline
    const processedData = await this.runMiddlewares(event, data);

    const listeners = this.events.get(event);

    for (const listener of listeners) {
      try {
        await listener.callback(processedData);

        // auto-remove once listeners
        if (listener.once) {
          this.off(event, listener.callback);
        }
      } catch (err) {
        // prevent crash of entire system
        console.error(
          `[EventBus] Error in event "${event}":`,
          err.message
        );
      }
    }
  }

  // Clear all listeners or specific event
  clear(event = null) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  // Get event info (debugging / AI systems)
  info() {
    const summary = {};

    for (const [event, listeners] of this.events.entries()) {
      summary[event] = listeners.length;
    }

    return summary;
  }
}

module.exports = EventBus;
