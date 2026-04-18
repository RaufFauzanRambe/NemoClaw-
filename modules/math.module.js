module.exports = {
  meta: {
    name: "math",
    version: "2.0.0",
    description: "Advanced math computation module with validation & analytics",
    author: "Ra'uf",
    cache: false
  },

  dependencies: [],

  run: async (ctx, input = {}) => {
    const { logger, eventBus } = ctx;

    const {
      operation,
      a,
      b
    } = input;

    // validation
    if (!operation) {
      return error("Operation is required");
    }

    if (typeof a !== "number" || typeof b !== "number") {
      return error("Inputs must be numbers");
    }

    let result;

    try {
      switch (operation) {
        case "add":
          result = a + b;
          break;
        case "subtract":
          result = a - b;
          break;
        case "multiply":
          result = a * b;
          break;
        case "divide":
          if (b === 0) throw new Error("Division by zero");
          result = a / b;
          break;
        case "power":
          result = Math.pow(a, b);
          break;
        default:
          return error(`Unknown operation: ${operation}`);
      }

      logger.debug(`Math operation "${operation}" executed`);

      // emit analytics event
      if (eventBus) {
        await eventBus.emit("math:computed", {
          operation,
          inputs: { a, b },
          result,
          timestamp: Date.now()
        });
      }

      return {
        success: true,
        result,
        meta: {
          operation,
          inputs: { a, b },
          computedAt: new Date().toISOString()
        }
      };

    } catch (err) {
      logger.error(`Math error: ${err.message}`);

      if (eventBus) {
        await eventBus.emit("math:error", {
          operation,
          error: err.message
        });
      }

      return error(err.message);
    }

    function error(message) {
      return {
        success: false,
        error: message
      };
    }
  }
};
