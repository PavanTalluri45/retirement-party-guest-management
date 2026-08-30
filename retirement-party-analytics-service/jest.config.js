/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
  ],
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  testTimeout: 10000,
};

