import { pathToFileURL } from 'node:url';
import process from 'node:process';

/* global URL, console */

export function validateExternalDemoWebEnvironment(environment) {
  if (environment.VITE_DEMO_ENV !== 'external-demo') return;
  if (environment.VITE_DEMO_MODE !== 'true') {
    throw new Error('External demo web build refused: VITE_DEMO_MODE');
  }
  const value = environment.VITE_API_URL;
  if (!value) throw new Error('External demo web build refused: VITE_API_URL');
  let apiUrl;
  try {
    apiUrl = new URL(value);
  } catch {
    throw new Error('External demo web build refused: VITE_API_URL');
  }
  if (
    apiUrl.protocol !== 'https:' ||
    ['localhost', '127.0.0.1', '::1'].includes(apiUrl.hostname) ||
    apiUrl.pathname !== '/api' ||
    apiUrl.search ||
    apiUrl.hash ||
    apiUrl.origin + apiUrl.pathname !== value
  ) {
    throw new Error('External demo web build refused: VITE_API_URL');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateExternalDemoWebEnvironment(process.env);
    console.log('External demo web environment confirmed.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'External demo web build refused');
    process.exitCode = 1;
  }
}
