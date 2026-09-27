import { describe, expect, it } from 'vitest';
import { safeInternalPath } from './safeInternalPath';

describe('safeInternalPath', () => {
  it.each(['/employees', '/dashboard'])('allows the internal path %s', (path) => {
    expect(safeInternalPath(path)).toBe(path);
  });

  it.each([
    '//evil.example',
    '\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
    'data:text/html,<h1>unsafe</h1>',
  ])('rejects the external or unsafe destination %s', (path) => {
    expect(safeInternalPath(path)).toBe('/');
  });
});
