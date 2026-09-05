/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},
  rootDir: "../",
  testMatch: ["<rootDir>/evaluation/**/*.test.js"],
  moduleDirectories: [
    "node_modules",
    "<rootDir>/retirement-party-verification-service/node_modules",
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  verbose: true,
  testTimeout: 30000,
};

