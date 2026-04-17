class Logger {
  static currentLevel = "info";

  static LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  // Change global log level safely
  static setLevel(level) {
    if (!(level in this.LEVELS)) {
      this.error(`Invalid log level provided: ${level}`);
      return;
    }

    this.currentLevel = level;
    this.info(`Log level updated to: ${level}`);
  }

  // Get ISO timestamp
  static getTimestamp() {
    return new Date().toISOString();
  }

  // Check if message should be printed
  static canLog(level) {
    return this.LEVELS[level] >= this.LEVELS[this.currentLevel];
  }

  // Core formatter (centralized formatting system)
  static format(level, message) {
    return `[${this.getTimestamp()}] [${level.toUpperCase()}] ${message}`;
  }

  // Internal output handler (future extensibility point)
  static output(level, message, stream = "log") {
    const formatted = this.format(level, message);

    if (stream === "error") {
      console.error(formatted);
    } else if (stream === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  static debug(message) {
    if (!this.canLog("debug")) return;
    this.output("debug", message);
  }

  static info(message) {
    if (!this.canLog("info")) return;
    this.output("info", message);
  }

  static warn(message) {
    if (!this.canLog("warn")) return;
    this.output("warn", message, "warn");
  }

  static error(message) {
    if (!this.canLog("error")) return;
    this.output("error", message, "error");
  }

  // Structured object logging (AI / debugging friendly)
  static object(label, obj) {
    if (!this.canLog("debug")) return;

    const formatted =
      `${this.format("debug", label)}\n` +
      JSON.stringify(obj, null, 2);

    console.log(formatted);
  }

  // Future-ready hook system (for AI, file logs, telemetry)
  static hook = null;

  static setHook(fn) {
    if (typeof fn !== "function") {
      this.error("Logger hook must be a function");
      return;
    }

    this.hook = fn;
    this.info("Logger hook attached");
  }

  static emit(level, message) {
    if (this.hook) {
      this.hook({ level, message, time: this.getTimestamp() });
    }
  }
}

module.exports = Logger;
