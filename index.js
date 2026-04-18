const NemoClaw = require("./core/NemoClaw");
const Logger = require("./core/Logger");

// modules
const greetModule = require("./modules/greet.module");
const mathModule = require("./modules/math.module");

// ==============================
// BOOTSTRAP SYSTEM
// ==============================
async function bootstrap() {
  const app = new NemoClaw({
    name: "NemoClaw-AI-Core",
    version: "2.0.0"
  });

  // set log level
  Logger.setLevel("debug");

  // ==============================
  // GLOBAL EVENT LISTENERS
  // ==============================
  app.on("system:start", ({ status }) => {
    Logger.info(`[SYSTEM] Status: ${status}`);
  });

  app.on("greet:generated", (data) => {
    Logger.debug(`[EVENT] Greeting created for ${data.name}`);
  });

  app.on("math:computed", (data) => {
    Logger.debug(`[EVENT] Math result: ${data.result}`);
  });

  app.on("module:error", ({ name, error }) => {
    Logger.error(`[EVENT] Module ${name} crashed: ${error.message}`);
  });

  // ==============================
  // REGISTER MODULES
  // ==============================
  app.registerModule("greet", greetModule);
  app.registerModule("math", mathModule);

  // ==============================
  // SYSTEM INIT
  // ==============================
  await app.init();

  // ==============================
  // RUN DEMO WORKFLOW
  // ==============================
  await runDemo(app);

  return app;
}

// ==============================
// DEMO WORKFLOW (simulate real usage)
// ==============================
async function runDemo(app) {
  Logger.info("Running demo workflow...");

  // Greeting example
  const greetResult = await app.runModule("greet", {
    name: "Ra'uf",
    mood: "excited",
    style: "genz"
  });

  console.log("GREET RESULT:", greetResult);

  // Math example
  const mathResult = await app.runModule("math", {
    operation: "multiply",
    a: 7,
    b: 6
  });

  console.log("MATH RESULT:", mathResult);

  // ==============================
  // SYSTEM STATUS
  // ==============================
  Logger.info("System Status:");
  console.log(app.status());

  Logger.info("Health Check:");
  console.log(app.health());
}

// ==============================
// START SYSTEM
// ==============================
bootstrap().catch(err => {
  Logger.error(`Fatal error: ${err.message}`);
});
