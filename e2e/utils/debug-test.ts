import type { Page, Response } from '@playwright/test';
import { test as baseTest } from '@playwright/test';
import { captureDebugState, logDomStructure } from './test-helpers';

// Define interface for enhanced page with debug capabilities
interface DebugPage extends Page {
  captureDebug: (name?: string) => Promise<void>;
  logDomStructure: (selector: string, depth?: number) => Promise<void>;
}

/**
 * Enhanced test fixture that includes debug capabilities
 */
export const test = baseTest.extend({
  page: async ({ page }, use, testInfo) => {
    // Add debug-related methods to page
    const debugPage = page as unknown as DebugPage;

    // Method to capture debug state
    debugPage.captureDebug = async (name = 'debug-capture') => {
      await captureDebugState(page, testInfo, name);
    };

    // Method to log DOM structure
    debugPage.logDomStructure = async (selector: string, depth = 3) => {
      await logDomStructure(page, selector, depth);
    };

    // Override goto to automatically capture state after navigation
    const originalGoto = page.goto.bind(page);
    debugPage.goto = async (url: string, options?: Parameters<Page['goto']>[1]): Promise<Response | null> => {
      const response = await originalGoto(url, options);
      if (process.env.DEBUG_MODE === 'true') {
        await captureDebugState(page, testInfo, `navigation-to-${url.replace(/[^a-zA-Z0-9]/g, '-')}`);
      }
      return response;
    };

    await use(debugPage);
  },
});

export { expect } from '@playwright/test';
