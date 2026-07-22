import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { queryClient } from '@/lib/queryClient';

afterEach(() => {
  cleanup();
  queryClient.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});
