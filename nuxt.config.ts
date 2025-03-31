// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/ui-pro',
    'nuxt-gtag',
    '@nuxtjs/i18n',
    [
      '@nuxtjs/google-fonts',
      {
        families: {
          Nunito: true,
        },
        display: 'swap',
      },
    ],
    '@sentry/nuxt/module',
    '@nuxt/eslint',
  ],

  ssr: false,

  devtools: { enabled: true },

  app: {
    head: {
      title: 'Feedr - Get to the Recipe',
      meta: [
        {
          name: 'impact-site-verification',
          content: '721e4d03-55c1-4d38-b766-5a438281f01b',
        },
        {
          name: 'description',
          content:
            'Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.',
        },
        {
          name: 'og:title',
          content: 'Feedr - Get to the Recipe',
        },
        {
          name: 'og:description',
          content:
            'Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.',
        },
        {
          name: 'og:image',
          content: 'https://feedr.app/web-app-manifest-512x512.png',
        },
        {
          name: 'og:url',
          content: 'https://feedr.app',
        },
        {
          name: 'og:type',
          content: 'website',
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          name: 'twitter:title',
          content: 'Feedr - Get to the Recipe',
        },
        {
          name: 'twitter:description',
          content:
            'Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.',
        },
        {
          name: 'twitter:image',
          content: 'https://feedr.app/web-app-manifest-512x512.png',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        {
          rel: 'canonical',
          href: 'https://feedr.app',
        },
      ],
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      nodeEnv: process.env.NUXT_PUBLIC_NODE_ENV || 'development',
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      },
    },
  },

  sourcemap: {
    client: 'hidden',
  },

  devServer: {
    port: 3000,
  },

  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-03-26',

  vite: {
    server: {
      allowedHosts: ['7d23-98-156-225-149.ngrok-free.app'],
    },
    optimizeDeps: {
      exclude: [
        '@aws-amplify/backend',
        '@aws-amplify/backend-cli',
        '@aws-amplify/backend-auth',
        '@aws-amplify/backend-data',
        '@aws-amplify/backend-storage',
        '@aws-amplify/backend-function',
      ],
    },
    build: {
      rollupOptions: {
        external: [
          '@aws-amplify/backend',
          '@aws-amplify/backend-cli',
          '@aws-amplify/backend-auth',
          '@aws-amplify/backend-data',
          '@aws-amplify/backend-storage',
          '@aws-amplify/backend-function',
        ],
      },
      // Strip console.log statements in production while keeping console.warn and console.error
      minify: 'terser',
      terserOptions: {
        compress: {
          pure_funcs:
            process.env.NODE_ENV === 'production'
              ? ['console.log', 'console.debug', 'console.info']
              : [],
        },
      },
    },
  },

  typescript: {
    typeCheck: true,
  },

  eslint: {
    config: {
      stylistic: {
        indent: 2,
        quotes: 'single',
        semi: true,
        comma: 'always',
        typeColons: 'always',
        blockSpacing: true,
        objectCurlySpacing: 'always',
        arrBracketSpacing: 'never',
        arrowParens: 'always',
        trailingComma: 'es5',
      },
    },
  },

  gtag: {
    id: 'G-V6CPTYFL59',
  },

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      {
        code: 'en',
        name: 'English',
      },
      {
        code: 'es',
        name: 'Español',
      },
      {
        code: 'fr',
        name: 'Français',
      },
    ],
  },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'divx-llc',
      project: 'feedr',
    },
  },
});
