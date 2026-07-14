/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/env.setup.ts'],
  testRegex: '.*(\\.spec|\\.e2e-spec)\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text', 'json-summary', 'html'],
};
