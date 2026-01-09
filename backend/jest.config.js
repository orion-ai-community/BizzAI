export default {
    testEnvironment: "node",
    transform: {}, // Disable transforms for ESM
    verbose: true,
    testMatch: ["**/tests/**/*.test.js"],
    collectCoverage: true,
    collectCoverageFrom: ["./**/*.js", "!**/node_modules/**", "!**/config/**", "!**/coverage/**"],
};
