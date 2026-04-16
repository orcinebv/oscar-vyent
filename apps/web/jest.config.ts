export default {
  displayName: 'web',
  preset: '../../jest.preset.js',
  setupFilesAfterFramework: ['<rootDir>/src/test-setup.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: ['jest-preset-angular/build/serializers/no-ng-attributes', 'jest-preset-angular/build/serializers/ng-snapshot', 'jest-preset-angular/build/serializers/html-comment'],
  coverageDirectory: '../../coverage/apps/web',
  moduleNameMapper: {
    '^@oscar-vyent/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
  },
};
