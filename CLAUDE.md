# Feedr Project Guide

## Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run generate`: Generate static site
- `npm run preview`: Preview production build
- `npx vue-tsc --noEmit`: Type check TypeScript files
- `npm run test:e2e:debug`: Run E2E tests with debug mode enabled (recommended for test development)
- `npm run test:e2e:ci`: Run E2E tests with CI settings (condensed output, fail fast)
- `npm run test:e2e:fast`: Run E2E tests with minimal reporting (for quick feedback)
- `npm run test:e2e:ui`: Run E2E tests with Playwright's UI mode

## Code Style
- **Components**: Use Vue 3 Composition API with `<script setup>` syntax; PascalCase for component names
- **TypeScript**: Always use strong typing; explicit return types; interfaces in `types/` folder
- **Imports**: Group by source (Vue core, composables, external); use aliasing (`~/components/`)
- **Naming**: camelCase for variables/functions; boolean variables with `is`/`has` prefix
- **Error Handling**: Try/catch for async; user-facing errors via toast notifications
- **State Management**: Composables for shared state; Vue 3 reactive system (`ref`, `computed`)
- **Styling**: @nuxt/ui and TailwindCSS; use scoped styles with minimal custom CSS

## Project Structure
- Nuxt 3 application (SSR disabled)
- AWS Amplify for backend/auth
- i18n for internationalization (en, fr, es)
- Component-based architecture with Vue 3
- **Dashboard**: Reference the `dashboard-example` folder which contains the official Nuxt UI Pro template/example for UI patterns and component structure when implementing dashboard features
- **.features**: Simple feature tracking system that acts like a mini JIRA. Each new feature gets a dedicated folder containing specification documents that outline goals and implementation steps, along with any reference materials needed during development.

## E2E Testing with Playwright
The project includes specialized Playwright tooling with debug capabilities:

### Important Testing Guidelines
- **ALWAYS USE DATA ATTRIBUTES**: When writing tests, feel free to add `data-testid` attributes to components to make them easier to target. This is the PREFERRED approach for test stability.
- Use `await page.captureDebug('descriptive-name')` at key points in your tests to capture the state for debugging.
- Run tests with `npm run test:e2e:debug` to enable debug mode with detailed artifact generation.

### Debug Reporter and Artifacts
- Custom debug reporter saves detailed test artifacts to `/debug-artifacts/` directory:
  - HTML snapshots of the page at capture points
  - Screenshots at debug capture points
  - Traces for test failures (can be viewed with `npx playwright show-trace`)
  - JSON summaries of test execution
- This makes it much easier to debug test failures and understand the state of the application during tests
- Artifacts are organized by test name and capture point

### Test Utilities
- Use the enhanced test function from `./utils/debug-test.ts` which adds debug capabilities
- Key debug methods available on the `page` object:
  - `page.captureDebug('capture-name')`: Captures current page state
  - `page.logDomStructure('selector')`: Logs DOM structure of specified element
- The debug-test implementation automatically captures state after navigation

### Writing Effective Tests
- Add multiple capture points with descriptive names
- Use `page.captureDebug()` before and after key interactions
- Write tests that focus on user interactions and visible UI elements
- When tests fail, examine the debug artifacts to understand why
- For complex selectors, add data-testid attributes to the components
- Use `test.skip()` when a test is not ready or environment-dependent