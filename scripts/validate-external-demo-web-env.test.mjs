import assert from 'node:assert/strict';
import test from 'node:test';
import { validateExternalDemoWebEnvironment } from './validate-external-demo-web-env.mjs';

test('accepts the exact external HTTPS API base URL', () => {
  assert.doesNotThrow(() =>
    validateExternalDemoWebEnvironment({
      VITE_DEMO_ENV: 'external-demo',
      VITE_DEMO_MODE: 'true',
      VITE_API_URL: 'https://external-api.example/api',
    }),
  );
});

for (const value of [
  'http://external-api.example/api',
  'https://localhost:53000/api',
  'https://external-api.example/api/',
  'https://external-api.example/api?debug=true',
]) {
  test(`rejects unsafe external API URL: ${value}`, () => {
    assert.throws(
      () =>
        validateExternalDemoWebEnvironment({
          VITE_DEMO_ENV: 'external-demo',
          VITE_DEMO_MODE: 'true',
          VITE_API_URL: value,
        }),
      /VITE_API_URL/u,
    );
  });
}

test('does not constrain non-external builds', () => {
  assert.doesNotThrow(() => validateExternalDemoWebEnvironment({}));
});
