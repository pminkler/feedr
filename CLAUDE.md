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

### Important Testing Guidelines
- **ALWAYS USE DATA ATTRIBUTES**: When writing tests, feel free to add `data-testid` attributes to components to make them easier to target. This is the PREFERRED approach for test stability.
- Run tests with `npm run test:e2e:debug` for more detailed logs, `npm run test:e2e:ui` for Playwright's UI mode, or `npm run test:e2e:fast` for quick feedback.

### Writing Effective Tests
- Write tests that focus on user interactions and visible UI elements
- For complex selectors, add data-testid attributes to the components
- Use `test.skip()` when a test is not ready or environment-dependent
- Use Playwright's built-in debugging tools when needed (traces, screenshots, etc.)