import { assertExternalDemoEnvironment } from '../src/demo-access/external-demo-environment';

try {
  assertExternalDemoEnvironment(process.env);
  console.log('External demo target confirmed.');
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : 'External demo target refused');
  process.exitCode = 1;
}
