// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    server: {
      allowedHosts: ["7d23-98-156-225-149.ngrok-free.app"],
    },
    optimizeDeps: {
      exclude: [
        '@aws-amplify/backend',
        '@aws-amplify/backend-cli',
        '@aws-amplify/backend-auth',
        '@aws-amplify/backend-data',
        '@aws-amplify/backend-storage',
        '@aws-amplify/backend-function'
      ]
    },
    build: {
      rollupOptions: {
        external: [
          '@aws-amplify/backend',
          '@aws-amplify/backend-cli',
          '@aws-amplify/backend-auth',
          '@aws-amplify/backend-data',
          '@aws-amplify/backend-storage',
          '@aws-amplify/backend-function'
        ]
      }
    }
  },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      meta: [
        {
          name: "impact-site-verification",
          content: "2f7533de-4e65-481d-a968-fce5f60daa38",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
      ],
    },
  },
  typescript: {
    typeCheck: true,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  devServer: {
    port: 3000,
  },
  modules: [
    "@nuxt/ui-pro",
    "nuxt-gtag",
    "@nuxtjs/i18n",
    [
      "@nuxtjs/google-fonts",
      {
        families: {
          Nunito: true,
        },
        display: "swap",
      },
    ],
  ],
  ssr: false,
  gtag: {
    id: "G-V6CPTYFL59",
  },
  i18n: {
    locales: [
      {
        code: "en",
        name: "English",
      },
      {
        code: "es",
        name: "Español",
      },
      {
        code: "fr",
        name: "Français",
      },
    ],
  },
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: "2024-07-11",
});