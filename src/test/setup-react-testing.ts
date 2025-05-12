
// This file provides proper re-exports for React Testing Library
// to fix the import issues across test files

import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Explicitly define missing exports using proper direct imports
export const screen = require('@testing-library/react').screen;
export const fireEvent = require('@testing-library/react').fireEvent;
export const waitFor = require('@testing-library/react').waitFor;
export const act = require('@testing-library/react').act;

// Custom render function (can be extended as needed)
export { render };
