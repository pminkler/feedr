# Feedr Project Guide

## Commands
- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm generate`: Generate static site
- `pnpm preview`: Preview production build
- `pnpm exec vue-tsc --noEmit`: Type check TypeScript files

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