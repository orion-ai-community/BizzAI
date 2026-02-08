export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'utils/**/*.js',
        'middlewares/**/*.js',
        'models/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/migrations/**',
        '!**/config/**'
    ],
    coverageThreshold: {
        global: {
            statements: 5,
            branches: 5,
            functions: 5,
            lines: 5
        }
    },
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.js'],
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
