module.exports = {
  meta: {
    name: "greet",
    version: "2.0.0",
    description: "Smart greeting module with context awareness",
    author: "Ra'uf",
    cache: false
  },

  dependencies: [],

  run: async (ctx, input = {}) => {
    const { logger, eventBus } = ctx;

    // Normalize input
    const {
      name = "User",
      time = new Date(),
      mood = "neutral",
      style = "default"
    } = typeof input === "string"
      ? { name: input }
      : input;

    // Determine time-based greeting
    const hour = new Date(time).getHours();
    let timeGreeting = "Hello";

    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    // Mood-based variation
    const moodMap = {
      happy: "😊 Great to see you!",
      sad: "💛 Hope you're doing okay.",
      angry: "😌 Take it easy, you've got this.",
      excited: "🚀 Love the energy!",
      neutral: ""
    };

    // Style variations (future AI personality hook)
    const styleMap = {
      default: `${timeGreeting}, ${name}.`,
      formal: `${timeGreeting}, ${name}. It is a pleasure to meet you.`,
      casual: `Yo ${name}! ${timeGreeting.toLowerCase()} 😎`,
      genz: `${timeGreeting} ${name} 👀 what's good?`,
      ai: `[SYSTEM GREETING]: ${timeGreeting.toUpperCase()} ${name}`
    };

    const baseGreeting = styleMap[style] || styleMap.default;
    const moodText = moodMap[mood] || "";

    const message = `${baseGreeting} ${moodText}`.trim();

    // Logging
    logger.debug(`Greeting generated for ${name}`);

    // Emit event (for analytics / AI tracking)
    if (eventBus) {
      await eventBus.emit("greet:generated", {
        name,
        mood,
        style,
        message,
        timestamp: Date.now()
      });
    }

    // Return structured response (important for AI systems)
    return {
      success: true,
      message,
      meta: {
        name,
        mood,
        style,
        generatedAt: new Date().toISOString()
      }
    };
  }
};
