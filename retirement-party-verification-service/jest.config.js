/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/tests/**/*.test.js"],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/firebase.js",
  ],
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  testTimeout: 10000,
};
