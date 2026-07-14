import baseConfig from '@dp-system/eslint-config/base';
import nestConfig from '@dp-system/eslint-config/nest';
import reactConfig from '@dp-system/eslint-config/react';

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'],
  },
  ...baseConfig,
  ...reactConfig,
  ...nestConfig,
];
