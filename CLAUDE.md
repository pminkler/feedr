# Feedr Project Guide

## Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run generate`: Generate static site
- `npm run preview`: Preview production build
- `npx vue-tsc --noEmit`: Type check TypeScript files
- `npm run test:e2e:claude`: Run E2E tests with Claude tooling enabled
- `npx playwright test --reporter=line --project=chromium`: Run Playwright tests with condensed output, only for Chromium

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

## Claude Playwright Tools
The project includes specialized Playwright tooling designed for Claude:

- Always use `npm run test:e2e:claude` when running tests with Claude to ensure proper artifact generation
- Use Claude-specific test utilities in E2E tests:
  - `claudeTest`: Enhanced test function that provides additional context
  - `captureHtml`: Captures HTML snapshots with optional screenshots and annotations
  - `createTestReport`: Generates comprehensive test reports including accessibility checks
  - `suggestSelectors`: Provides recommendations for robust element selectors
- Key files and locations:
  - Test files: `/e2e/*.spec.ts`
  - Claude utilities: `/e2e/utils/claude/`
  - Test artifacts: `/test-artifacts/`
- When writing new tests, always:
  - Use `claudeTest` instead of regular Playwright test
  - Add multiple capture points with annotations to document test flow
  - Create test reports at key stages of test execution
  - Verify both loading states and final UI states