export default {
  // Use Node.js native ESM support
  testEnvironment: "node",

  // Use experimental VM modules for ESM
  transform: {},

  // Match test files
  testMatch: ["**/tests/**/*.test.js"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/config/env.js", // Config files don't need coverage
  ],

  coverageThreshold: {
    global: {
      lines: 70,
    },
  },

  // Verbose output for CI
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};

