export default {
  moduleFileExtensions: ['mjs', 'js'],
  testMatch: ['**/tests/*.test.mjs'],
  testEnvironment: 'node',
  coverageReporters: ['json-summary', 'text', 'lcov'],
  coverageDirectory: './reports',
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: 'reports',
        outputName: 'test-report.xml',
        relativeRootDir: './',
        reportedFilePath: 'relative'
      }
    ]
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    }
  }
}
