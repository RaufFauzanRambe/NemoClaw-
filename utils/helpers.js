const crypto = require("crypto");

const Helpers = {
  generateId(prefix = "id") {
    const random = crypto.randomBytes(4).toString("hex");
    return `${prefix}_${Date.now()}_${random}`;
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  throttle(fn, limit = 300) {
    let lastCall = 0;

    return (...args) => {
      const now = Date.now();

      if (now - lastCall >= limit) {
        lastCall = now;
        fn(...args);
      }
    };
  },

  async retry(fn, retries = 3, delay = 500) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(res => setTimeout(res, delay));
      }
    }
  },

  async measureTime(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    return {
      result,
      duration: `${(end - start).toFixed(2)}ms`
    };
  },

  isEmpty(value) {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" && Object.keys(value).length === 0)
    );
  },

  isNumber(value) {
    return typeof value === "number" && !isNaN(value);
  },

  isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  },

  get(obj, path, defaultValue = null) {
    try {
      return path
        .split(".")
        .reduce((acc, key) => acc?.[key], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  capitalize(str = "") {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  toCamelCase(str = "") {
    return str
      .toLowerCase()
      .replace(/[-_ ]+(\w)/g, (_, c) => c.toUpperCase());
  },

  randomInt(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomChoice(arr = []) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  },

  sleep(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

module.exports = Helpers;
