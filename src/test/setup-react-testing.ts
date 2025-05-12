
// This file provides proper re-exports for React Testing Library
// to fix the import issues across test files

import * as rtl from '@testing-library/react';

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Explicitly define missing exports to avoid TypeScript errors
export const screen = rtl.screen;
export const fireEvent = rtl.fireEvent;
export const waitFor = rtl.waitFor;
export const act = rtl.act;
